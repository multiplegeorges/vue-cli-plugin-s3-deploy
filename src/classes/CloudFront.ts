import Connection from './Connection'
import { info, error, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'

class CloudFront {
  private id: string | null = null
  private items: string[] | null = null
  private connection

  constructor (config) {
    this.id = config.id

    this.connection = new Connection({ ...config }).init('CLOUDFRONT')
    this.items = config.match.split(',')

    if (!this.id) {
      throw new TypeError('CloudFront ID must be defined.')
    }

    if (!this.connection) {
      throw new TypeError('CloudFront requires a connection.')
    }
  }

  async invalidateDistribution(): Promise<void> {
    logWithSpinner(`Invalidating CloudFront distribution: ${this.id}`)
  
    try {
      const data = await this.connection.createInvalidation({
        DistributionId: this.id,
        InvalidationBatch: {
          CallerReference: `vue-cli-plugin-s3-deploy-${Date.now().toString()}`,
          Paths: {
            Quantity: this.items.length,
            Items: this.items
          }
        }
      }).promise()
  
      info(`Invalidation ID: ${data.Invalidation.Id}`)
      info(`Status: ${data.Invalidation.Status}`)
      info(`Call Reference: ${data.Invalidation.InvalidationBatch.CallerReference}`)
      info('See your AWS console for on-going status on this invalidation.')
  
      info('CloudFront invalidated.')
  
      stopSpinner()
    } catch (err) {
      stopSpinner(false)
  
      error('CloudFront Error!!')
      error(`Code: ${err.code}`)
      error(`Message: ${err.message}`)
      error(`AWS Request ID: ${err.requestId}`)
  
      throw new Error('CloudFront invalidation failed!')
    }
  }
}

export default CloudFront
