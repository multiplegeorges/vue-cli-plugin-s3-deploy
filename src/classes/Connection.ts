import { S3, CloudFront, SharedIniFileCredentials } from 'aws-sdk'

interface IBucketConfig {
  region?: string
  endpoint?: string
  profile?: string
}

class Connection {
  awsConfig: Record<string, unknown>

  constructor (config?: IBucketConfig) {
    this.awsConfig = {
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    }

    if (config.profile && config.profile !== 'default') {
      this.awsConfig.credentials = new SharedIniFileCredentials({ profile: config.profile })
    }

    if (config.region) {
      this.awsConfig.region = config.region
    }

    if (config.endpoint) {
      this.awsConfig.endpoint = config.endpoint
    }
  }

  /**
   * Setup AWS Service
   */
  init (service: string): unknown {
    switch (service) {
      case 'S3':
        return new S3(this.awsConfig) as S3
      case 'CLOUDFRONT':
        return new CloudFront(this.awsConfig) as CloudFront
      default:
        return this.awsConfig
    }
  }
}

export default Connection
