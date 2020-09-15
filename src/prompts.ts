import os from 'os'
import fs from 'fs'
import path from 'path'

import { defaults, errorMessages, regex } from './helper'

/**
 * Search ~/.aws for a 'credentials' file and display any profiles found within.
 */
const getAWSProfiles = () => {
  const profilePrefix = 'Profile: '
  const profileNames = ['Environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, etc.']
  const credentialsPath = path.join(os.homedir(), '.aws', 'credentials')

  if (fs.existsSync(credentialsPath)) {
    const credentials = fs.readFileSync(credentialsPath, 'utf8')
    const matches = [...credentials.matchAll(regex.profileName)]

    matches.forEach(match => profileNames.push(profilePrefix + match[1]))
  }

  return profileNames
}

/**
 * Validate the AWS Profile name, or set default
 */
const filterAWSProfiles = (answer) => {
  if (answer.startsWith('Environment variables:')) {
    return defaults.s3Profile
  } else {
    return answer.replace('Profile: ', '')
  }
}


module.exports = [
  {
    name: 'assetPath',
    type: 'input',
    message: 'Where are your built files?',
    default: defaults.assetPath
  },
  {
    name: 'assetMatch',
    type: 'input',
    message: 'Which files should be deployed?',
    default: defaults.assetMatch.join('|')
  },
  {
    name: 's3Profile',
    type: 'list',
    message: 'How do you want to authenticate with AWS S3?',
    default: '0',
    choices: getAWSProfiles,
    filter: filterAWSProfiles
  },
  {
    name: 's3Region',
    type: 'input',
    message: 'Which AWS region hosts the bucket?',
    default: defaults.s3Region
  },
  {
    name: 's3BucketName',
    type: 'input',
    message: 'Name of the S3 bucket:',
    validate: input => {
      if (input === '') {
        return 'A bucket name is required.'
      } else if (!input.match(regex.bucketName)) {
        return errorMessages.bucketName
      } else {
        return true
      }
    }
  },
  {
    name: 's3BucketACL',
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
    default: defaults.s3BucketACL
  },
  {
    name: 's3CacheControl',
    type: 'input',
    message: 'What should the default cache options be for all files?',
    default: defaults.s3CacheControl
  },
  {
    name: 's3CacheControlPerFileEnable',
    type: 'confirm',
    message: 'Enable custom CacheControl options?',
    default: defaults.s3CacheControlPerFileEnable
  },
  {
    name: 's3CacheControlPerFilePattern',
    when: answers => answers.s3CacheControlPerFileEnable,
    type: 'input',
    message: 'Enable custom CacheControl options?',
    default: defaults.s3CacheControlPerFilePattern
  },
  {
    name: 's3DeployPath',
    type: 'input',
    message: 'Where in the bucket should the files be deployed?',
    default: defaults.s3DeployPath
  },
  {
    name: 'pwa',
    type: 'confirm',
    message: 'Enable Progressive-Web-App cache options?',
    default: defaults.pwaEnable
  },
  {
    name: 'gzip',
    type: 'confirm',
    message: 'Enable GZip compression options?',
    default: defaults.gzipEnable
  },
  {
    name: 'cloudFront',
    type: 'confirm',
    message: 'Enable CloudFont Invalidation after deployment?',
    default: defaults.cloudFrontEnable
  }
]
