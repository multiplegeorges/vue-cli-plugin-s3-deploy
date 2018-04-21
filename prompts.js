module.exports = [
  {
    name: 'assetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: 'dist'
  },
  {
    name: 'bucket',
    type: 'input',
    message: 'Name of the S3 bucket:',
    validate: input => input !== '' ? true : 'A bucket name is required.'
  },
  {
    name: 'region',
    type: 'input',
    message: 'Which AWS region hosts the bucket?',
    default: 'us-east-1'
  },
  {
    name: 'pwa',
    type: 'confirm',
    message: 'Enable PWA deploy (disables caching of certain files) options?',
    default: false
  },
  {
    name: 'pwaFiles',
    type: 'input',
    message: 'Disable caching on which files (comma-separated)?',
    default: 'service-worker.js',
    when: answers => answers.pwa === true
  }
]
