import { defaults, errorMessages, getAWSProfiles, filterAWSProfiles, regex } from './helper'

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
    name: 's3CacheControl',
    type: 'input',
    message: 'What should the default cache options be for all files?',
    default: defaults.s3CacheControl
  },
  {
    name: 's3CacheControlPerFile',
    type: 'confirm',
    message: 'Enable custom CacheControl options?',
    default: defaults.s3CacheControlPerFile
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
    default: defaults.pwa
  },
  {
    name: 'gzip',
    type: 'confirm',
    message: 'Enable GZip compression options?',
    default: defaults.gzip
  },
  {
    name: 'cloudFront',
    type: 'confirm',
    message: 'Enable CloudFont Invalidation after deployment?',
    default: defaults.cloudFront
  }
]
