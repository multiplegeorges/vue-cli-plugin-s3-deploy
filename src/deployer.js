import AWS from 'aws-sdk'
import path from 'path'
import globby from 'globby'
import Bucket from './bucket'
import PromisePool from 'es6-promise-pool'

class Deployer {
  constructor (config) {
    if (!config) throw new TypeError('Configuration is required.')

    config.awsConfig = {
      region: config.options.region,
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    }

    config.uploadOptions = {
      partSize: (5 * 1024 * 1024),
      queueSize: 4
    }

    // path.sep appends a trailing / or \ depending on platform.
    config.fullAssetPath = path.join(process.cwd(), config.options.assetPath) + path.sep
    config.deployPath = this.deployPath(config.options.deployPath)

    config.fileList = globby.sync(
      config.options.assetMatch,
      { cwd: config.fullAssetPath }
    ).map(file => path.join(config.fullAssetPath, file))

    config.remotePath = config.options.staticHosting ?
      `https://s3-${config.options.region}.amazonaws.com/${config.options.bucket}/`
      :
      `https://${config.options.bucket}.s3-website-${config.options.region}.amazonaws.com/`

    this.config = config
  }

  async openConnection () {
    if (this.config.options.awsProfile !== 'default') {
      let credentials = new AWS.SharedIniFileCredentials({
        profile: this.config.options.awsProfile
      })

      this.config.awsConfig.credentials = credentials
    }

    AWS.config.update(this.config.awsConfig)
    this.connection = new AWS.S3()
  }

  async run () {
    this.bucket = new Bucket(
      this.config.options.bucket,
      {
        fullAssetPath: this.config.fullAssetPath,
        createBucket: this.config.options.createBucket,
        acl: this.config.options.acl,
        staticErrorPage: this.config.options.staticErrorPage,
        staticIndexPage: this.config.options.staticIndexPage,
        staticWebsiteConfiguration: this.config.options.staticWebsiteConfiguration
      },
      this.connection
    )

    try {
      await this.bucket.validate()
    } catch (e) {
      // Validation failed, so try to correct the error.
      await this.bucket.createBucket()
      if (this.options.staticHosting) await bucket.enableHosting()
    }

    info(`Deploying ${this.config.fileList.length} assets from ${this.config.fullAssetPath} to ${this.config.remotePath}`)

    this.uploadCount = 0
    this.uploadTotal = this.config.fileList.length

    const uploadPool = new PromisePool(this.uploadNextFile, parseInt(this.config.options.uploadConcurrency, 10))

    try {
      await uploadPool.start()
      info('Deployment complete.')

      if (options.enableCloudfront) {
        invalidateDistribution(options)
      }
    } catch (uploadErr) {
      error(`Deployment encountered errors.`)
      throw new Error(`Upload error: ${uploadErr.toString()}`)
    }
  }

  async uploadNextFile () {
    if (this.config.fileList.length === 0) return null

    let filename = this.config.fileList.pop()
    let fileStream = fs.readFileSync(filename)
    let fileKey = filename.replace(fullAssetPath, '').replace(/\\/g, '/')
    let fullFileKey = `${this.config.deployPath}${fileKey}`
    let pwaSupportForFile = this.config.options.pwa && this.config.options.pwaFiles.split(',').indexOf(fileKey) > -1

    try {
      await this.bucket.uploadFile(fullFileKey, fileStream, {
        pwa: pwaSupportForFile
      })

      this.uploadCount++
      let pwaMessage = pwaSupportForFile ? ' with cache disabled for PWA' : ''
      info(`(${uploadCount}/${uploadTotal}) Uploaded ${fullFileKey}${pwaMessage}`)
    } catch (uploadError) {
      error(`Upload failed for ${fullFileKey}`)
      throw new Error(`Upload Error: ${uploadError.toString()}`)
    }
  }

  deployPath (path) {
    let fixedPath

    // We don't need a leading slash for root deploys on S3.
    if (path.startsWith('/')) fixedPath = path.slice(1, path.length)
    // But we do need to make sure there's a trailing one on the path.
    if (!path.endsWith('/') && path.length > 0) fixedPath = path + '/'

    return fixedPath
  }

  exitWithError (message = 'Deployment terminated.') {
    throw message
  }
}

export default Deployer