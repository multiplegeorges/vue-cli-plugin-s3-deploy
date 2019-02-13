const { info, error, done } = require('@vue/cli-shared-utils')
const path = require('path')
const fs = require('fs-extra')
const mime = require('mime-types')
const globby = require('globby')
const AWS = require('aws-sdk')
const PromisePool = require('es6-promise-pool')
const zlib = require('zlib');
const ora = require('ora');

const deployDir = 'dist-deploy';

const spinner = ora();

let S3;

function mimeCharsetsLookup(mimeType, fallback) {
  // the node-mime library removed this method in v 2.0. This is the replacement
  // code for what was formerly mime.charsets.lookup
  return (/^text\/|^application\/(javascript|json)/).test(mimeType) ? 'UTF-8' : fallback;
}

function contentTypeFor(filename) {
  return mime.lookup(filename) || 'application/octet-stream'
}

async function setupAWS(awsProfile, region) {
  const awsConfig = {
    region: region,
    httpOptions: {
      connectTimeout: 30 * 1000,
      timeout: 120 * 1000
    }
  }

  if (awsProfile.toString() !== 'default') {
    const credentials = new AWS.SharedIniFileCredentials({
      profile: awsProfile
    })

    await credentials.get((err) => {
      if (err) {
        throw new Error(err);
      }

      awsConfig.credentials = credentials
    })
  }

  AWS.config.update(awsConfig)
  return new AWS.S3()
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
    info('Static Hosting is enabled.')
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

function getAllFiles (options) {
  const { assetPath, allowDotMatching, pattern = '**' } = options

  return globby.sync(pattern, {
    cwd: assetPath,
    dot: allowDotMatching
  })
    .map(file => ({
      relative: file,
      absolute: path.join(assetPath, file)
    }));
}

function parseDeployPath (depPath) {
  let deployPath = depPath
  // We don't need a leading slash for root deploys on S3.
  if (deployPath.startsWith('/')) deployPath = deployPath.slice(1, deployPath.length)
  // But we do need to make sure there's a trailing one on the path.
  if (!deployPath.endsWith('/') && deployPath.length > 0) deployPath = deployPath + '/'

  return deployPath
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

  spinner.start(`Invalidating CloudFront distribution: ${options.cloudfrontId}`)

  try {
    let data = await cloudfront.createInvalidation(params).promise()

    spinner.succeed();

    info(`Invalidation ID: ${data['Invalidation']['Id']}`)
    info(`Status: ${data['Invalidation']['Status']}`)
    info(`Call Reference: ${data['Invalidation']['InvalidationBatch']['CallerReference']}`)
    info(`See your AWS console for on-going status on this invalidation.`)
  } catch (err) {
    spinner.fail('Invalidating CloudFront distrubution failed.');
    error(`Code: ${err.code}`)
    error(`Message: ${err.message}`)
    error(`AWS Request ID: ${err.requestId}`)
    throw err
  } finally {
    stopSpinner()
  }
}

async function uploadFile ({ fileKey, fileBody, options, gzip }) {
  const pwaSupport = options.pwa && options.pwaFiles.split(',').includes(fileKey)
  let contentType = contentTypeFor(fileKey);
  const encoding = mimeCharsetsLookup(contentType);

  if (encoding) {
    contentType = `${contentType}; charset=${encoding.toLowerCase()}`;
  }

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

async function prepareDeploymentDirectory (assetPath, assetMatch, allowDotMatching) {
  const fullAssetPath = getFullPath(assetPath)
  const filesToCopy = getAllFiles({
    assetPath: fullAssetPath,
    pattern: assetMatch,
    allowDotMatching
  })

  const copyPool = new PromisePool(() => {
    if (filesToCopy.length === 0) return null

    const file = filesToCopy.pop()
    const src = file.absolute
    const dist = getFullPath(deployDir) + file.relative

    return fs.copy(src, dist)
  }, 10);

  try {
    spinner.start('Creating deployment directory')
    await fs.emptyDir(getFullPath(deployDir))
    await copyPool.start()
    spinner.succeed('Deployment directory created.')
  } catch (err) {
    spinner.fail('Deployment directory could not be created.')
    error(err)
  }
}

async function gzipFiles(filesToGzip) {
  const filesQueue = [...filesToGzip]

  const gzipPool = new PromisePool(() => {
    if (filesQueue.length === 0) return null

    const filePath = filesQueue.pop()
    const outputPath = `${filePath}.gz`
    const gzip = zlib.createGzip()

    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(filePath)
      const output = fs.createWriteStream(outputPath)

      input.pipe(gzip).pipe(output)

      input.on('error', (err) => {
        reject(err)
      });

      output.on('error', (err) => {
        reject(err)
      });

      output.on('finish', () => {
        resolve()
      });
    }).then(() => fs.rename(outputPath, filePath))
  }, 10)

  try {
    spinner.start('Gzipping files')
    await gzipPool.start()
    spinner.succeed(`All ${filesToGzip.length} have been gzipped successfully.`)
  } catch (err) {
    spinner.fail('Files haven\'t been gzipped properly.')
    error(err)
    exit(1)
  }
}

module.exports = async (options, api) => {
  try {
    spinner.start('Setting up AWS')
    S3 = await setupAWS(options.awsProfile, options.region)
    spinner.succeed('AWS credentials confirmed')
  } catch (err) {
    spinner.fail('Setting up AWS failed.')
    error(err)
    exit(1)
  }

  if (await bucketExists(options) === false) exit(1)

  options.uploadOptions = { partSize: (5 * 1024 * 1024), queueSize: 4 }

  const deployDirPath = getFullPath(deployDir)
  const filesToDeploy = getAllFiles({
    assetPath: deployDirPath,
    allowDotMatching: options.allowDotMatching
  })
  let filesToGzip = []

  const bucketDeployPath = parseDeployPath(options.deployPath)
  const uploadTotal = filesToDeploy.length
  let uploadCount = 0

  const remotePath = options.staticHosting
    ? `https://s3-${options.region}.amazonaws.com/${options.bucket}/`
    : `https://${options.bucket}.s3-website-${options.region}.amazonaws.com/`

  await prepareDeploymentDirectory(options.assetPath, options.assetMatch, options.allowDotMatching)

  if (options.gzip) {
    filesToGzip = getAllFiles({
      assetPath: deployDirPath,
      pattern: options.gzipFilePattern,
      allowDotMatching: options.allowDotMatching
    })
      .map(file => file.absolute)

    await gzipFiles(filesToGzip)
  }

  const uploadPool = new PromisePool(() => {
    if (filesToDeploy.length === 0) return null

    let filename = filesToDeploy.pop().absolute
    let fileStream = fs.readFileSync(filename)
    let fileKey = filename.replace(deployDirPath, '').replace(/\\/g, '/')
    let fullFileKey = `${bucketDeployPath}${fileKey}`

    spinner.start(`Uploading: ${fullFileKey}`);

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

      spinner.succeed(`(${uploadCount}/${uploadTotal}) Uploaded ${fullFileKey}${pwaStr}`)
      // resolve()
    })
    .catch((e) => {
      spinner.fail(`Upload failed: ${fullFileKey}`)
      error(e.toString())
      // reject(e)
    })
  }, parseInt(options.uploadConcurrency, 10))

  try {
    spinner.start(`Deploying ${uploadTotal} assets from ${deployDirPath} to ${remotePath}`)
    await uploadPool.start()
    spinner.succeed(`All ${uploadTotal} assets have been successfully deployed to ${remotePath}`)

    if (options.enableCloudfront) {
        invalidateDistribution(options)
    }
    if (uploadCount !== uploadTotal) {
        // Try to invalidate the distribution first and then check for uploaded file count.
        throw new Error(`Not all files were uploaded. ${uploadCount} out of ${uploadTotal} files were uploaded.`);
    }
    // Only output this when the invalidation was successful as well.
    info('Deployment complete.')
  } catch (uploadErr) {
    spinner.fail('Deployment completed with errors.');
    error(`${uploadErr.toString()}`)
    exit(1)
  }
}
