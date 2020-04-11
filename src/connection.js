import AWS from 'aws-sdk'

class Connection {
  constructor (options = {}) {
    this.options = options
    this.awsConfig = {
      region: options.awsRegion,
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    }
  }

  async init (profile) {
    if (profile && profile !== 'default') {
      try {
        this.awsConfig.credentials = await new AWS.SharedIniFileCredentials({ profile }).promise()
      } catch (error) {
        throw new Error(`AWS Profile Error: ${error.toString()}`)
      }
    }

    if (this.options.endpoint !== '') {
      this.awsConfig.endpoint = this.options.endpoint
    }

    AWS.config.update(this.awsConfig)

    return AWS
  }

  async s3 () {
    return new (await this.init(this.options.s3Profile)).S3()
  }

  async cloudFront () {
    return new (await this.init(this.options.cloudFrontProfile)).CloudFront()
  }
}

export default Connection
