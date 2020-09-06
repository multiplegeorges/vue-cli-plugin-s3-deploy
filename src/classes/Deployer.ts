import path from 'path'
import fs from 'fs'
import micromatch from 'micromatch'
import mime from 'mime-types'
import { error, info } from '@vue/cli-shared-utils'
import PromisePool from 'es6-promise-pool'
import globby from 'globby'

import Bucket from './Bucket'
import Asset from './Asset'

interface ICacheMatch {
  pattern: string[]
  cache: string
}

interface IOpt {
  globbyOptions: any
  localAssetMatch: string[]
  localAssetPath: string
  bucketPath: string
  pwaMatch: string[]
  gzipMatch: string[]
  cacheMatch?: ICacheMatch[]
}

class Deployer {

  opt: IOpt = {
    globbyOptions: {},
    localAssetMatch: [],
    localAssetPath: 'dist/',
    bucketPath: '/',
    pwaMatch: [],
    gzipMatch: [],
    cacheMatch: []
  }

  queue: [] = []
  uploadCount = 0
  uploadTotal = 0

  constructor (config) {
    if (!config) {
      throw new TypeError('Configuration is required.')
    }

    // list of files to deploy
    this.queue = this.populateQueue();

    this.opt.remotePath = config.staticHosting
      ? `https://${opt.bucket.name}.s3-website-${opt.aws.region}.amazonaws.com/`
      : `https://s3-${opt.aws.region}.amazonaws.com/${opt.bucket.name}/`

    this.uploadCount = 0
    this.uploadTotal = this.queue.length
  }

  getBucketPath() {
    let bucketPath = this.opt.bucketPath

    // We don't need a leading slash for root deploys on S3.
    if (bucketPath.startsWith('/')) {
        bucketPath = bucketPath.slice(1, bucketPath.length)
    }

    // But we do need to make sure there's a trailing one on the opt.bucket.path.
    if (!bucketPath.endsWith('/') && bucketPath.length > 0) {
        bucketPath = bucketPath + '/'
    }
    
    return bucketPath;
  }

  getSourcePath() {
    return path.join(process.cwd(), this.opt.localAssetPath) + path.sep
  }

  getFileBucketPath(fileSource) {
    fileSource = fileSource.replace(this.getSourcePath(), '').replace(/\\/g, '/')
    return path.join(this.getBucketPath(), fileSource);
  }

  // add mathcing files to queue
  populateQueue() {
    const sourcePath = this.getSourcePath();

    this.opt.globbyOptions.cwd = sourcePath;

    // collect files to deploy
    return globby.sync(sourcePath, this.opt.globbyOptions).map(sourceFilePath => {
      return new Asset(
        sourceFilePath,
        this.getFileBucketPath(sourceFilePath)
      )
    })
  }

  getCacheControl(file) {
    const source = file.source;
    let cacheControl = this.opt.defaultCacheControl

    // check for PWA
    if (micromatch.isMatch(source, this.opt.pwaMatch)) {
      cacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    }

    this.opt.cacheMatch.map(option => {
      if (micromatch.isMatch(source, option.pattern)) {
        cacheControl = option.cache
      }
    })

    return cacheControl
  }

  // update params on each file in queue
  async processQueue() {
    this.queue.map(file => {
      const source = file.source

      if (micromatch.isMatch(source, this.opt.gzipMatch)) {
        file.gzipMatch = true
      }

      file.cacheControl = this.getCacheControl(file)

      file.type = mime.lookup(file.source) || 'application/octet-stream'
      file.size = fs.statSync(file.source).size

      file.acl = this.opt.defaultAcl

      return file
    })
  }



  /**
   *
   * @returns {Promise<ManagedUpload.SendData>|null}
   */
  uploadNextFile () {
    if (this.queue.length < 1) {
      return null
    }

    const file = this.queue.pop();

    try {
      await this.bucket.uploadFile(file)

      this.uploadCount++

      info(`(${this.uploadCount}/${this.uploadTotal}) Uploaded ${file.source} ${file.pwa ? '[PWA]' : ''} [${file.size}]`)
    } catch (uploadError) {
      throw new Error(`(${this.uploadCount}/${this.uploadTotal}) Upload failed: ${file.source}. AWS Error: ${uploadError.toString()}.`)
    }
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async run () {
    this.bucket = new Bucket(this.config)

    try {
      await this.bucket.validate()
      if (this.config.options.staticUpdate) await this.bucket.enableHosting()
    } catch (e) {
      // Bucket validation failed, so try to correct the error, but
      // let the error bubble up from here. We can't fix it.
      // It's probably a permissions issue in AWS.
      await this.bucket.createBucket()
      if (this.config.options.staticHosting) await this.bucket.enableHosting()
    }

    info(`Deploying ${this.uploadTotal} assets from ${this.opt.localAssetPath} to ${this.remotePath}`)

    const uploadPool = new PromisePool(
      this.uploadNextFile(),
      parseInt(this.opt.uploadConcurrency, 10)
    )

    try {
      await uploadPool.start()
      info('Deployment complete.')
    } catch (uploadErr) {
      error('Deployment encountered errors.')
      throw new Error(`Upload error: ${uploadErr.toString()}`)
    }
  }
}

export default Deployer
