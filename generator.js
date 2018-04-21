module.exports = (api, options, rootOptions) => {
  let scriptOptions = [
    `--assetPath=${options.assetPath}`,
    `--bucket=${options.bucket}`,
    `--region=${options.region}`,
  ]

  if (options.pwa) {
    scriptOptions.push(`--pwa=${options.pwaFiles}`)
  }

  api.extendPackage({
    scripts: {
      deploy: `vue-cli-service s3-deploy ${scriptOptions.join(' ')}`
    }
  })
}
