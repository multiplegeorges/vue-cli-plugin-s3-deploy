const { info, error, logWithSpinner, stopSpinner } = require('@vue/cli-shared-utils')
const path = require('path')
const fs = require('fs-extra')
const mime = require('mime-types')
const globby = require('globby')
const AWS = require('aws-sdk')
const PromisePool = require('es6-promise-pool')
const zlib = require('zlib');

const deployDir = 'dist-deploy';

let S3;

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
    info(`Bucket: ${options.bucket} exists.`)
  } catch (headErr) {
    let errStr = headErr.toString().toLowerCase()
    if (errStr.indexOf('forbidden') > -1) {
      error(`Bucket: ${options.bucket} exists, but you do not have permission to access it.`)
    } else if (errStr.indexOf('notfound') > -1) {
      if (options.createBucket) {
        info(`Bucket: ${options.bucket} does not exist, attempting to create.`)
        bucketExists = await createBucket(options)
      } else {
        error(`Bucket: ${options.bucket} does not exist.`)
      }
    } else {
      error(`Could not verify that bucket ${options.bucket} exists. AWS Error: ${headErr}.`)
    }
  }

  if (bucketExists && options.staticHosting) {
    await enableStaticHosting(options)
  }

  return bucketExists
}

function getAllFiles (assetPath, pattern = '**') {
  return globby.sync(pattern, { cwd: assetPath })
    .map(file => ({
      relative: file,
      absolute: path.join(assetPath, file)
    }));
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

async function uploadFile ({ fileKey, fileBody, options, gzip }) {
  const pwaSupport = options.pwa && options.pwaFiles.split(',').includes(fileKey)

  let uploadParams = {
    Bucket: options.bucket,
    Key: fileKey,
    ACL: options.acl,
    Body: fileBody,
    ContentType: contentTypeFor(fileKey)
  }

  if (options.cacheControl) {
    uploadParams.CacheControl = options.cacheControl
  }

  if (gzip) {
    uploadParams.ContentEncoding = 'gzip'
  }

  if (pwaSupport) {
    uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0'
  }

  console.log('upload', { uploadParams });

  try {
    await S3.upload(uploadParams, options.uploadOptions).promise()
  } catch (uploadResultErr) {
    // pass full error with details back to promisePool callback
    throw new Error(`(${options.uploadCount}/${options.uploadTotal}) Upload failed: ${fileKey}. AWS Error: ${uploadResultErr.toString()}.`)
  }
}

function getFullPath (dir) {
  return path.join(process.cwd(), dir) + path.sep // path.sep appends a trailing / or \ depending on platform.
}

async function prepareDeploymentDirectory (assetPath, assetMatch) {
  const fullAssetPath = getFullPath(assetPath)
  const filesToCopy = getAllFiles(fullAssetPath, assetMatch)

  const copyPool = new PromisePool(() => {
    if (filesToCopy.length === 0) return null

    const file = filesToCopy.pop()
    const src = file.absolute
    const dist = getFullPath(deployDir) + file.relative

    return fs.copy(src, dist)
  }, 10);

  try {
    info('Preparing deployment directory...');

    await fs.emptyDir(getFullPath(deployDir));
    await copyPool.start();

    info('Deployment directory created.');
  } catch (err) {
    error('Something went wrong...')
    error(err)
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
  S3 = new AWS.S3()

  if (await bucketExists(options) === false) {
    error('Deployment terminated.')
    return
  }

  options.uploadOptions = { partSize: (5 * 1024 * 1024), queueSize: 4 }

  await prepareDeploymentDirectory(options.assetPath, options.assetMatch);

  const deployDirPath = getFullPath(deployDir);
  const filesToDeploy = getAllFiles(deployDirPath);
  let filesToGzip = [];

  if (options.gzip) {
    filesToGzip = getAllFiles(deployDirPath, options.gzipFilePattern)
      .map(file => file.absolute);

    const filesQueue = [...filesToGzip];

    const gzipPool = new PromisePool(() => {
      if (filesQueue.length === 0) return null

      const filePath = filesQueue.pop();
      const gzip = zlib.createGzip();

      return new Promise((resolve, reject) => {
        const input = fs.createReadStream(filePath);
        const output = fs.createWriteStream(filePath);

        input.pipe(gzip).pipe(output);

        input.on('error', function(err){
          reject(err);
        });

        output.on('error', function(err){
          reject(err);
        });

        output.on('finish', function(){
          resolve();
          info('✔  ' + filePath);
        });
      });
    }, 10);

    try {
      await gzipPool.start();
      info('All files gzipped properly.');
    } catch (err) {
      error('Unexpected error');
      error(err);
    }
  }

  let deployPath = options.deployPath
  // We don't need a leading slash for root deploys on S3.
  if (deployPath.startsWith('/')) deployPath = deployPath.slice(1, deployPath.length)
  // But we do need to make sure there's a trailing one on the path.
  if (!deployPath.endsWith('/') && deployPath.length > 0) deployPath = deployPath + '/'

  let uploadCount = 0
  let uploadTotal = filesToDeploy.length

  let remotePath = `https://${options.bucket}.s3-website-${options.region}.amazonaws.com/`
  if (options.staticHosting) {
    remotePath = `https://s3-${options.region}.amazonaws.com/${options.bucket}/`
  }

  info(`Deploying ${filesToDeploy.length} assets from ${deployDirPath} to ${remotePath}`)

  const uploadPool = new PromisePool(() => {
    if (filesToDeploy.length === 0) return null

    let filename = filesToDeploy.pop().absolute
    let fileStream = fs.readFileSync(filename)
    let fileKey = filename.replace(deployDirPath, '').replace(/\\/g, '/')
    let fullFileKey = `${deployPath}${fileKey}`

    return uploadFile({
      fileKey: fullFileKey,
      fileBody: fileStream,
      options,
      gzip: filesToGzip.includes(filename)
    })
    .then(() => {
      uploadCount++

      let pwaSupport = options.pwa && options.pwaFiles.split(',').indexOf(fileKey) > -1
      let pwaStr = pwaSupport ? ' with cache disabled for PWA' : ''

      info(`(${uploadCount}/${uploadTotal}) Uploaded ${fullFileKey}${pwaStr}`)
      // resolve()
    })
    .catch((e) => {
      error(`Upload failed: ${fullFileKey}`)
      error(e.toString())
      // reject(e)
    })
  }, parseInt(options.uploadConcurrency, 10))

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
