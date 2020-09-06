import fs from 'fs'
import zlib from 'zlib'
import AwsConnection from './Connection'
import { error, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'
import { regex, errorMessages } from '../helper'

interface IUploadParams {
  Bucket: string
  Key: string
  ACL: string
  Body: any
  ContentType: string
  ContentEncoding?: string
}
/**
 *
 */
class Bucket {
  name: string
  connection: Promise<any>

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
   * @param asset
   * @returns {Promise<ManagedUpload.SendData>}
   */
  uploadFile (asset) {

    // collect params
    const uploadParams: IUploadParams = {
      Bucket: this.name,
      Key: asset.destination,
      ACL: asset.acl,
      Body: fs.readFileSync(asset.source),
      ContentType: asset.type
    }

    // gzip if required
    if (asset.gzip) {
      uploadParams.Body = zlib.gzipSync(uploadParams.Body, { level: 9 })
      uploadParams.ContentEncoding = 'gzip'
    }

    // start upload
    return this.connection.upload(
      uploadParams,
      { partSize: (5 * 1024 * 1024), queueSize: 4 }
    ).promise()
  }
}

export default Bucket
