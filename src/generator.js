module.exports = (api, options, rootOptions) => {
  api.extendPackage({
    scripts: {
      deploy: 'vue-cli-service s3-deploy'
    }
  })

  api.extendPackage({
    vue: {
      pluginOptions: {
        s3Deploy: options
      }
    }
  })
}
