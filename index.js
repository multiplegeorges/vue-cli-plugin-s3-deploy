const {
  error,
  exit,
  warn
} = require('@vue/cli-shared-utils')

const { pluginVersion } = require('./version')

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
    console.log(JSON.stringify(options))

    if (pluginVersion !== options.pluginVersion) {
      error('Configuration is out of date.')
      error(`Config: ${options.pluginVersion} Plugin: ${pluginVersion}`)
      error('Run `vue invoke s3-deploy`')
      exit(1)
    }

    // Check for environment overrides of the options in vue.config.js.
    options.awsProfile = process.env.VUE_APP_S3D_AWS_PROFILE || options.awsProfile
    options.region = process.env.VUE_APP_S3D_REGION || options.region
    options.bucket = process.env.VUE_APP_S3D_BUCKET || options.bucket
    options.createBucket = process.env.VUE_APP_S3D_CREATE_BUCKET || options.createBucket
    options.uploadConcurrency = process.env.VUE_APP_S3D_UPLOAD_CONCURRENCY || options.uploadConcurrency

    options.staticHosting = process.env.VUE_APP_S3D_STATIC_HOSTING || options.staticHosting
    options.staticIndexPage = process.env.VUE_APP_S3D_STATIC_INDEX_PAGE || options.staticIndexPage
    options.staticErrorPage = process.env.VUE_APP_S3D_STATIC_ERROR_PAGE || options.staticErrorPage
    options.staticWebsiteConfiguration = process.env.VUE_APP_S3D_STATIC_WEBSITE_CONFIGURATION || options.staticWebsiteConfiguration

    options.assetPath = process.env.VUE_APP_S3D_ASSET_PATH || options.assetPath
    options.assetMatch = (process.env.VUE_APP_S3D_ASSET_MATCH || options.assetMatch)
    options.allowDotMatching = (process.env.VUE_APP_S3D_ALLOW_DOT_MATCHING || options.allowDotMatching)
    options.deployPath = process.env.VUE_APP_S3D_DEPLOY_PATH || options.deployPath
    options.acl = process.env.VUE_APP_S3D_ACL || options.acl

    options.pwa = process.env.VUE_APP_S3D_PWA || options.pwa
    options.pwaFiles = process.env.VUE_APP_S3D_PWA_FILES || options.pwaFiles

    options.cacheControl = process.env.VUE_APP_S3D_CACHE_CONTROL || options.cacheControl

    options.gzip = process.env.VUE_APP_S3D_GZIP || options.gzip
    options.gzipFilePattern = process.env.VUE_APP_S3D_GZIP_FILE_PATTERN || options.gzipFilePattern

    options.enableCloudfront = process.env.VUE_APP_S3D_ENABLE_CLOUDFRONT || options.enableCloudfront
    options.cloudfrontId = process.env.VUE_APP_S3D_CLOUDFRONT_ID || options.cloudfrontId
    options.cloudfrontMatchers = process.env.VUE_APP_S3D_CLOUDFRONT_MATCHERS || options.cloudfrontMatchers

    // parse and correct for boolbean vars passed as strings
    Object.keys(options).forEach(key => {
      if (!options[key]) return

      let value = options[key].toString().toLowerCase().trim()
      if (value === 'true') {
        options[key] = true
      } else if (value === 'false') {
        options[key] = false
      }
    })

    if (!options.bucket) {
      error('Bucket name must be specified with `bucket` in vue.config.js!')
      exit(1)
    } else {
      if (options.pwa && !options.pwaFiles) {
        warn('Option pwa is set but no files specified! Defaulting to: service-worker.js')
        options.pwaFiles = 'service-worker.js'
      }

      require('./s3deploy.js')(options, api)
    }
  })
}
