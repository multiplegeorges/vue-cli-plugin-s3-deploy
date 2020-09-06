import { defaults, errorMessages } from './helper'

const fs = require('fs')
const path = require('path')
const regex = require('./helper').regex

const profilePrefix = 'Profile: '

/**
 * Search ~/.aws for a 'credentials' file and display any profiles found within.
 * @returns {[string]}
 */
const awsProfileNames = () => {
  const profileNames = ['Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.']
  const credentialsPath = path.join(require('os').homedir(), '.aws', 'credentials')

  if (fs.existsSync(credentialsPath)) {
    const credentials = fs.readFileSync(credentialsPath, 'utf8')
    const matches = [...credentials.matchAll(regex.profileName)]

    matches.forEach(match => profileNames.push(profilePrefix + match[1]))
  }

  return profileNames
}

/**
 * Validate the AWS Profile name, or set default
 * @param answer string
 * @returns {string|*}
 */
const filterAwsProfileNames = answer => {
  if (answer.startsWith('Environment variables:')) {
    return defaults.s3Profile
  } else {
    return answer.replace(profilePrefix, '')
  }
}

const advancedOptions = [
  {
    name: 'awsEndpoint',
    type: 'input',
    message: 'Enter the new endpoint:'
  }
]

module.exports = [
  {
    name: 'awsRegion',
    type: 'input',
    message: 'Which AWS region hosts the bucket?',
    default: defaults.awsRegion
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
    name: 's3BucketName',
    type: 'input',
    message: 'Name of the S3 bucket:',
    validate: input => {
      if (input === '') {
        return 'A bucket name is required.'
      } else if (!input.match(regex.bucketName)) {
        return errorMessages.s3BucketName
      } else {
        return true
      }
    }
  },
  {
    name: 's3BucketCreate',
    type: 'confirm',
    message: 'Create bucket if it does not exist?',
    default: defaults.s3BucketCreate
  },
  {
    name: 's3StaticHosting',
    type: 'confirm',
    message: 'Enable Static Site Hosting on bucket?',
    default: defaults.s3StaticHosting
  },
  {
    name: 'localAssetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: defaults.localAssetPath
  },
  {
    name: 'localAssetMatch',
    type: 'input',
    message: 'Which files should be deployed?',
    default: defaults.localAssetMatch.join(', ')
  },
  {
    name: 's3DeployPath',
    type: 'input',
    message: 'Where in the bucket should the files be deployed?',
    default: defaults.s3DeployPath
  },
  {
    name: 's3ACL',
    type: 'list',
    choices: [
      'private',
      'public-read',
      'public-read-write',
      'aws-exec-read',
      'authenticated-read',
      'bucket-owner-read',
      'bucket-owner-full-control',
      'none'
    ],
    message: 'Which Access Control List (ACL) setting should be applied to deployed files?',
    default: defaults.s3ACL
  },
  {
    name: 'pwa',
    type: 'confirm',
    message: 'Enable PWA deploy (disables caching of certain files) options?',
    default: defaults.pwa
  },
  {
    name: 'pwaFiles',
    type: 'input',
    message: 'Disable caching on which files (comma-separated)?',
    default: defaults.pwaFiles.join(','),
    when: answers => answers.pwa === true,
    validate: input => input !== '' ? true : 'At least one file path is requires.',
    filter: () => {}
  }
]
