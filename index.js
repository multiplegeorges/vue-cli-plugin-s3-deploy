const {
  error,
  warn
} = require('@vue/cli-shared-utils')

module.exports = (api, { s3Options }) => {
  const defaults = {
    awsRegion: 'us-east-1',
    assetPath: 'dist'
  }

  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket.',
    usage: 'vue-cli-service s3-deploy [options]',
    options: {
      '--bucket': 'The S3 bucket name, eg: my-site-bucket (required)',
      '--awsRegion': `AWS region for the specified bucket (default: ${defaults.awsRegion})`,
      '--assetPath': `The path to the built assets (default: ${defaults.assetPath})`,
      '--pwa': `Sets max-age=0 for the PWA-related files specified`
    }
  }, (args) => {
    let options = Object.assign(defaults, args)
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
