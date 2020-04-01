import AWS from 'aws-sdk'

class Connection {
  constructor (config = {}) {
    this.config = config
    this.awsConfig = {
      region: config.region,
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    }
  }

  async init (profile) {
    if (profile && profile !== 'default') {
      try {
        this.awsConfig.credentials = await new AWS.SharedIniFileCredentials({
          profile: profile
        }).promise()
      } catch (error) {
        throw new Error(`AWS Profile Error: ${error.toString()}`)
      }
    } else if (!process.env.AWS_AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('AWS environment credentials missing.')
    }

    if (this.config.options.overrideEndpoint) {
      this.awsConfig.endpoint = this.config.options.endpoint
    }

    AWS.config.update(this.awsConfig)

    return AWS
  }

  async s3 () {
    return new (await this.init(this.config.s3Profile)).S3()
  }

  async cloudFront () {
    return new (await this.init(this.config.cloudFrontProfile)).CloudFront()
  }
}

export default Connection
