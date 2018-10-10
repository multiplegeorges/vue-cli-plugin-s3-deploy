const { info, error, logWithSpinner, stopSpinner } = require('@vue/cli-shared-utils')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const globby = require('globby')
const AWS = require('aws-sdk')
const PromisePool = require('es6-promise-pool')

const S3 = new AWS.S3()

function contentTypeFor (filename) {
  return mime.lookup(filename) || 'application/octet-stream'
}

async function createBucket (options) {
  let createParams = {
    Bucket: options.bucket,
    ACL: options.acl
  }

  // Create bucket
  try {
    await S3.createBucket(createParams).promise()
  } catch (createErr) {
    error(`Bucket: ${options.bucket} could not be created. AWS Error: ${createErr.toString()}.`)
    return false
  }

  info(`Bucket: ${options.bucket} created.`)
  return true
}

async function enableStaticHosting (options) {
  let staticParams = {
    Bucket: options.bucket,
    WebsiteConfiguration: {
      ErrorDocument: {
        Key: options.staticErrorPage
      },
      IndexDocument: {
        Suffix: options.staticIndexPage
      }
    }
  }

  // use custom WebsiteConfiguration if set
  if (options.staticWebsiteConfiguration) {
    staticParams.WebsiteConfiguration = options.staticWebsiteConfiguration
  }

  // enable static hosting
  try {
    await S3.putBucketWebsite(staticParams).promise()
    info(`Static Hosting is enabled.`)
  } catch (staticErr) {
    error(`Static Hosting could not be enabled on bucket: ${options.bucket}. AWS Error: ${staticErr.toString()}.`)
  }
}

async function bucketExists (options) {
  let headParams = { Bucket: options.bucket }
  let bucketExists = false

  try {
    bucketExists = await S3.headBucket(headParams).promise()
    info(`Bucket:'${options.bucket}' was found.`)
  } catch (headErr) {
    let errStr = headErr.toString().toLowerCase()
    if (errStr.indexOf('forbidden') > -1) {
      error(`Bucket: '${options.bucket}' was found, but you do not have permission to access it.`)
    } else if (errStr.indexOf('notfound') > -1) {
      if (options.createBucket) {
        info(`Bucket:'${options.bucket}' was not found, attempting to create it..`)
        bucketExists = await createBucket(options)
      } else {
        error(`Bucket: '${options.bucket}' was not found.`)
      }
    } else {
      error(`Could not verify that bucket: ${options.bucket} exists. AWS Error: ${headErr}.`)
    }
  }

  if (bucketExists && options.staticHosting) {
    await enableStaticHosting(options)
  }

  return bucketExists
}

function getAllFiles (options) {
  return globby.sync(options.assetMatch, { cwd: options.fullAssetPath }).map(file => path.join(options.fullAssetPath, file))
}

async function invalidateDistribution (options) {
  const cloudfront = new AWS.CloudFront()
  const invalidationItems = options.cloudfrontMatchers.split(',')

  let params = {
    DistributionId: options.cloudfrontId,
    InvalidationBatch: {
      CallerReference: `vue-cli-plugin-s3-deploy-${Date.now().toString()}`,
      Paths: {
        Quantity: invalidationItems.length,
        Items: invalidationItems
      }
    }
  }

  logWithSpinner(`Invalidating CloudFront distribution: ${options.cloudfrontId}`)

  try {
    let data = await cloudfront.createInvalidation(params).promise()

    info(`Invalidation ID: ${data['Invalidation']['Id']}`)
    info(`Status: ${data['Invalidation']['Status']}`)
    info(`Call Reference: ${data['Invalidation']['InvalidationBatch']['CallerReference']}`)
    info(`See your AWS console for on-going status on this invalidation.`)
  } catch (err) {
    error('Cloudfront Error!')
    error(`Code: ${err.code}`)
    error(`Message: ${err.message}`)
    error(`AWS Request ID: ${err.requestId}`)
  }

  stopSpinner()
}

function * generateFilePromises (options) {
  options.cwd = process.cwd()
  options.fullAssetPath = path.join(options.cwd, options.assetPath) + path.sep
  options.fileList = getAllFiles(options)

  let remotePath = `https://${options.bucket}.s3-website-${options.region}.amazonaws.com/`
  if (options.staticHosting) {
    remotePath = `https://s3-${options.region}.amazonaws.com/${options.bucket}/`
  }

  info(`Deploying ${options.fileList.length} assets.`)
  info(`From: ${options.fullAssetPath}`)
  info(`To: ${remotePath}`)

  for (let i = 0; i < options.fileList.length; i++) {
    yield addFilePromise(options, i)
  }
}

async function addFilePromise (options, i) {
  let filename = options.fileList[i]
  let fileStream = fs.readFileSync(filename)
  let fileKey = filename.replace(options.fullAssetPath, '').replace(/\\/g, '/')
  let pwaSupport = options.pwa && options.pwaFiles.split(',').indexOf(fileKey) > -1
  let deployPath = options.deployPath

  // We don't need a leading slash for root deploys on S3.
  if (deployPath.startsWith('/')) deployPath = deployPath.slice(1, deployPath.length)
  // But we do need to make sure there's a trailing one on the path.
  if (!deployPath.endsWith('/') && deployPath.length > 1) deployPath = deployPath + '/'

  let fullFileKey = `${deployPath}${fileKey}`

  let uploadParams = {
    Bucket: options.bucket,
    Key: fileKey,
    ACL: options.acl,
    Body: fileStream,
    ContentType: contentTypeFor(fileKey)
  }

  if (pwaSupport) {
    uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  }

  let uploadOptions = { partSize: (5 * 1024 * 1024), queueSize: 4 }
  let count = `(${i + 1}/${options.fileList.length})`
  let pwaStr = pwaSupport ? ' with cache disabled for PWA' : ''

  try {
    await S3.upload(uploadParams, uploadOptions).promise()
    info(`${count} Uploaded ${fullFileKey}${pwaStr}.`)
  } catch (uploadResultErr) {
    // pass full error with details back to promisePool callback
    throw new Error(`${count} Upload failed: ${fullFileKey}. AWS Error: ${uploadResultErr.toString()}.`)
  }
}

module.exports = async (options, api) => {
  info(`Options: ${JSON.stringify(options)}`)

  let awsConfig = {
    region: options.region,
    httpOptions: {
      connectTimeout: 30 * 1000,
      timeout: 120 * 1000
    }
  }

  if (options.awsProfile.toString() !== 'default') {
    let credentials = new AWS.SharedIniFileCredentials({ profile: options.awsProfile })
    await credentials.get((err) => {
      if (err) {
        error(err.toString())
      }

      awsConfig.credentials = credentials
    })
  }

  AWS.config.update(awsConfig)

  if (await bucketExists(options) === false) {
    error('Deployment terminated.')
    return
  }

  const promiseIterator = generateFilePromises(options)
  const uploadPool = new PromisePool(promiseIterator, parseInt(options.uploadConcurrency, 10))

  try {
    await uploadPool.start()
    info('Deployment complete.')

    if (options.enableCloudfront) {
      invalidateDistribution(options)
    }
  } catch (uploadErr) {
    error(`Deployment completed with errors.`)
    error(`${uploadErr.toString()}`)
  }
}
