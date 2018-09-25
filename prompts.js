const fs = require('fs')

module.exports = [
  {
    name: 'awsProfile',
    type: 'list',
    message: 'How do you want to authenticate with AWS?',
    default: '0',
    choices: (_) => {
      let credentials = fs.readFileSync(require('os').homedir() + '/.aws/credentials', 'utf8');
      let profileNames = ['Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.']
      let profileNameRegexp = new RegExp(/^\[([0-9a-zA-Z\-]*)\]?/gm)

      match = profileNameRegexp.exec(credentials)
      while (match != null) {
        profileNames.push("Profile: " + match[1])
        match = profileNameRegexp.exec(credentials);
      }

      return profileNames
    },
    filter: (answer) => {
      if (answer.startsWith('Environment variables:')) {
        return 'default'
      } else {
        return answer.replace('Profile: ', '')
      }
    }
  },
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
    name: 'assetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: 'dist'
  },
  {
    name: 'deployPath',
    type: 'input',
    message: 'Where in the bucket should the files be deployed?',
    default: '/'
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
