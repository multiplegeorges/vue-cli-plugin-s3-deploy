import path from 'path'
import fs from 'fs'
import zlib from 'zlib'
import { error, info, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'

import AWS from 'aws-sdk'
import PromisePool from 'es6-promise-pool'

import Bucket from './bucket'
import { globbyMatch, globbySync } from './helper'

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

    if (config.options.overrideEndpoint) {
      config.awsConfig.endpoint = config.options.endpoint
    }

    // path.sep appends a trailing / or \ depending on platform.
    config.fullAssetPath = path.join(process.cwd(), config.options.assetPath) + path.sep
    config.deployPath = this.deployPath(config.options.deployPath)

    config.fileList = globbySync(config, config.options.assetMatch, true)
    config.pwaFileList = globbySync(config, config.options.pwaFiles, true)

    config.remotePath = config.options.staticHosting
      ? `https://${config.options.bucket}.s3-website-${config.options.region}.amazonaws.com/`
      : `https://s3-${config.options.region}.amazonaws.com/${config.options.bucket}/`

    this.config = config
  }

  async openConnection () {
    if (this.config.options.awsProfile !== 'default') {
      // ToDo: Catch error
      this.config.awsConfig.credentials = await new AWS.SharedIniFileCredentials({
        profile: this.config.options.awsProfile
      }).promise()
    }

    AWS.config.update(this.config.awsConfig)
    this.connection = new AWS.S3()
    info('Connection to S3 created.')
  }

  async run () {
    this.bucket = new Bucket(
      this.config.options.bucket,
      {
        region: this.config.options.region,
        fullAssetPath: this.config.fullAssetPath,
        deployPath: this.config.deployPath,
        createBucket: this.config.options.createBucket,
        acl: this.config.options.acl,
        staticErrorPage: this.config.options.staticErrorPage,
        staticIndexPage: this.config.options.staticIndexPage,
        staticWebsiteConfiguration: this.config.options.staticWebsiteConfiguration,
        cacheControl: this.config.options.cacheControl
      },
      this.connection
    )

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

    info(`Deploying ${this.config.fileList.length} assets from ${this.config.fullAssetPath} to ${this.config.remotePath}`)

    this.uploadCount = 0
    this.uploadTotal = this.config.fileList.length

    const uploadPool = new PromisePool(this.uploadNextFile.bind(this), parseInt(this.config.options.uploadConcurrency, 10))

    try {
      await uploadPool.start()

      info('Deployment complete.')

      if (this.config.options.enableCloudfront) {
        await this.invalidateDistribution()

        info('Cloudfront invalidated.')
      }
    } catch (uploadErr) {
      error('Deployment encountered errors.')
      throw new Error(`Upload error: ${uploadErr.toString()}`)
    }
  }

  uploadNextFile () {
    if (this.config.fileList.length === 0) {
      return null
    }

    const filename = this.config.fileList.pop()
    let fileStream = fs.readFileSync(filename)
    const fileKey = filename.replace(this.config.fullAssetPath, '').replace(/\\/g, '/')
    const fullFileKey = `${this.config.deployPath}${fileKey}`
    const pwaSupportForFile = this.config.options.pwa && globbyMatch(this.config, this.config.options.pwaFiles, fullFileKey)
    const gzipSupportForFile = this.config.options.gzip && globbyMatch(this.config, this.config.options.gzipFilePattern, fullFileKey)

    if (gzipSupportForFile) {
      fileStream = zlib.gzipSync(fileStream, { level: 9 })
    }

    try {
      return this.bucket.uploadFile(fullFileKey, fileStream, {
        pwa: pwaSupportForFile,
        gzip: gzipSupportForFile
      }).then(() => {
        this.uploadCount++
        const pwaMessage = pwaSupportForFile ? ' with cache disabled for PWA' : ''
        info(`(${this.uploadCount}/${this.uploadTotal}) Uploaded ${fullFileKey}${pwaMessage}`)
      })
    } catch (uploadError) {
      throw new Error(`(${this.uploadCount}/${this.uploadTotal}) Upload failed: ${fullFileKey}. AWS Error: ${uploadError.toString()}.`)
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

  async invalidateDistribution () {
    const cloudfront = new AWS.CloudFront()
    const invalidationItems = this.config.options.cloudfrontMatchers.split(',')

    const params = {
      DistributionId: this.config.options.cloudfrontId,
      InvalidationBatch: {
        CallerReference: `vue-cli-plugin-s3-deploy-${Date.now().toString()}`,
        Paths: {
          Quantity: invalidationItems.length,
          Items: invalidationItems
        }
      }
    }

    try {
      logWithSpinner(`Invalidating CloudFront distribution: ${this.config.options.cloudfrontId}`)

      const data = await cloudfront.createInvalidation(params).promise()

      info(`Invalidation ID: ${data.Invalidation.Id}`)
      info(`Status: ${data.Invalidation.Status}`)
      info(`Call Reference: ${data.Invalidation.InvalidationBatch.CallerReference}`)
      info('See your AWS console for on-going status on this invalidation.')

      stopSpinner()
    } catch (err) {
      stopSpinner(false)

      error('Cloudfront Error!!')
      error(`Code: ${err.code}`)
      error(`Message: ${err.message}`)
      error(`AWS Request ID: ${err.requestId}`)

      throw new Error('Cloudfront invalidation failed!')
    }
  }
}

export default Deployer
