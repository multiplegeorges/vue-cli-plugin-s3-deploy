s3-deploy for vue-cli
===

CALL FOR CONTRIBUTORS
===
If you'd like to participate in the development and maintenance of this plugin, please open a PR or an issue. Help is welcome. 
Thanks to all who have contributed so far!

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
yarn add vue-cli-plugin-s3-deploy
```

Usage
---

After installation, invoke the plugin with `vue invoke s3-deploy`.

Answer the configuration prompts. This will inject a `deploy` script command into your `package.json` file.

Deploy your app with `yarn deploy`.

Options
---

Options are set in `vue.config.js` and overridden on a per-environment basis by `.env`, `.env.staging`, `.env.production`, etc.

```js
module.exports = {
  pluginOptions: {
    s3Deploy: {
      awsProfile: "Specifies the credentials profile to use. For env vars, omit or set to 'default'. (default: default)",
      endpoint: "Override the default AWS endpoint with another e.g. DigitalOcean.",
      region: "AWS region for the specified bucket (default: us-east-1)",
      bucket: "The S3 bucket name (required)",
      createBucket: "Create the bucket if it doesn't exist (default: false)",
      staticHosting: "Enable S3 static site hosting (default: false)",
      staticIndexPage: "Sets the default index file (default: index.html)",
      staticErrorPage: "Sets the default error file (default: error.html)",
      assetPath: "The path to the built assets (default: dist)",
      assetMatch: "Regex matcher for asset to deploy (default: **)",
      deployPath: "Path to deploy the app in the bucket (default: /)",
      acl: "Access control list permissions to apply in S3 (default: public-read)",
      uploadConcurrency: "The number of concurrent uploads to S3 (default: 3)",
      pwa: "Sets max-age=0 for the PWA-related files specified (default: false)",
      pwaFiles: "Comma-separated list of files to treat as PWA files",
      enableCloudfront: "Enables support for Cloudfront distribution invalidation (default: false)",
      cloudfrontId: "The ID of the distribution to invalidate",
      cloudfrontMatchers: "A comma-separated list of paths to invalidate (default: /*)",
      uploadConcurrency: "Number of concurrent uploads (default: 5)",
      cacheControl: "Sets cache-control metadata for all uploads, overridden for individual files by pwa settings",
      gzip: "Enables GZIP compression",
      gzipFilePattern: "Pattern for matching files to be gzipped. (By default: '**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}')"
    }
  }
}
```

The `pwa` option is meant to help make deploying progressive web apps a little easier. Due to the way service workers interact with caching, this option alone will tell the browser to not cache the `service-worker.js` file by default. This ensures that changes made to the service worker are reflected as quickly as possible.

You can specify which files aren't cached by setting a value for the `pwaFiles` option:

```js
{
    pwaFiles: "index.html,dont-cache.css,not-this.js"
}
```

The `cacheControl` option is intended for deployments with lots of static files and relying on browser or CDN caching.

For example, you may want to have files default to being cached for 1 day:

```js
{
    cacheControl: "max-age=86400"
}
```

Per-Environment Overrides
---

Deployment options can be overridden with .env files to support development, staging, and production deployment environments.

The .env file options are, with examples:

```sh
VUE_APP_S3D_AWS_PROFILE=stagingadmin
VUE_APP_S3D_REGION=staging-aws-east-1
VUE_APP_S3D_BUCKET=staging-bucket
VUE_APP_S3D_CREATE_BUCKET=true
VUE_APP_S3D_UPLOAD_CONCURRENCY=5

VUE_APP_S3D_STATIC_HOSTING=true
VUE_APP_S3D_STATIC_INDEX_PAGE=index.html
VUE_APP_S3D_STATIC_ERROR_PAGE=error.html

VUE_APP_S3D_ASSET_PATH=dist/staging
VUE_APP_S3D_ASSET_MATCH=**
VUE_APP_S3D_DEPLOY_PATH=/app-staging
VUE_APP_S3D_ACL=public-read

VUE_APP_S3D_PWA=true
VUE_APP_S3D_PWA_FILES=service-worker-stage.js,index.html

VUE_APP_S3D_CACHE_CONTROL="max-age=3600"
VUE_APP_S3D_GZIP=true
VUE_APP_S3D_GZIP_FILE_PATTERN="**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}"

VUE_APP_S3D_ENABLE_CLOUDFRONT=true
VUE_APP_S3D_CLOUDFRONT_ID=AIXXXXXXXX
VUE_APP_S3D_CLOUDFRONT_MATCHERS=/index.html,/styles/*.css,/*.png
```

**These options OVERRIDE the config options set in vue.config.js** and should be used to customize a default set of options. A common use case is only overriding `VUE_APP_S3D_BUCKET` for production deployment.

Specifying AWS Credentials
---

The AWS SDK will pick up the specified credentials from your `~/.aws/credentials` file and from the environment variables `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, and `AWS_SESSION_TOKEN`.

To specify credentials other than `default` in `~/.aws/credentials`, re-run `vue invoke s3-deploy` and select a different profile.


Changelog
---

**4.0.0-rc3**

- Include recent PRs and bug fixes

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
