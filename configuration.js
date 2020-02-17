"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.VERSION = void 0;

var _lodash = require("lodash");

var _joi = _interopRequireDefault(require("joi"));

var _path = require("path");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var VERSION = '4.0.0-rc3';
exports.VERSION = VERSION;

var Configuration =
/*#__PURE__*/
function () {
  function Configuration(options) {
    _classCallCheck(this, Configuration);

    if (!options) throw new TypeError('Options are required.');
    this.externalOptions = options;
    this.options = {};
    this.prefix = 'VUE_APP_S3D';
    var optionsDefinition = {
      pluginVersion: _joi.default.string().valid(VERSION).error(function (err) {
        return "\n          Configuration is out of date.\n          Config: ".concat(err[0].context.value, " Plugin: ").concat(VERSION, "\n          Run 'vue invoke s3-deploy'\n        ");
      }).required(),
      awsProfile: _joi.default.string().default('default'),
      overrideEndpoint: _joi.default.boolean().default(false),
      endpoint: _joi.default.string(),
      region: _joi.default.string().regex(/^[-0-9a-zA-Z]+$/).default('us-east-1'),
      bucket: _joi.default.string().required(),
      createBucket: _joi.default.boolean().default(false),
      uploadConcurrency: _joi.default.number().min(1).default(5),
      staticHosting: _joi.default.boolean().default(false),
      staticIndexPage: _joi.default.string().default('index.html'),
      staticErrorPage: _joi.default.string().default('index.html'),
      staticWebsiteConfiguration: _joi.default.object(),
      assetPath: _joi.default.string().default('dist'),
      assetMatch: _joi.default.string().default('**'),
      deployPath: _joi.default.string().default('/'),
      acl: _joi.default.string().default('public-read'),
      pwa: _joi.default.boolean().default(false),
      pwaFiles: _joi.default.string().default('index.html,service-worker.js,manifest.json'),
      enableCloudfront: _joi.default.boolean().default(false),
      cloudfrontId: _joi.default.string(),
      cloudfrontMatchers: _joi.default.string().default('/index.html,/service-worker.js,/manifest.json'),
      registry: _joi.default.any(),
      gzip: _joi.default.boolean().default(false),
      gzipFilePattern: _joi.default.string().default('**/*.{js,css,json,ico,map,xml,txt,svg,eot,ttf,woff,woff2}'),
      cacheControl: _joi.default.string().default('max-age=86400')
    };

    var optionsSchema = _joi.default.object().keys(optionsDefinition).requiredKeys('bucket');

    var envOptions = this.applyEnvOverrides(options, Object.keys(optionsDefinition));

    var validOptions = _joi.default.validate(envOptions, optionsSchema);

    if (!validOptions.error) {
      this.options = validOptions.value;
    } else {
      throw validOptions.error;
    }
  }

  _createClass(Configuration, [{
    key: "applyEnvOverrides",
    value: function applyEnvOverrides(options, optionNames) {
      var _this = this;

      var optionsCopy = _objectSpread({}, options);

      optionNames.forEach(function (name) {
        var envVar = "".concat(_this.prefix, "_").concat((0, _lodash.snakeCase)(name).toUpperCase());
        optionsCopy[name] = process.env[envVar] || optionsCopy[name];
      });
      return optionsCopy;
    }
  }]);

  return Configuration;
}();

var _default = Configuration;
exports.default = _default;