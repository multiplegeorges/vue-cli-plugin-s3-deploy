"use strict";

require("@babel/polyfill");

var _deployer = _interopRequireDefault(require("./deployer"));

var _configuration = _interopRequireDefault(require("./configuration"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _require = require('@vue/cli-shared-utils'),
    error = _require.error,
    warn = _require.warn;

process.on('unhandledRejection', function (err) {
  console.log(err);
  error(JSON.stringify(err));
  process.exit(1);
});

module.exports = function (api, configOptions) {
  api.registerCommand('s3-deploy', {
    description: 'Deploys the built assets to an S3 bucket based on options set in vue.config.js. Configuration done via `vue invoke s3-deploy`',
    usage: 'vue-cli-service s3-deploy'
  }, function (_) {
    var options = configOptions.pluginOptions.s3Deploy;
    var config = new _configuration.default(options);

    if (!config.options.bucket) {
      error('Bucket name must be specified with `bucket` in vue.config.js!');
    } else {
      if (config.options.pwa && !config.options.pwaFiles) {
        warn('Option pwa is set but no files specified! Defaulting to: service-worker.js');
        config.options.pwaFiles = 'service-worker.js';
      }

      if (process.env['S3D_DEBUG']) console.log(config.options);
      var deployer = new _deployer.default(config);
      deployer.openConnection();
      deployer.run();
    }
  });
};