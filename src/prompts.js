const fs = require('fs')
const path = require('path')
const regex = require('./helper').regex

const awsProfileNames = () => {
  const profileNames = ['Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.']
  const credentialsPath = path.join(require('os').homedir(), '.aws', 'credentials')

  if (fs.existsSync(credentialsPath)) {
    const credentials = fs.readFileSync(credentialsPath, 'utf8')

    const profileNameRegexp = new RegExp(regex.profileName)

    let match = profileNameRegexp.exec(credentials)
    while (match != null) {
      profileNames.push('Profile: ' + match[1])
      match = profileNameRegexp.exec(credentials)
    }
  }

  return profileNames
}

const filterAwsProfileNames = answer => {
  if (answer.startsWith('Environment variables:')) {
    return 'default'
  } else {
    return answer.replace('Profile: ', '')
  }
}

module.exports = [
  {
    name: 'awsRegion',
    type: 'input',
    message: 'Which AWS region hosts the bucket?',
    default: 'us-east-1'
  },
  {
    name: 'overrideAwsEndpoint',
    type: 'confirm',
    message: 'Override the default endpoint? eg. DigitalOcean',
    default: false
  },
  {
    name: 'awsEndpoint',
    type: 'input',
    message: 'Enter the new endpoint:',
    when: answers => answers.overrideAwsEndpoint === true
  },
  {
    name: 's3Profile',
    type: 'list',
    message: 'How do you want to authenticate with AWS S3?',
    default: '0',
    choices: awsProfileNames,
    filter: filterAwsProfileNames
  },
  {
    name: 's3Bucket',
    type: 'input',
    message: 'Name of the S3 bucket:',
    validate: input => {
      if (input === '') {
        return 'A bucket name is required.'
      } else if (!input.match(regex.bucketName)) {
        return 'Bucket name is invalid.\nUse lowercase alpha numeric characters, dots and hyphens only. see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html'
      } else {
        return true
      }
    }
  },
  {
    name: 'createBucket',
    type: 'confirm',
    message: 'Create bucket if it does not exist?',
    default: true
  },
  {
    name: 'enableStaticHosting',
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
    name: 'localAssetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: 'dist'
  },
  {
    name: 'localAssetMatch',
    type: 'input',
    message: 'Which files should be deployed?',
    default: '**'
  },
  {
    name: 's3DeployPath',
    type: 'input',
    message: 'Where in the bucket should the files be deployed?',
    default: '/'
  },
  {
    name: 's3Acl',
    type: 'list',
    choices: ['private', 'public-read', 'public-read-write', 'aws-exec-read', 'authenticated-read', 'bucket-owner-read', 'bucket-owner-full-control', 'none'],
    message: 'Which Access Control List (ACL) setting should be applied to deployed files?',
    default: 'public-read'
  },
  {
    name: 'enablePwa',
    type: 'confirm',
    message: 'Enable PWA deploy (disables caching of certain files) options?',
    default: false
  },
  {
    name: 'pwaFiles',
    type: 'input',
    message: 'Disable caching on which files (comma-separated)?',
    default: 'index.html,service-worker.js,manifest.json',
    when: answers => answers.pwa === true,
    validate: input => input !== '' ? true : 'At least one file path is requires.'
  },
  {
    name: 'enableCloudFront',
    type: 'confirm',
    message: 'Enable invalidation of a CloudFront distribution on deploy?',
    default: false
  },
  {
    name: 'cloudFrontProfile',
    type: 'list',
    message: 'How do you want to authenticate with AWS CloudFront?',
    default: '0',
    when: answers => answers.enableCloudFront === true,
    choices: awsProfileNames,
    filter: filterAwsProfileNames
  },
  {
    name: 'cloudFrontId',
    type: 'input',
    message: 'What is the ID of the distribution to invalidate?',
    default: '',
    when: answers => answers.enableCloudFront === true,
    validate: input => input !== '' ? true : 'A distribution ID is required.'
  },
  {
    name: 'cloudFrontMatchers',
    type: 'input',
    message: 'Enter a comma-separated list of paths to invalidate:',
    default: '/index.html,/service-worker.js,/manifest.json',
    when: answers => answers.enableCloudFront === true,
    validate: input => input !== '' ? true : 'At least one invalidation path is required. To invalidate all files, enter /* '
  }
]
