/* eslint-disable no-unused-vars */
import Configuration, { VERSION as PLUGIN_VERSION } from '../src/configuration'

const validConfig = {
  bucket: 'my-bucket',
  pluginVersion: PLUGIN_VERSION
}

const OLD_ENV = process.env
beforeEach(() => {
  jest.resetModules()
  process.env = { ...OLD_ENV }
})

afterEach(() => {
  process.env = OLD_ENV
})

test('Configuration requires options', () => {
  expect(() => {
    const config = new Configuration()
  }).toThrow(new TypeError('Options are required.'))
})

test('Bucket is a required option', () => {
  expect(() => {
    const config = new Configuration({ pluginVersion: PLUGIN_VERSION })
  }).toThrow(/"bucket" is required/)
})

test('Environment overrides applied to empty options', () => {
  process.env.S3D_REGION = 'fake-region-1'

  const config = new Configuration(validConfig)

  expect(config.options.region).toBe('fake-region-1')
})

test('Environment overrides specified options', () => {
  process.env.S3D_UPLOAD_CONCURRENCY = 99

  const localConfig = { uploadConcurrency: 3 }
  const config = new Configuration({ ...validConfig, ...localConfig })

  expect(config.options.uploadConcurrency).toBe(99)
})

test('Config converts "true" to a real boolean', () => {
  const localConfig = { createBucket: 'true' }
  const config = new Configuration({ ...validConfig, ...localConfig })

  expect(config.options.createBucket).toBe(true)
})

test('Config converts "false" to a real boolean', () => {
  const localConfig = { createBucket: 'false' }
  const config = new Configuration({ ...validConfig, ...localConfig })

  expect(config.options.createBucket).toBe(false)
})

test('Configuration expects the right version', () => {
  const localConfig = { ...validConfig }
  localConfig.pluginVersion = '2.0.0'

  expect(() => {
    const config = new Configuration(localConfig)
  }).toThrow(/Configuration is out of date/)
})
