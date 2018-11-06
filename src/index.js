import '@babel/polyfill'

const {
  error,
  warn
} = require('@vue/cli-shared-utils')

import Configuration  from './configuration'

process.on('unhandledRejection', (error) => {
  error(JSON.stringify(error))
  process.exit(1)
})

module.exports = (api, configOptions) => {
  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket based on options set in vue.config.js. Configuration done via `vue invoke s3-deploy`',
    usage: 'vue-cli-service s3-deploy'
  }, (_) => {
    let options = configOptions.pluginOptions.s3Deploy
    let config = new Configuration(options)

    if (!config.options.bucket) {
      error('Bucket name must be specified with `bucket` in vue.config.js!')
    } else {
      if (config.options.pwa && !config.options.pwaFiles) {
        warn('Option pwa is set but no files specified! Defaulting to: service-worker.js')
        config.options.pwaFiles = 'service-worker.js'
      }

      require('./s3deploy.js')(config)
    }
  })
}
