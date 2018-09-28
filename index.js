const {
  error,
  warn
} = require('@vue/cli-shared-utils')

process.on('unhandledRejection', (message) => {
  error(message)
  process.exit(1)
})

module.exports = (api, configOptions) => {
  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket based on options set in vue.config.js. Configuration done via `vue invoke s3-deploy`',
    usage: 'vue-cli-service s3-deploy'
  }, (_) => {
    let options = configOptions.pluginOptions.s3Deploy

    // Check for environment overrides of the options in vue.config.js.
    options.bucket = process.env.VUE_APP_S3D_BUCKET || options.bucket
    options.assetPath = process.env.VUE_APP_S3D_ASSET_PATH || options.assetPath
    options.assetPathMatch = (process.env.VUE_APP_S3D_ASSET_PATH_MATCH || options.assetPathMatch).split(',') || '*'
    options.deployPath = process.env.VUE_APP_S3D_DEPLOY_PATH || options.deployPath
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
