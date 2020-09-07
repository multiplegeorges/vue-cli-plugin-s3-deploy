import * as fs from 'fs'
import * as zlib from 'zlib'
import Connection from './Connection'
import { error } from '@vue/cli-shared-utils'
import { regex, errorMessages } from '../helper'
import { S3 } from 'aws-sdk'

interface IUploadParams {
  Bucket: string
  Key: string
  ACL: string
  Body: any
  CacheControl?: string
  ContentType: string
  ContentEncoding?: string
}
/**
 *
 */
class Bucket {
  name: string
  region: string
  connection

  constructor (config) {
    this.name = config.name
    this.connection = new Connection({ region: config.region || null, endpoint: config.endpoint || null, profile: config.profile || null }).init('S3') as S3

    if (!this.name) {
      throw new TypeError('Bucket name must be defined.')
    }

    if (!this.name.match(regex.bucketName)) {
      throw new TypeError(errorMessages.bucketName)
    }

    if (!this.connection) {
      throw new TypeError('Bucket requires a connection.')
    }
  }

  async validate () {
    try {
      return await this.connection.headBucket({ Bucket: this.name }).promise()
    } catch (e) {
      const message = e.toString().toLowerCase()

      if (message.includes('forbidden')) {
        throw new Error(`Bucket: ${this.name} exists, but you do not have permission to access it.`)
      } 
      else if (message.includes('notfound')) {
        throw new Error(`Bucket: ${this.name} not found.`)
      } 
      else {
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
      ContentType: asset.type,
      CacheControl: asset.cacheControl
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
