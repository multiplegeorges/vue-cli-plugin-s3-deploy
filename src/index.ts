import '@babel/polyfill'
import Deployer from './classes/Deployer'
import { invalidateDistribution } from './post-tasks'

import Configuration from './classes/Configuration'

const {
  error,
  warn
} = require('@vue/cli-shared-utils')

process.on('unhandledRejection', (err) => {
  console.log(err)
  error(JSON.stringify(err))
  process.exit(1)
})

module.exports = (api, configOptions) => {
  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket based on options set in vue.config.js. Configuration done via `vue invoke s3-deploy`',
    usage: 'vue-cli-service s3-deploy'
  }, async (_) => {
    const options = configOptions.pluginOptions.s3Deploy
    const config = new Configuration(options)

    if (!config.options.bucket.name) {
      error('Bucket name must be specified with `s3BucketName` in vue.config.js!')
      process.exit(1)
    }

    if (config.options.pwa && !config.options.pwaFiles) {
      warn(`
        Option pwa is set but no files specified!
        Defaulting to: index.html,service-worker.js,manifest.json
      `)
    }

    if (process.env.S3D_DEBUG) {
      console.log(config.options)
    }

    let deployError = null

    try {
      await new Deployer(config).run()

      if (config.options.cloudFront) {
        await invalidateDistribution(config.options)
      }
    } catch (error) {
      deployError = error
    }

    config.options.onCompleteFunction(config.options, deployError)
  })
}
