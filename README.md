s3-deploy for vue-cli
===

This [vue-cli](https://github.com/vuejs/vue-cli) plugin aims to make it easier to deploy a built Vue.js app to an S3 bucket.

Prerequisites
---

You must have a set of [valid AWS credentials set up on your system](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html).


Installation
---
```
yarn add https://github.com/multiplegeorges/vue-cli-plugin-s3-deploy.git
```

Usage
---

After installation, invoke the plugin with `vue invoke s3-deploy`.

Answer the configuration prompts. This will inject a `deploy` script into your
`package.json` file.

Deploy your app with `yarn deploy`

Options
---
```
--bucket    The S3 bucket name, eg: my-site-bucket (required)
--awsRegion AWS region for the specified bucket (default: us-east-1)
--assetPath The path to the built assets (default: dist)
--pwa       Sets max-age=0 for the PWA-related files specified
```

The `pwa` option is meant to help make deploying progressive web apps a little
easier. Due to the way service workers interact with caching, this option will tell
the browser to not cache the `service-worker.js` file at all. This ensures that changes made
to the service worker are reflected as quickly as possible.

You can specify which files aren't cached by passing a value to the option:

`--pwa=index.html,dont-cache.css,not-this.js`

---
