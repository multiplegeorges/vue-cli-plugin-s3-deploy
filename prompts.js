module.exports = [
  {
    name: 'region',
    type: 'input',
    message: 'Which AWS region hosts the bucket?',
    default: 'us-east-1'
  },
  {
    name: 'bucket',
    type: 'input',
    message: 'Name of the S3 bucket:',
    validate: input => input !== '' ? true : 'A bucket name is required.'
  },
  {
    name: 'createBucket',
    type: 'confirm',
    message: 'Create bucket if does not exist?',
    default: true
  },
  {
    name: 'staticHosting',
    type: 'confirm',
    message: 'Enable Static Site Hosting on bucket?',
    default: true
  },
  {
    name: 'staticIndexPage',
    type: 'input',
    message: 'Filename of static index page:',
    default: 'index.html',
    when: answers => answers.staticHosting === true,
    validate: input => input !== '' ? true : 'A filename is required.'
  },
  {
    name: 'staticErrorPage',
    type: 'input',
    message: 'Filename of static error page:',
    default: 'index.html',
    when: answers => answers.staticHosting === true,
    validate: input => input !== '' ? true : 'A filename is required.'
  },
  {
    name: 'assetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: 'dist'
  },
  {
    name: 'assetMatch',
    type: 'input',
    message: 'Which files should be deployed?',
    default: '**'
  },
  {
    name: 'deployPath',
    type: 'input',
    message: 'Where in the bucket should the files be deployed?',
    default: '/'
  },
  {
    name: 'acl',
    type: 'list',
    choices: ['private', 'public-read', 'public-read-write', 'aws-exec-read', 'authenticated-read', 'bucket-owner-read', 'bucket-owner-full-control'],
    message: 'Which Access Control List (ACL) setting should be applied to deployed files?',
    default: 'public-read'
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
    validate: input => input !== '' ? true : 'At least one file path is requires.',
    when: answers => answers.pwa === true
  },
  {
    name: 'enableCloudfront',
    type: 'confirm',
    message: 'Enable invalidation of a CloudFront distribution on deploy?',
    default: false
  },
  {
    name: 'cloudfrontId',
    type: 'input',
    message: 'What is the ID of the distribution to invalidate?',
    default: '',
    when: answers => answers.enableCloudfront === true,
    validate: input => input !== '' ? true : 'A distribution ID is required.'
  },
  {
    name: 'cloudfrontMatchers',
    type: 'input',
    message: 'Enter a comma-separated list of paths to invalidate:',
    default: '/*',
    when: answers => answers.enableCloudfront === true,
    validate: input => input !== '' ? true : 'At least one invalidation path is required. To invalidate all files, enter /* '
  }
]
