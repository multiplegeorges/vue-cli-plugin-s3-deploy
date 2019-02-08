"use strict";

var _configuration = require("./configuration");

module.exports = function (api, options, rootOptions) {
  api.extendPackage({
    scripts: {
      deploy: "vue-cli-service s3-deploy"
    }
  });
  options.pluginVersion = _configuration.VERSION; // Override these in a .env file or in vue.config.js

  options.uploadConcurrency = 5;
  api.extendPackage({
    vue: {
      pluginOptions: {
        s3Deploy: options
      }
    }
  });
};