import Bucket from '../src/bucket'

test('Bucket requires a name', () => {
  expect(() => {
    let bucket = new Bucket()
  }).toThrow(new TypeError('Bucket name must be defined.'))
})

test('Bucket requires a valid name', () => {
  expect(() => {
    let bucket = new Bucket('my bucket')
  }).toThrow(new TypeError('Bucket name is invalid.\nBucket name must use only lowercase alpha nummeric characters, dots and hyphens. see https://docs.aws.amazon.com/AmazonS3/latest/dev/BucketRestrictions.html'))
})

test('Bucket assigns name', () => {
  let bucket = new Bucket('my-bucket', {}, {})
  expect(bucket.name).toBe('my-bucket')
})

test('Returns true when bucket does exist', async () => {
  let connection = {
    headBucket: jest.fn((params) => {
      return {
        promise: () => Promise.resolve({ exists: 'yes' })
      }
    })
  }

  let bucket = new Bucket('my-bucket', {}, connection)
  let exists = await bucket.validate()

  expect(exists).toBeTruthy()
})

test('Returns not found error when bucket does not exist', async () => {
  let connection = {
    headBucket: jest.fn(() => {
      return {
        promise: () => Promise.reject('Error: notfound')
      };
    })
  }

  let bucket = new Bucket('my-bucket', {}, connection)
  expect(bucket.validate()).rejects.toEqual(
    new Error('Bucket: my-bucket not found.')
  )
})

test('Returns forbidden error when you do not have access to the bucket', async () => {
  let connection = {
    headBucket: jest.fn((params) => {
      return {
        promise: () => Promise.reject('Error: forbidden')
      }
    })
  }

  let bucket = new Bucket('my-bucket', {}, connection)
  expect(bucket.validate()).rejects.toEqual(
    new Error('Bucket: my-bucket exists, but you do not have permission to access it.')
  )
})

test('Returns AWS error when you cannot create the bucket', async () => {
  let connection = {
    headBucket: jest.fn(() => {
      return {
        promise: () => Promise.reject('Error: notfound')
      }
    }),
    createBucket: jest.fn(() => {
      return {
        promise: () => Promise.reject('createBucket Error')
      }
    })
  }

  let bucket = new Bucket('my-bucket', {createBucket: true}, connection)
  expect(bucket.validate()).rejects.toEqual(
    new Error('AWS Error: createBucket Error')
  )
})

test('Returns the AWS error when something else goes wrong', async () => {
  let connection = {
    headBucket: jest.fn(() => {
      return {
        promise: () => Promise.reject('Error: other-thing')
      }
    }),
    createBucket: jest.fn(() => {
      return {
        promise: () => Promise.reject('createBucket Error')
      }
    })
  }

  let bucket = new Bucket('my-bucket', {}, connection)
  expect(bucket.validate()).rejects.toEqual(
    new Error('AWS Error: Error: other-thing')
  )
})









