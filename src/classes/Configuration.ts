import Joi from '@hapi/joi'
import { defaults, regex } from '../helper'
import { snakeCase } from 'lodash'

const VERSION = '4.0.0-rc5'

interface IDefintions {
  pluginVersion: string
  onCompleteFunction: any
  fastGlobOptions: any
}

class Configuration {
  prefix: string
  definitions: IDefintions

  constructor (options) {
    if (!options) {
      throw new TypeError('Options are required.')
    }

    this.prefix = 'S3D'
    this.options = {}

    const pluginVersionError = errors => new Error(
      `Configuration is out of date.
      Config: ${errors[0].value} Plugin: ${VERSION}
      Run 'vue invoke s3-deploy'`
    )

    // General
    this.definitions.pluginVersion = Joi.string().valid(VERSION).error(pluginVersionError).required()
    this.definitions.onCompleteFunction = Joi.func().arity(2).default((_options, _error) => {})
    this.definitions.fastGlobOptions = Joi.object().default({
      dot: true,
      onlyFiles: false
    }) 

    // AWS
    // definitions.awsUploadConcurrency = Joi.number().min(1).default(5)
    // definitions.awsEndpoint = Joi.string().default(defaults.awsEndpoint)
    // definitions.awsRegion = Joi.string().regex(regex.regionName).default(defaults.awsRegion)

    definitions.aws = {
      uploadConcurrency: Joi.number().min(1).default(5),
      endpoint: Joi.string().default(defaults.awsEndpoint),
      region: Joi.string().regex(regex.regionName).default(defaults.awsRegion)
    }

    definitions.bucket = {
      profile: Joi.string().default(defaults.s3Profile),
      name: Joi.string().regex(regex.bucketName).required(),
      create: Joi.boolean().default(defaults.s3BucketCreate),
      acl: Joi.string().default(defaults.s3ACL),
      deployPath: Joi.string().default(defaults.s3DeployPath)
    }

    // Bucket
    definitions.bucketProfile = Joi.string().default(defaults.s3Profile)
    definitions.bucketName = Joi.string().regex(regex.bucketName).required()
    definitions.bucketACL = Joi.string().default(defaults.s3ACL)
    definitions.bucketPath = Joi.string().default(defaults.s3DeployPath)

    // Bucket - Cache Control
    definitions.s3CacheControl = Joi.string().default(defaults.s3CacheControl)
    definitions.s3CacheControlPerFile = Joi.array().default(defaults.s3CacheControlPerFile)

    // Local Assets
    definitions.assetPath = Joi.string().default(defaults.assetPath)
    definitions.assetMatch = Joi.array().default(defaults.assetMatch)

    // CloudFront
    definitions.cloudFront = Joi.boolean().default(defaults.cloudFront)
    definitions.cloudFrontProfile = Joi.string().default(defaults.s3Profile)
    definitions.cloudFrontId = Joi.string()
    definitions.cloudFrontMatchers = Joi.array().default(defaults.cloudFrontMatchers)

    // GZip Compression
    definitions.gzipFilePattern = Joi.array().default(defaults.gzipFilePattern)

    // Progressive Web App
    definitions.pwaFiles = Joi.array().default(defaults.pwaFiles)

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
