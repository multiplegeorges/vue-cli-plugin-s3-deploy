const {
  error,
  warn
} = require('@vue/cli-shared-utils')

process.on('unhandledRejection', (message) => {
  error(message)
  process.exit(1)
})

module.exports = (api, projectOptions) => {
  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket based on options set in vue.config.js.',
    usage: 'vue-cli-service s3-deploy',
    options: {
      'bucket': 'The S3 bucket name (required)',
      'region': 'AWS region for the specified bucket (default: us-east-1)',
      'assetPath': 'The path to the built assets (default: dist)',
      'uploadConcurrency': 'The number of concurrent uploads to S3 (default: 3)',
      'pwa': 'Sets max-age=0 for the PWA-related files specified',
      'enableCloudfront': 'Enables support for Cloudfront distribution invalidation',
      'cloudfrontId': 'The ID of the distribution to invalidate',
      'cloudfrontMatchers': 'A list of paths to invalidate'
    }
  }, (args) => {
    let options = {};
    if (projectOptions && projectOptions.pluginOptions && projectOptions.pluginOptions.s3Deploy) {
      warn('As of v1.3, s3deploy supports .env file variables.')
      warn('Current support for CLI options will be removed in upcoming versions. Please move your settings into .env files.')
      warn('See: https://github.com/multiplegeorges/vue-cli-plugin-s3-deploy#per-environment-options')
      options = projectOptions.pluginOptions.s3Deploy;
    }

    // Check for environmental overrides.
    options.bucket = process.env.VUE_APP_S3D_BUCKET || options.bucket
    options.assetPath = process.env.VUE_APP_S3D_ASSET_PATH || options.assetPath
    options.region = process.env.VUE_APP_S3D_REGION || options.region
    options.pwa = process.env.VUE_APP_S3D_PWA || options.pwa
    options.uploadConcurrency = process.env.VUE_APP_S3D_UPLOAD_CONCURRENCY || options.uploadConcurrency
    options.enableCloudfront = process.env.VUE_APP_S3D_ENABLE_CLOUDFRONT || options.enableCloudfront
    options.cloudfrontId = process.env.VUE_APP_S3D_CLOUDFRONT_ID || options.cloudfrontId
    options.cloudfrontMatchers = process.env.VUE_APP_S3D_CLOUDFRONT_MATCHERS || options.cloudfrontMatchers

    if (!options.bucket) {
      error('Bucket name must be specified with `bucket` in vue.config.js!')
    } else {
      if (options.pwa && !options.pwaFiles) {
          warn('Option pwa is set but no files specified! Defaulting to: service-worker.js')
          options.pwa = 'service-worker.js'
      }

      require('./s3deploy.js')(options, api)
    }
  })
}
