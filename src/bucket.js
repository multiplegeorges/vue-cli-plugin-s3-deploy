import mime from 'mime-types'
import AwsConnection from './connection'
import { error, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'
import { regex, globbyMatch, errorMessages } from './helper'

/**
 *
 */
class Bucket {
  constructor (config) {
    this.config = config
    this.name = config.options.s3BucketName
    this.connection = new AwsConnection(config.options).s3()

    if (!this.name) {
      throw new TypeError('Bucket name must be defined.')
    }

    if (!this.name.match(regex.bucketName)) {
      throw new TypeError(errorMessages.s3BucketName)
    }

    if (!this.connection) {
      throw new TypeError('Bucket requires a connection.')
    }
  }

  /**
   *
   * @returns {Promise<PromiseResult<{}, AWSError>>}
   */
  async validate () {
    const params = { Bucket: this.name }

    try {
      return await this.connection.headBucket(params).promise()
    } catch (e) {
      const message = e.toString().toLowerCase()

      if (message.includes('forbidden')) {
        throw new Error(`Bucket: ${this.name} exists, but you do not have permission to access it.`)
      } else if (message.includes('notfound')) {
        if (this.config.options.s3BucketCreate) {
          logWithSpinner(`Bucket: creating bucket ${this.name} ...`)
          await this.createBucket()
          stopSpinner()
        } else {
          throw new Error(`Bucket: ${this.name} not found.`)
        }
      } else {
        error(`Bucket: ${this.name} could not be validated.`)
        throw new Error(`AWS Error: ${e.toString()}`)
      }
    }
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async createBucket () {
    const params = {
      CreateBucketConfiguration: {
        LocationConstraint: this.config.options.awsRegion
      },
      Bucket: this.name,
      ACL: this.config.options.s3ACL
    }

    try {
      await this.connection.createBucket(params).promise()
    } catch (e) {
      error(`Bucket: ${this.name} could not be created.`)
      throw new Error(`AWS Error: ${e.toString()}`)
    }
  }

  /**
   *
   * @returns {Promise<void>}
   */
  async enableHosting () {
    const params = {
      Bucket: this.name,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: this.config.options.s3StaticErrorPage
        },
        IndexDocument: {
          Suffix: this.config.options.s3StaticIndexPage
        }
      }
    }

    if (this.config.options.s3StaticWebsiteConfiguration) {
      params.WebsiteConfiguration = this.config.options.s3StaticWebsiteConfiguration
    }

    try {
      logWithSpinner('Bucket: enabling static hosting...')
      await this.connection.putBucketWebsite(params).promise()
      stopSpinner()
    } catch (e) {
      error(`Static hosting could not be enabled on bucket: ${this.name}`)
      throw new Error(`AWS Error: ${e.toString()}`)
    }
  }

  /**
   *
   * @param fileKey
   * @param fileStream
   * @param uploadOptions
   * @returns {Promise<ManagedUpload.SendData>}
   */
  uploadFile (fileKey, fileStream, uploadOptions) {
    const uploadParams = {
      Bucket: this.name,
      Key: fileKey,
      ACL: this.config.options.s3ACL,
      Body: fileStream,
      ContentType: this.contentTypeFor(fileKey)
    }

    if (uploadOptions.acl !== 'none') {
      uploadParams.ACL = this.config.options.s3ACL
    }

    const cacheControlPerFileMatch = this.matchesCacheControlPerFile(fileKey)

    if (uploadOptions.pwa) {
      uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    } else if (cacheControlPerFileMatch) {
      uploadParams.CacheControl = cacheControlPerFileMatch
    } else {
      uploadParams.CacheControl = this.config.options.s3CacheControl
    }

    if (uploadOptions.gzip) {
      uploadParams.ContentEncoding = 'gzip'
    }

    return this.connection.upload(
      uploadParams,
      { partSize: (5 * 1024 * 1024), queueSize: 4 }
    ).promise()
  }

  /**
   *
   * @param fullFileKey
   * @returns {*}
   */
  matchesCacheControlPerFile (fullFileKey) {
    const match = Object.keys(this.config.options.s3CacheControlPerFile).find(
      pattern => globbyMatch(this.config.options, pattern, fullFileKey)
    )

    return match
      ? this.config.options.s3CacheControlPerFile[match]
      : false
  }

  /**
   * Fetch the mimetype based on filename
   * @param filename
   * @returns {*|string}
   */
  contentTypeFor (filename) {
    return mime.lookup(filename) || 'application/octet-stream'
  }

  // async cleanBucket (config) {
  //   const params = {
  //     Bucket: config.bucketName,
  //     Prefix: config.bucketPrefix
  //   }
  //
  //   this.connection.listObjects(params).promise()
  // }
}

export default Bucket
