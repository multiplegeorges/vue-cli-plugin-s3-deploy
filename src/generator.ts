import { VERSION } from './classes/Configuration'

module.exports = (api, options, rootOptions) => {
  api.extendPackage({
    scripts: {
      deploy: 'vue-cli-service s3-deploy'
    }
  })

  options.pluginVersion = VERSION

  api.extendPackage({
    vue: {
      pluginOptions: {
        s3Deploy: options
      }
    }
  })
}
