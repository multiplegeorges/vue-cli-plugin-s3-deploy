import { error, warn, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'
import mime  from 'mime-types'

class Bucket {
  constructor(name, options = {}, connection) {
    if (!name) throw new TypeError('Bucket name must be defined.')
    if (!connection) throw new TypeError('Bucket requires a connection.')

    this.name = name
    this.options = options
    this.connection = connection
  }

  async validate () {
    let params = { Bucket: this.name }

    try {
      return await this.connection.headBucket(params).promise()
    } catch (e) {
      let message = e.toString().toLowerCase()

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
    let params = {
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
    let params = {
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
      logWithSpinner(`Bucket: enabling static hosting...`)
      await this.connection.putBucketWebsite(params).promise()
      stopSpinner()
    } catch (e) {
      error(`Static hosting could not be enabled on bucket: ${this.name}`)
      throw new Error(`AWS Error: ${ e.toString() }`)
    }
  }

  uploadFile(fileKey, fileStream, uploadOptions) {
    let uploadFileKey = fileKey.replace(this.options.fullAssetPath, '').replace(/\\/g, '/')
    let fullFileKey = `${this.options.deployPath}${uploadFileKey}`

    let uploadParams = {
      Bucket: this.name,
      Key: fullFileKey,
      ACL: this.options.acl,
      Body: fileStream,
      ContentType: this.contentTypeFor(fileKey)
    }

    if (uploadOptions.pwa) {
      uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
    } else {
      uploadParams.CacheControl = this.options.cacheControl;
    }

    return this.connection.upload(
      uploadParams,
      { partSize: (5 * 1024 * 1024), queueSize: 4 }
    ).promise()
  }

  contentTypeFor (filename) {
    return mime.lookup(filename) || 'application/octet-stream'
  }

}

export default Bucket
