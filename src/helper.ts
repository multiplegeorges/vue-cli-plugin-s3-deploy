
export const regex = {
  profileName: /^\[([0-9a-zA-Z-]*)]?/gm,
  bucketName: /(?=^.{3,63}$)(?!^(\d+\.)+\d+$)(^(([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])\.)*([a-z0-9]|[a-z0-9][a-z0-9-]*[a-z0-9])$)/,
  regionName: /^[-0-9a-zA-Z]+$/
}

export const defaults = {
  assetPath: 'dist',
  assetMatch: ['**'],
  s3Profile: 'default',
  s3Region: 'us-east-1',
  s3Endpoint: null,
  s3CacheControl: 'max-age=86400',
  s3CacheControlPerFileEnable: false,
  s3CacheControlPerFilePattern: [],
  s3BucketName: null,
  s3BucketACL: 'public-read',
  s3DeployPath: '/',
  cloudFrontEnable: false,
  cloudFrontId: null,
  cloudFrontProfile: 'default',
  cloudFrontRegion: 'us-east-1',
  cloudFrontEndpoint: null,
  cloudFrontPattern: [
    '/index.html',
    '/service-worker.js',
    '/manifest.json'
  ],
  pwaEnable: false,
  pwaFilePattern: [
    'index.html',
    'service-worker.js',
    'manifest.json'
  ],
  gzipEnable: false,
  gzipFilePattern: [
    '**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}'
  ],
  concurrentUploads: 5,
  fastGlobOptions: { dot: true, onlyFiles: false },
  onComplete: (_error: unknown, _options: unknown) => null
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
