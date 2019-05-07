// Need to do this before loading AWS

import path from 'path'
import process from 'process'
import AWS from 'aws-sdk'

import Deployer from '../src/deployer'
import Configuration from '../src/configuration'
import { VERSION as PLUGIN_VERSION } from '../src/configuration'

const makeConfig = function (localConfig = {}) {
  return new Configuration({
    ...{
      bucket: 'my-bucket',
      pluginVersion: PLUGIN_VERSION
    },
    ...localConfig
  })
}

test('Deployer requires options', () => {
  expect(() => {
    new Deployer()
  }).toThrow(/Configuration is required/)
})

test('fullAssetPath is set properly', () => {
  let deployer = new Deployer(
    makeConfig({assetPath: 'fake-path-here'})
  )

  expect(deployer.config.fullAssetPath).toMatch(new RegExp(`fake-path-here${path.sep}$`))
})

test('deployPath to remove leading slash for S3', () => {
  let deployer = new Deployer(
    makeConfig({ assetPath: 'fake-path-here' })
  )
  expect(deployer.deployPath('/app/')).toBe('app/')
})

test('deployPath to add ending slash for S3', () => {
  let deployer = new Deployer(
    makeConfig({ assetPath: 'fake-path-here' })
  )
  expect(deployer.deployPath('app')).toBe('app/')
})

test('fileList is properly populated with file paths', () => {
  let deployer = new Deployer(
    makeConfig({ assetPath: 'src/test/test_assets' })
  )

  expect(deployer.config.fileList).toEqual(
    expect.arrayContaining(
      [
        process.cwd() + '/src/test/test_assets/index.html',
        process.cwd() + '/src/test/test_assets/app.js'
      ]
    )
  )
})

test('openConnection creates an S3 connection', async () => {
  let deployer = new Deployer(makeConfig())
  await deployer.openConnection()
  expect(deployer.connection).toBeInstanceOf(AWS.S3)
})

test('openConnection initializes with AWS env credentials if present', async () => {
  let deployer = new Deployer(makeConfig())

  await deployer.openConnection()
  expect(deployer.connection.config.credentials.accessKeyId).toBe('access-key')
})

test('openConnection initializes with a specified awsProfile name', async () => {
  let deployer = new Deployer(makeConfig({awsProfile: 's3deploy'}))
  await deployer.openConnection()

  expect(deployer.connection.config.credentials.profile).toBe('s3deploy')
})
