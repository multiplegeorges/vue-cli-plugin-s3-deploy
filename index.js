const {
  error,
  warn
} = require('@vue/cli-shared-utils')

module.exports = (api, { s3Options }) => {
  const defaults = {
    region: 'us-east-1',
    assetPath: 'dist',
    uploadConcurrency: 10
  }

  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket.',
    usage: 'vue-cli-service s3-deploy [options]',
    options: {
      '--bucket': 'The S3 bucket name, eg: my-site-bucket (required)',
      '--region': `AWS region for the specified bucket (default: ${defaults.region})`,
      '--assetPath': `The path to the built assets (default: ${defaults.assetPath})`,
      '--pwa': `Sets max-age=0 for the PWA-related files specified`
    }
  }, (args) => {
    let options = Object.assign(defaults, args)

    warn('As of v1.3, s3deploy supports .env file variables.')
    warn('Current support for CLI options will be removed in upcoming versions. Please move your settings into .env files.')
    warn('See: https://github.com/multiplegeorges/vue-cli-plugin-s3-deploy#per-environment-options')

    // Check for environmental overrides.
    options.bucket = process.env.VUE_APP_S3D_BUCKET || options.bucket
    options.assetPath = process.env.VUE_APP_S3D_ASSET_PATH || options.assetPath
    options.region = process.env.VUE_APP_S3D_REGION || options.region
    options.pwa = process.env.VUE_APP_S3D_PWA || options.pwa
    options.uploadConcurrency = process.env.VUE_APP_S3D_CONCURRENCY || options.uploadConcurrency

    if (!options.bucket) {
      error('Bucket name must be specified with --bucket!')
    } else {
      if (options.pwa === true) {
          warn('Option pwa is set but no files specified! Defaulting to: service-worker.js')
          options.pwa = 'service-worker.js'
      }
      require('./s3deploy.js')(options, api)
    }
  })
}
