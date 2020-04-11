import path from 'path'
import fs from 'fs'
import zlib from 'zlib'
import { error, info } from '@vue/cli-shared-utils'

import PromisePool from 'es6-promise-pool'

import Bucket from './bucket'
import { globbyMatch, globbySync } from './helper'

class Deployer {
  constructor (config) {
    if (!config) {
      throw new TypeError('Configuration is required.')
    }

    const opt = config.options

    // path.sep appends a trailing / or \ depending on platform.
    config.fullAssetPath = path.join(process.cwd(), opt.localAssetPath) + path.sep
    config.s3DeployPath = this.fixDeployPath(opt.s3DeployPath)

    config.fileList = globbySync(config, opt.localAssetMatch, true)
    config.pwaFileList = globbySync(config, opt.pwaFiles, true)

    config.remotePath = opt.staticHosting
      ? `https://${opt.s3BucketName}.s3-website-${opt.awsRegion}.amazonaws.com/`
      : `https://s3-${opt.awsRegion}.amazonaws.com/${opt.s3BucketName}/`

    this.config = config
  }

  uploadNextFile () {
    if (this.config.fileList.length === 0) {
      return null
    }

    const filename = this.config.fileList.pop()
    let fileStream = fs.readFileSync(filename)
    const fileKey = filename.replace(this.config.fullAssetPath, '').replace(/\\/g, '/')
    const fullFileKey = `${this.config.s3DeployPath}${fileKey}`
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

  fixDeployPath (path) {
    let fixedPath

    // We don't need a leading slash for root deploys on S3.
    if (path.startsWith('/')) fixedPath = path.slice(1, path.length)
    // But we do need to make sure there's a trailing one on the path.
    if (!path.endsWith('/') && path.length > 0) fixedPath = path + '/'

    return fixedPath
  }

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

    info(`Deploying ${this.config.fileList.length} assets from ${this.config.fullAssetPath} to ${this.config.remotePath}`)

    this.uploadCount = 0
    this.uploadTotal = this.config.fileList.length

    const uploadPool = new PromisePool(
      this.uploadNextFile.bind(this),
      parseInt(this.config.options.uploadConcurrency, 10)
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
