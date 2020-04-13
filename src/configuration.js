import Joi from '@hapi/joi'
import { defaults, regex } from './helper'
import { snakeCase } from 'lodash'

const VERSION = '4.0.0-rc4'

class Configuration {
  constructor (options) {
    if (!options) {
      throw new TypeError('Options are required.')
    }

    this.prefix = 'S3D'
    this.options = {}

    const definitions = {}
    const pluginVersionError = err =>
      `Configuration is out of date.
      Config: ${err} Plugin: ${VERSION}
      Run 'vue invoke s3-deploy'`

    // General
    definitions.pluginVersion = Joi.string().valid(VERSION).error(pluginVersionError).required()
    definitions.onCompleteFunction = Joi.func().arity(2).default((_options, _error) => {})
    definitions.fastGlobOptions = Joi.object().default({
      dot: true,
      onlyFiles: false
    })

    // AWS
    definitions.awsUploadConcurrency = Joi.Number().min(1).default(5)
    definitions.awsEndpoint = Joi.string().default(defaults.awsEndpoint)
    definitions.awsRegion = Joi.string().regex(regex.regionName).default(defaults.awsRegion)

    // Bucket
    definitions.s3Profile = Joi.string().default(defaults.s3Profile)
    definitions.s3BucketName = Joi.string().regex(regex.bucketName).required()
    definitions.s3BucketCreate = Joi.Boolean().default(defaults.s3BucketCreate)
    definitions.s3ACL = Joi.string().default(defaults.s3ACL)
    definitions.s3DeployPath = Joi.string().default(defaults.s3DeployPath)

    // Bucket - Static Hosting
    definitions.s3StaticHosting = Joi.Boolean().default(defaults.s3StaticHosting)
    definitions.s3StaticIndexPage = Joi.string().default(defaults.s3StaticIndexPage)
    definitions.s3StaticErrorPage = Joi.string().default(defaults.s3StaticErrorPage)
    definitions.s3StaticWebsiteConfiguration = Joi.object()

    // Bucket - Cache Control
    definitions.s3CacheControl = Joi.string().default(defaults.s3CacheControl)
    definitions.s3CacheControlPerFile = Joi.Array().default(defaults.s3CacheControlPerFile)

    // Local Assets
    definitions.localAssetPath = Joi.string().default(defaults.localAssetPath)
    definitions.localAssetMatch = Joi.Array().default(defaults.localAssetMatch)

    // CloudFront
    definitions.cloudFront = Joi.Boolean().default(defaults.cloudFront)
    definitions.cloudFrontProfile = Joi.string().default(defaults.s3Profile)
    definitions.cloudFrontId = Joi.string()
    definitions.cloudFrontMatchers = Joi.Array().default(defaults.cloudFrontMatchers)

    // GZip Compression
    definitions.gzip = Joi.Boolean().default(defaults.gzip)
    definitions.gzipFilePattern = Joi.Array().default(defaults.gzipFilePattern)

    // Progressive Web App
    definitions.pwa = Joi.Boolean().default(defaults.pwa)
    definitions.pwaFiles = Joi.Array().default(defaults.pwaFiles)

    const optionsSchema = Joi.object().keys(definitions)
    const envOptions = this.applyEnvOverrides(options, Object.keys(definitions))
    const validOptions = optionsSchema.validate(envOptions)

    if (!validOptions.error) {
      this.options = validOptions.value
    } else {
      throw validOptions.error
    }
  }

  /**
   * Override vue.config.js variables with ENV variables
   * @param options
   * @param optionNames
   */
  applyEnvOverrides (options, optionNames) {
    const optionsCopy = { ...options }

    optionNames.forEach((name) => {
      const envVar = `${this.prefix}_${snakeCase(name).toUpperCase()}`
      optionsCopy[name] = process.env[envVar] || optionsCopy[name]
    })

    return optionsCopy
  }
}

export { VERSION }
export default Configuration
