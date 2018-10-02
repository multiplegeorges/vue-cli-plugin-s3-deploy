module.exports = (api, options, rootOptions) => {
  api.extendPackage({
    scripts: {
      deploy: `vue-cli-service s3-deploy`
    }
  })

  // Set some defaults
  // Override these in a .env file or in vue.config.js
  options.region = 'us-west-1'
  options.createBucket = false
  options.staticHosting = false
  options.assetPath = 'dist'
  options.assetMatch = '**'
  options.deployPath = '/'
  options.acl = 'public-read'
  options.pwa = false
  options.enableCloudfront = false
  options.uploadConcurrency = 5

  api.extendPackage({
    vue: {
      pluginOptions: {
        s3Deploy: options
      }
    }
  })
}
