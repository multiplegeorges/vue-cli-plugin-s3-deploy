import { error } from '@vue/cli-shared-utils'
import { regex, errorMessages } from '../helper'

import Connection from './Connection'
import Asset from './Asset'

interface IConfig {
  name: string | null
  region: string | null
  endpoint?: string | null
  profile?: string | null
}

class Bucket {
  private name: string | null = null
  private region: string | null = null
  private acl: string | null = null
  private connection

  constructor (config: IConfig) {
    this.name = config.name
    this.region = config.region

    this.connection = new Connection({ ...config }).init('S3')

    if (!this.name) {
      throw new TypeError('Bucket name must be defined.')
    }

    if (!this.name.match(regex.bucketName)) {
      throw new TypeError(errorMessages.bucketName)
    }

    if (!this.acl) {
      throw new TypeError('Bucket ACL must be defined.')
    }

    if (!this.connection) {
      throw new TypeError('Bucket requires a connection.')
    }
  }

  async validate (): Promise<any> {
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

  uploadFile (asset: Asset): Promise<any> {
    return this.connection.upload(
      Object.assign(
        asset.getUploadPamas(),
        {
          Bucket: this.name,
          ACL: this.acl
        }
      ),
      { 
        partSize: (5 * 1024 * 1024), 
        queueSize: 4 
      }
    ).promise()
  }
}

export default Bucket
