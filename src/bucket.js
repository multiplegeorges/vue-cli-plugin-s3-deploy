import { error, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'
import mime from 'mime-types'
import { regex, globbyMatch } from './helper'

class Bucket {
  constructor (name, options = {}, connection) {
    if (!name) throw new TypeError('Bucket name must be defined.')
    if (!name.match(regex.bucketName)) {
      throw new TypeError(`
        Bucket name is invalid.
        Bucket name must use only lowercase alpha numeric characters, dots and hyphens. see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
      `)
    }
    if (!connection) throw new TypeError('Bucket requires a connection.')

    this.name = name
    this.options = options
    this.connection = connection
  }

  async validate () {
    const params = { Bucket: this.name }

    try {
      return await this.connection.headBucket(params).promise()
    } catch (e) {
      const message = e.toString().toLowerCase()

      if (message.includes('forbidden')) {
        throw new Error(`Bucket: ${this.name} exists, but you do not have permission to access it.`)
      } else if (message.includes('notfound')) {
        if (this.options.createBucket) {
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

  async createBucket () {
    const params = {
      CreateBucketConfiguration: { LocationConstraint: this.options.region },
      Bucket: this.name,
      ACL: this.options.acl
    }

    try {
      await this.connection.createBucket(params).promise()
    } catch (e) {
      error(`Bucket: ${this.name} could not be created.`)
      throw new Error(`AWS Error: ${e.toString()}`)
    }
  }

  async enableHosting () {
    const params = {
      Bucket: this.name,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: this.options.staticErrorPage
        },
        IndexDocument: {
          Suffix: this.options.staticIndexPage
        }
      }
    }

    if (this.options.staticWebsiteConfiguration) {
      params.WebsiteConfiguration = this.options.staticWebsiteConfiguration
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

  uploadFile (fileKey, fileStream, uploadOptions) {
    const uploadFileKey = fileKey.replace(this.options.fullAssetPath, '').replace(/\\/g, '/')
    const fullFileKey = `${this.options.deployPath}${uploadFileKey}`

    const uploadParams = {
      Bucket: this.name,
      Key: fullFileKey,
      Body: fileStream,
      ContentType: this.contentTypeFor(fileKey)
    }

    if (uploadOptions.acl !== 'none') {
      uploadParams.ACL = this.options.acl
    }

    const cacheControlPerFileMatch = this.matchesCacheControlPerFile(fullFileKey)

    if (uploadOptions.pwa) {
      uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    } else if (cacheControlPerFileMatch) {
      uploadParams.CacheControl = cacheControlPerFileMatch
    } else {
      uploadParams.CacheControl = this.options.cacheControl
    }

    if (uploadOptions.gzip) {
      uploadParams.ContentEncoding = 'gzip'
    }

    return this.connection.upload(
      uploadParams,
      { partSize: (5 * 1024 * 1024), queueSize: 4 }
    ).promise()
  }

  matchesCacheControlPerFile (fullFileKey) {
    const match = Object.keys(this.options.cacheControlPerFile).find(
      pattern => globbyMatch(this.options, pattern, fullFileKey)
    )

    return match
      ? this.options.cacheControlPerFile[match]
      : false
  }

  contentTypeFor (filename) {
    return mime.lookup(filename) || 'application/octet-stream'
  }
}

export default Bucket
