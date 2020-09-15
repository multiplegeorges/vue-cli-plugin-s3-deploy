import Joi from '@hapi/joi'
import { defaults, regex } from '../helper'
import { snakeCase } from 'lodash'

const VERSION = '4.0.0-rc5'

class Configuration {
  options
  prefix
  definitions

  constructor (options) {
    if (!options) {
      throw new TypeError('Options are required.')
    }

    this.prefix = 'S3D'
    this.options = {}

    const pluginVersionError = (errors: { value: any }[]) => new Error(
      `Configuration is out of date.
      Config: ${errors[0].value} Plugin: ${VERSION}
      Run 'vue invoke s3-deploy'`
    )

    // General
    this.definitions.pluginVersion = Joi.string().valid(VERSION).error(pluginVersionError).required()
    this.definitions.concurrentUploads = Joi.number().min(1).default(defaults.concurrentUploads)
    this.definitions.fastGlobOptions = Joi.object().default(defaults.fastGlobOptions) 
    this.definitions.onComplete = Joi.func().arity(2).default(defaults.onComplete)

    // Local Assets
    this.definitions.assetPath = Joi.string().default(defaults.assetPath)
    this.definitions.assetMatch = Joi.array().default(defaults.assetMatch)

    // Bucket
    this.definitions.s3Region =  Joi.string().regex(regex.regionName).default(defaults.s3Region)
    this.definitions.s3Endpoint =  Joi.string().default(defaults.s3Endpoint)
    this.definitions.s3Profile = Joi.string().default(defaults.s3Profile)
    this.definitions.s3BucketName = Joi.string().regex(regex.bucketName).default(defaults.s3BucketName).required()
    this.definitions.s3BucketACL = Joi.string().default(defaults.s3BucketACL)
    this.definitions.s3DeployPath = Joi.string().default(defaults.s3DeployPath)

    // Bucket - Cache Control
    this.definitions.s3CacheControl = Joi.string().default(defaults.s3CacheControl)
    this.definitions.s3CacheControlPerFileEnable = Joi.array().default(defaults.s3CacheControlPerFileEnable)
    this.definitions.s3CacheControlPerFilePattern = Joi.array().default(defaults.s3CacheControlPerFilePattern)

    // CloudFront
    this.definitions.cloudFrontEnable = Joi.boolean().default(defaults.cloudFrontEnable)
    this.definitions.cloudFrontProfile = Joi.string().default(defaults.cloudFrontProfile)
    this.definitions.cloudFrontId = Joi.string().default(defaults.cloudFrontId)
    this.definitions.cloudFrontPattern = Joi.array().default(defaults.cloudFrontPattern)

    // GZip Compression
    this.definitions.gzipFilePattern = Joi.array().default(defaults.gzipFilePattern)

    // Progressive Web App
    this.definitions.pwaFilePattern = Joi.array().default(defaults.pwaFilePattern)

    const optionsSchema = Joi.object().keys(this.definitions)
    const envOptions = this.applyEnvOverrides(options, Object.keys(this.definitions))
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
  applyEnvOverrides (options, optionNames): unknown {
    const optionsCopy = { ...options }

    optionNames.forEach((name: string | number) => {
      const envVar = `${this.prefix}_${snakeCase(name).toUpperCase()}`
      optionsCopy[name] = process.env[envVar] || optionsCopy[name]
    })

    return optionsCopy
  }
}

export { VERSION }

export default Configuration
