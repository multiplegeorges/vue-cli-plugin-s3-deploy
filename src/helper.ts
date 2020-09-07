import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'

/**
 * hekpers
 * @type {{profileName: RegExp, bucketName: RegExp, regionName: RegExp}}
 */
export const regex = {
  profileName: /^\[([0-9a-zA-Z-]*)]?/gm,
  bucketName: /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$)/,
  regionName: /^[-0-9a-zA-Z]+$/
}

/**
 * Set global defaults for options.
 */
export const defaults = {
  assetPath: 'dist',
  assetMatch: ['**'],
  s3Profile: 'default',
  s3Region: 'us-east-1',
  s3Endpoint: null,
  s3CacheControl: 'max-age=86400',
  s3CacheControlPerFile: false,
  s3CacheControlPerFilePattern: [],
  s3ACL: 'public-read',
  s3DeployPath: '/',
  cloudFront: false,
  cloudFrontProfile: 'default',
  cloudFrontRegion: 'us-east-1',
  cloudFrontEndpoint: null,
  cloudFrontFileMatch: [
    '/index.html',
    '/service-worker.js',
    '/manifest.json'
  ],
  pwa: false,
  pwaFilePattern: [
    'index.html',
    'service-worker.js',
    'manifest.json'
  ],
  gzip: false,
  gzipFilePattern: [
    '**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}'
  ],
  fastGlobOptions: { dot: true, onlyFiles: false },
  onComplete: null
}

/**
 * Set global error messages
 */
export const errorMessages = {
  bucketName: `
    Bucket name is invalid.
    Bucket name must use only lowercase alpha numeric characters, dots and hyphens. see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  `
}

/**
 * Search ~/.aws for a 'credentials' file and display any profiles found within.
 */
export const getAWSProfiles = (): string[] => {
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
export const filterAWSProfiles = (answer: string): string => {
  if (answer.startsWith('Environment variables:')) {
    return defaults.s3Profile
  } else {
    return answer.replace('Profile: ', '')
  }
}
