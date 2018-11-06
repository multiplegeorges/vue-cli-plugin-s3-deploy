"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _configuration = require("./configuration");

var generatorFn = function generatorFn(api, options, rootOptions) {
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

var _default = generatorFn;
exports.default = _default;