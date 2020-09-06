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
  awsRegion: 'us-east-1',
  awsEndpoint: '',
  localAssetPath: 'dist',
  localAssetMatch: ['**'],
  s3Profile: 'default',
  s3BucketCreate: false,
  s3StaticHosting: false,
  s3StaticIndexPage: 'index.html',
  s3StaticErrorPage: 'index.html',
  s3CacheControl: 'max-age=86400',
  s3CacheControlPerFile: [],
  s3ACL: 'public-read',
  s3DeployPath: '/',
  cloudFront: false,
  cloudFrontMatchers: [
    '/index.html',
    '/service-worker.js',
    '/manifest.json'
  ],
  pwa: false,
  pwaFiles: [
    'index.html',
    'service-worker.js',
    'manifest.json'
  ],
  gzip: false,
  gzipFilePattern: [
    '**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}'
  ]
}

/**
 * Set global error messages
 */
export const errorMessages = {
  s3BucketName: `
    Bucket name is invalid.
    Bucket name must use only lowercase alpha numeric characters, dots and hyphens. see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html
  `
}
