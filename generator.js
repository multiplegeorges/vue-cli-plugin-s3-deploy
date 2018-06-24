module.exports = (api, options, rootOptions) => {
  api.extendPackage({
    scripts: {
      deploy: `vue-cli-service s3-deploy`
    }
  })

  // Override this in a .env file or in vue.config.js
  options.uploadConcurrency = 5

  api.extendPackage({
    vue: {
      pluginOptions: {
        s3Deploy: options
      }
    }
  })
}
