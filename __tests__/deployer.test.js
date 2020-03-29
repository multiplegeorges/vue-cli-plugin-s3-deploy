/* eslint-disable no-unused-vars */
// Need to do this before loading AWS

import path from 'path'
import process from 'process'
import AWS from 'aws-sdk'

import Deployer from '../src/deployer'
import Configuration, { VERSION as PLUGIN_VERSION } from '../src/configuration'

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
    const deployer = new Deployer()
  }).toThrow(/Configuration is required/)
})

test('fullAssetPath is set properly', () => {
  const deployer = new Deployer(
    makeConfig({ assetPath: 'fake-path-here' })
  )

  const expectedPath = path.normalize(`${process.cwd()}/fake-path-here${path.sep}`)
  expect(deployer.config.fullAssetPath).toMatch(expectedPath)
})

test('deployPath to remove leading slash for S3', () => {
  const deployer = new Deployer(
    makeConfig({ assetPath: 'fake-path-here' })
  )
  expect(deployer.deployPath('/app/')).toBe('app/')
})

test('deployPath to add ending slash for S3', () => {
  const deployer = new Deployer(
    makeConfig({ assetPath: 'fake-path-here' })
  )
  expect(deployer.deployPath('app')).toBe('app/')
})

test('fileList is properly populated with file paths', () => {
  const deployer = new Deployer(
    makeConfig({ assetPath: '__tests__/test_assets' })
  )

  expect(deployer.config.fileList).toEqual(
    expect.arrayContaining(
      [
        path.normalize(process.cwd() + '/__tests__/test_assets/index.html'),
        path.normalize(process.cwd() + '/__tests__/test_assets/app.js')
      ]
    )
  )
})

test('openConnection creates an S3 connection', async () => {
  const deployer = new Deployer(makeConfig())
  await deployer.openConnection()
  expect(deployer.connection).toBeInstanceOf(AWS.S3)
})

test('openConnection initializes with AWS env credentials if present', async () => {
  const deployer = new Deployer(makeConfig())

  await deployer.openConnection()
  expect(deployer.connection.config.credentials.accessKeyId).toBe('access-key')
})

test('openConnection initializes with a specified awsProfile name', async () => {
  const deployer = new Deployer(makeConfig({ awsProfile: 's3deploy' }))
  await deployer.openConnection()

  expect(deployer.connection.config.credentials.profile).toBe('s3deploy')
})
