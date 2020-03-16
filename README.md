s3-deploy for vue-cli
===

CALL FOR CONTRIBUTORS
===
If you'd like to participate in the development and maintenance of this plugin, please open a PR or an issue. Help is welcome. 
Thanks to all who have contributed so far!

**NOTE:** This branch refers to version 4.0.0 and above. See the [3.0.0 branch](https://github.com/multiplegeorges/vue-cli-plugin-s3-deploy/tree/3.0.0) for the previous version.

Usage
===

[![npm version](https://badge.fury.io/js/vue-cli-plugin-s3-deploy.svg)](https://badge.fury.io/js/vue-cli-plugin-s3-deploy)

This [vue-cli](https://github.com/vuejs/vue-cli) plugin aims to make it easier to deploy a built Vue.js app to an S3 bucket.

Supports:

* Custom AWS regions
* Support for AWS credential profiles and authentication via AWS environment variables
* Support for S3 static site hosting
* Concurrent uploads for improved deploy times
* CloudFront distribution invalidation
* Correct `Cache-Control` metadata for use with PWAs and Service Workers
* GZIP compression
* Configurable paths for multiple Vue apps in a single bucket

Prerequisites
---

You must have a set of [valid AWS credentials set up on your system](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).

Installation
---
```
yarn add vue-cli-plugin-s3-deploy@next
```

Usage
---

After installation, invoke the plugin with `vue invoke s3-deploy`.

Answer the configuration prompts. This will inject a `deploy` script command into your `package.json` file.

Deploy your app with `yarn deploy`.

See Also: [Per-Environment Deployment](#Per-Environment%20Deployment)

Options
---

Options are set in `vue.config.js` and overridden on a per-environment basis by `.env`, `.env.staging`, `.env.production`, etc.

|Option|Type|Default|Description|
|---|---|---|---|
|`awsProfile`|string|`default`|Specifies the credentials profile to use. For env vars, omit or set to 'default'.
|`endpoint`|string|*|Override the default AWS endpoint with another e.g. DigitalOcean.|
|`region`|string|`us-east-1`|AWS region for the specified bucket|
|`bucket`|string||The S3 bucket name (required)|
|`createBucket`|boolean|`false`|Create the bucket if it doesn't exist|
|`staticHosting`|boolean|`false`|Enable S3 static site hosting|
|`staticIndexPage`|string|`index.html`|Sets the default index file|
|`staticErrorPage`|string|`index.html`|Sets the default error file|
|`assetPath`|string|`dist`|The path to the built assets|
|`assetMatch`|string|`**`|Regex matcher for asset to deploy|
|`deployPath`|string|`/`|Path to deploy the app in the bucket|
|`acl`|string|`public-read`|Access control list permissions to apply in S3|
|`pwa`|boolean|`false`|Sets max-age=0 for the PWA-related files specified|
|`pwaFiles`|string||Comma-separated list of files to treat as PWA files (see example below)[#Per-File%20PWA]|
|`enableCloudfront`|boolean|`false`|Enables support for Cloudfront distribution invalidation|
|`cloudfrontId`|string||The ID of the distribution to invalidate|
|`cloudfrontMatchers`|string|`/*`|A comma-separated list of paths to invalidate|
|`uploadConcurrency`|number|`5`|Number of concurrent uploads|
|`cacheControl`|string|`public-read`|Sets cache-control metadata for all uploads, overridden for individual files by pwa settings (see example below)[#Cache%20Control]|
|`cacheControlPerFile`|string||Overrides the cacheControl setting on a per-file basis (see example below)[#Per-File%20Cache%20Control]|
|`gzip`|string|`true`|Enables GZIP compression|
|`gzipFilePattern`|string|`**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}`|Pattern for matching files to be gzipped.|

Per-File PWA
---

The `pwa` option is meant to help make deploying progressive web apps a little easier. Due to the way service workers interact with caching, this option alone will tell the browser to not cache the `service-worker.js` file by default. This ensures that changes made to the service worker are reflected as quickly as possible.

You can specify which files aren't cached by setting a value for the `pwaFiles` option:

```js
{
    pwaFiles: "index.html,dont-cache.css,not-this.js"
}
```

Cache Control
---

The `cacheControl` option is intended for deployments with lots of static files and relying on browser or CDN caching.

For example, you may want to have files default to being cached for 1 day:

```js
{
    cacheControl: "max-age=86400"
}
```

Per-File Cache Control
---

The `cacheControlPerFile` option takes precedence over `cacheControl`. Invididual files or globs can be used as keys.

```js
{
    cacheControlPerFile: {
        'img/*': 'max-age=31536000',
        'index.html': 'max-age=600'
    }
}
```

Per-Environment Overrides
---

Deployment options can be overridden with .env files to support development, staging, and production deployment environments.

The .env file options are, with examples:

```sh
S3D_AWS_PROFILE=stagingadmin
S3D_REGION=staging-aws-east-1
S3D_BUCKET=staging-bucket
S3D_CREATE_BUCKET=true
S3D_UPLOAD_CONCURRENCY=5

S3D_STATIC_HOSTING=true
S3D_STATIC_INDEX_PAGE=index.html
S3D_STATIC_ERROR_PAGE=error.html

S3D_ASSET_PATH=dist/staging
S3D_ASSET_MATCH=**
S3D_DEPLOY_PATH=/app-staging
S3D_ACL=public-read

S3D_PWA=true
S3D_PWA_FILES=service-worker-stage.js,index.html

S3D_CACHE_CONTROL="max-age=3600"
S3D_GZIP=true
S3D_GZIP_FILE_PATTERN="**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}"

S3D_ENABLE_CLOUDFRONT=true
S3D_CLOUDFRONT_ID=AIXXXXXXXX
S3D_CLOUDFRONT_MATCHERS=/index.html,/styles/*.css,/*.png
```

**These options OVERRIDE the config options set in vue.config.js** and should be used to customize a default set of options. A common use case is only overriding `S3D_BUCKET` for production deployment.

Per-Environment Deployment
---

To deploy to different enviroments the `mode` must be set in the CLI:  
`yarn deploy --mode production` or `yarn deploy --mode staging`, relevent to your `.env.production` or `.env.staging` files (or `yarn deploy --mode unicorns` for `.env.unicorns`).  

Slightly [different for NPM](https://github.com/vuejs/vue-cli/issues/1528#issuecomment-395970443):  
`npm run deploy -- --mode production` or `npm run deploy -- --mode staging`.


Specifying AWS Credentials
---

The AWS SDK will pick up the specified credentials from your `~/.aws/credentials` file and from the environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN`.

To specify credentials other than `default` in `~/.aws/credentials`, re-run `vue invoke s3-deploy` and select a different profile.


Changelog
---

**4.0.0**
- Migrated to class based implementation.
- Support Custom StaticWebsiteConfiguration.
- Support Updating Static configuration on existing bucket.
- Support array options in globby matches.
- Support deployment with no ACL set.
- Support custom function when deployment is completed.
- Support CacheControl per-file (thanks @mhluska)
- Fix region not being set on bucket.
- Fix incorrect remote path displayed.
- Remove VUE_APP prefix from env variables.


**3.0.0**

- Added support for S3 static site hosting configuration and setup
- Corrected some Windows related bugs
- Added pluginVersion to the configuration. This prompts users to re-invoke the `vue invoke`.
- Bumped major version due to incompatibilities in the configuration options.

**2.1.1**

- Rollback crendential selection via `awsProfile`. The SDK supports this via the `AWS_PROFILE` environment variable.

**2.1**

- Added `deployPath` option. Allows you to deploy to folder in the bucket, not always to the root. Fixes #15.
- Added `awsProfile` for using AWS credentials other than `default`. Fixes #19.
- Fixed #12: paths were built naively and broke deployment on Windows platforms.

**v2.0.2**

- Fixed bug where deployment crashes if you declined Cloudfront on initial invocation.

**v2.0.0**
- Added support for invalidating Cloudfront distributions on deploy.
- Refactored how the configuration is stored and brought it more inline with vue cli standards. All config is in vue.config.js now.
- Updated the dependency on vue-cli to 3.0.0-rc3
- Squashed a few bugs along the way

**v1.3**
- Added support for .env files and per-environment options

**v1.2**
- Added parallel uploading

**v1.1**
- Initial Release

Contributing
---

Clone the repo and install dependencies with `yarn install`.
Run `yarn watch-test` to start a test runner.
Build the dist directory with `yarn build`.

Contributions welcome.  
Just open a pull request.
