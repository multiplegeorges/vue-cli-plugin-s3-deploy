const { info, error, logWithSpinner, stopSpinner } = require('@vue/cli-shared-utils')
const path = require('path')
const fs = require('fs')
const mime = require('mime-types')
const AWS = require('aws-sdk')

module.exports = async (options, api) => {
  info(`AWS Region selected: ${options.awsRegion}`)
  AWS.config.update({region: options.awsRegion})

  info(`Deploying assets from ./${options.assetPath}/ to s3://${options.bucket}/`)

  let s3 = new AWS.S3()

  if (await bucketExists(options.bucket)) {
    let cwd = process.cwd()
    let fileList = getAllFiles(`${cwd}/${options.assetPath}`)
    let cwdPrefix = new RegExp(`^${cwd}/${options.assetPath}/`)

    for(let fileIndex = 0; fileIndex < fileList.length; fileIndex++) {
      let filename = fileList[fileIndex]
      let fileStream = fs.readFileSync(filename)
      let fileKey = filename.replace(cwdPrefix, '')

      try {
        logWithSpinner(`Uploading (${fileIndex + 1}/${fileList.length}): ${fileKey}`)
        await uploadFile(options.bucket, fileKey, fileStream)
        stopSpinner()
      } catch (e) {
        error(`Upload failed: ${fileKey}`)
        error(e.toString())
        stopSpinner()
        return
      }
    }

    if (options.pwa) {
      let pwaFiles = options.pwa.split(',')

      for(let i = 0; i < pwaFiles.length; i++) {
        let fileKey = pwaFiles[i]
        try {
          logWithSpinner(`Setting Cache-Control (${i+1}/${pwaFiles.length}): ${fileKey}`)
          await setCacheControl(options.bucket, fileKey)
          stopSpinner()
        } catch (e) {
          error(`Setting Cache-Control failed: ${fileKey}`)
          error(e.toString())
          stopSpinner()
          return
        }
      }
    }
  } else {
    error(`Bucket ${options.bucket} does not exist.`)
    return
  }

  info('Deploy complete.')

  function contentTypeFor(filename) {
    return mime.lookup(filename) || 'application/octet-stream'
  }

  async function setCacheControl(bucket, fileKey) {
    // Copies in-place while updating the metadata.
    let params = {
      CopySource: `${bucket}/${fileKey}`,
      Bucket: bucket,
      Key: fileKey,
      CacheControl: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      ContentType: contentTypeFor(fileKey),
      MetadataDirective: 'REPLACE'
    }
    return new Promise((resolve, reject) => {
      s3.copyObject(params, function(err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  async function uploadFile (bucket, fileKey, fileStream) {
    let params = {
      Bucket: bucket,
      Key: fileKey,
      Body: fileStream,
      ContentType: contentTypeFor(fileKey)
    }
    let options = { partSize: 5 * 1024 * 1024, queueSize: 4 }

    return new Promise((resolve, reject) => {
      s3.upload(params, options, function(err, data) {
        if (err) {
          reject(err)
        } else {
          resolve(data)
        }
      })
    })
  }

  async function bucketExists (bucketName) {
    return new Promise((resolve, reject) => {
      s3.listBuckets((err, data) => {
        if (err) {
          reject(err)
        } else {
          let names = data['Buckets'].map(b => b['Name'])
          resolve(names.includes(bucketName))
        }
      })
    })
  }

  function getAllFiles (dir) {
    return fs.readdirSync(dir).reduce((files, file) => {
      const name = path.join(dir, file)
      const isDirectory = fs.statSync(name).isDirectory()
      return isDirectory ? [...files, ...getAllFiles(name)] : [...files, name]
    }, [])
  }
}


// aws s3 sync dist/ s3://app.getpayme.com --exclude "index.html" --exclude "service-worker.js" --exclude "manifest.json"
// aws s3 cp --cache-control max-age=0 dist/index.html s3://app.getpayme.com
// aws s3 cp --cache-control max-age=0 dist/service-worker.js s3://app.getpayme.com
// aws s3 cp --cache-control max-age=0 dist/manifest.json s3://app.getpayme.com
