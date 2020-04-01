import AwsConnection from './connection'
import { error, info, logWithSpinner, stopSpinner } from '@vue/cli-shared-utils'

// Invalidate CloudFront assets
export const invalidateDistribution = async (config) => {
  const cloudFront = new AwsConnection(config).cloudFront()
  const invalidationItems = config.options.cloudFrontMatchers.split(',')

  const params = {
    DistributionId: this.config.options.cloudFrontId,
    InvalidationBatch: {
      CallerReference: `vue-cli-plugin-s3-deploy-${Date.now().toString()}`,
      Paths: {
        Quantity: invalidationItems.length,
        Items: invalidationItems
      }
    }
  }

  try {
    logWithSpinner(`Invalidating CloudFront distribution: ${config.options.cloudFrontId}`)

    const data = await cloudFront.createInvalidation(params).promise()

    info(`Invalidation ID: ${data.Invalidation.Id}`)
    info(`Status: ${data.Invalidation.Status}`)
    info(`Call Reference: ${data.Invalidation.InvalidationBatch.CallerReference}`)
    info('See your AWS console for on-going status on this invalidation.')

    info('CloudFront invalidated.')

    stopSpinner()
  } catch (err) {
    stopSpinner(false)

    error('Cloudfront Error!!')
    error(`Code: ${err.code}`)
    error(`Message: ${err.message}`)
    error(`AWS Request ID: ${err.requestId}`)

    throw new Error('Cloudfront invalidation failed!')
  }
}
