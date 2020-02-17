"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _path = _interopRequireDefault(require("path"));

var _globby = _interopRequireDefault(require("globby"));

var _fs = _interopRequireDefault(require("fs"));

var _zlib = _interopRequireDefault(require("zlib"));

var _cliSharedUtils = require("@vue/cli-shared-utils");

var _awsSdk = _interopRequireDefault(require("aws-sdk"));

var _es6PromisePool = _interopRequireDefault(require("es6-promise-pool"));

var _bucket = _interopRequireDefault(require("./bucket"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Deployer =
/*#__PURE__*/
function () {
  function Deployer(config) {
    _classCallCheck(this, Deployer);

    if (!config) throw new TypeError('Configuration is required.');
    config.awsConfig = {
      region: config.options.region,
      httpOptions: {
        connectTimeout: 30 * 1000,
        timeout: 120 * 1000
      }
    };

    if (config.options.overrideEndpoint) {
      config.awsConfig.endpoint = config.options.endpoint;
    } // path.sep appends a trailing / or \ depending on platform.


    config.fullAssetPath = _path.default.join(process.cwd(), config.options.assetPath) + _path.default.sep;
    config.deployPath = this.deployPath(config.options.deployPath);
    config.fileList = _globby.default.sync(config.options.assetMatch, {
      cwd: config.fullAssetPath
    }).map(function (file) {
      return _path.default.join(config.fullAssetPath, file);
    });
    config.remotePath = config.options.staticHosting ? "https://s3-".concat(config.options.region, ".amazonaws.com/").concat(config.options.bucket, "/") : "https://".concat(config.options.bucket, ".s3-website-").concat(config.options.region, ".amazonaws.com/");
    this.config = config;
  }

  _createClass(Deployer, [{
    key: "openConnection",
    value: function () {
      var _openConnection = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var credentials;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (this.config.options.awsProfile !== 'default') {
                  credentials = new _awsSdk.default.SharedIniFileCredentials({
                    profile: this.config.options.awsProfile
                  });
                  this.config.awsConfig.credentials = credentials;
                }

                _awsSdk.default.config.update(this.config.awsConfig);

                this.connection = new _awsSdk.default.S3();
                (0, _cliSharedUtils.info)('Connection to S3 created.');

              case 4:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function openConnection() {
        return _openConnection.apply(this, arguments);
      }

      return openConnection;
    }()
  }, {
    key: "run",
    value: function () {
      var _run = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var uploadPool;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.bucket = new _bucket.default(this.config.options.bucket, {
                  fullAssetPath: this.config.fullAssetPath,
                  deployPath: this.config.deployPath,
                  createBucket: this.config.options.createBucket,
                  acl: this.config.options.acl,
                  staticErrorPage: this.config.options.staticErrorPage,
                  staticIndexPage: this.config.options.staticIndexPage,
                  staticWebsiteConfiguration: this.config.options.staticWebsiteConfiguration,
                  cacheControl: this.config.options.cacheControl
                }, this.connection);
                _context2.prev = 1;
                _context2.next = 4;
                return this.bucket.validate();

              case 4:
                _context2.next = 13;
                break;

              case 6:
                _context2.prev = 6;
                _context2.t0 = _context2["catch"](1);
                _context2.next = 10;
                return this.bucket.createBucket();

              case 10:
                if (!this.options.staticHosting) {
                  _context2.next = 13;
                  break;
                }

                _context2.next = 13;
                return bucket.enableHosting();

              case 13:
                (0, _cliSharedUtils.info)("Deploying ".concat(this.config.fileList.length, " assets from ").concat(this.config.fullAssetPath, " to ").concat(this.config.remotePath));
                this.uploadCount = 0;
                this.uploadTotal = this.config.fileList.length;
                uploadPool = new _es6PromisePool.default(this.uploadNextFile.bind(this), parseInt(this.config.options.uploadConcurrency, 10));
                _context2.prev = 17;
                _context2.next = 20;
                return uploadPool.start();

              case 20:
                (0, _cliSharedUtils.info)('Deployment complete.');

                if (this.config.options.enableCloudfront) {
                  this.invalidateDistribution();
                }

                _context2.next = 28;
                break;

              case 24:
                _context2.prev = 24;
                _context2.t1 = _context2["catch"](17);
                (0, _cliSharedUtils.error)("Deployment encountered errors.");
                throw new Error("Upload error: ".concat(_context2.t1.toString()));

              case 28:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 6], [17, 24]]);
      }));

      function run() {
        return _run.apply(this, arguments);
      }

      return run;
    }()
  }, {
    key: "uploadNextFile",
    value: function uploadNextFile() {
      var _this = this;

      if (this.config.fileList.length === 0) {
        return null;
      }

      var filename = this.config.fileList.pop();

      var fileStream = _fs.default.readFileSync(filename);

      var fileKey = filename.replace(this.config.fullAssetPath, '').replace(/\\/g, '/');
      var fullFileKey = "".concat(this.config.deployPath).concat(fileKey);
      var pwaSupportForFile = this.config.options.pwa && this.config.options.pwaFiles.split(',').indexOf(fileKey) > -1;

      var gzip = this.config.options.gzip && _globby.default.sync(this.config.options.gzipFilePattern, {
        cwd: this.config.fullAssetPath
      });

      if (gzip) {
        fileStream = _zlib.default.gzipSync(fileStream, {
          level: 9
        });
      }

      try {
        return this.bucket.uploadFile(fullFileKey, fileStream, {
          pwa: pwaSupportForFile,
          gzip: gzip
        }).then(function () {
          _this.uploadCount++;
          var pwaMessage = pwaSupportForFile ? ' with cache disabled for PWA' : '';
          (0, _cliSharedUtils.info)("(".concat(_this.uploadCount, "/").concat(_this.uploadTotal, ") Uploaded ").concat(fullFileKey).concat(pwaMessage));
        });
      } catch (uploadError) {
        throw new Error("(".concat(this.uploadCount, "/").concat(this.uploadTotal, ") Upload failed: ").concat(fullFileKey, ". AWS Error: ").concat(uploadError.toString(), "."));
      }
    }
  }, {
    key: "deployPath",
    value: function deployPath(path) {
      var fixedPath; // We don't need a leading slash for root deploys on S3.

      if (path.startsWith('/')) fixedPath = path.slice(1, path.length); // But we do need to make sure there's a trailing one on the path.

      if (!path.endsWith('/') && path.length > 0) fixedPath = path + '/';
      return fixedPath;
    }
  }, {
    key: "invalidateDistribution",
    value: function () {
      var _invalidateDistribution = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3() {
        var cloudfront, invalidationItems, params, data;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                cloudfront = new _awsSdk.default.CloudFront();
                invalidationItems = this.config.options.cloudfrontMatchers.split(',');
                params = {
                  DistributionId: this.config.options.cloudfrontId,
                  InvalidationBatch: {
                    CallerReference: "vue-cli-plugin-s3-deploy-".concat(Date.now().toString()),
                    Paths: {
                      Quantity: invalidationItems.length,
                      Items: invalidationItems
                    }
                  }
                };
                _context3.prev = 3;
                (0, _cliSharedUtils.logWithSpinner)("Invalidating CloudFront distribution: ".concat(this.config.options.cloudfrontId));
                _context3.next = 7;
                return cloudfront.createInvalidation(params).promise();

              case 7:
                data = _context3.sent;
                (0, _cliSharedUtils.info)("Invalidation ID: ".concat(data['Invalidation']['Id']));
                (0, _cliSharedUtils.info)("Status: ".concat(data['Invalidation']['Status']));
                (0, _cliSharedUtils.info)("Call Reference: ".concat(data['Invalidation']['InvalidationBatch']['CallerReference']));
                (0, _cliSharedUtils.info)("See your AWS console for on-going status on this invalidation.");
                (0, _cliSharedUtils.stopSpinner)();
                _context3.next = 23;
                break;

              case 15:
                _context3.prev = 15;
                _context3.t0 = _context3["catch"](3);
                (0, _cliSharedUtils.stopSpinner)(false);
                (0, _cliSharedUtils.error)('Cloudfront Error!!');
                (0, _cliSharedUtils.error)("Code: ".concat(_context3.t0.code));
                (0, _cliSharedUtils.error)("Message: ".concat(_context3.t0.message));
                (0, _cliSharedUtils.error)("AWS Request ID: ".concat(_context3.t0.requestId));
                throw new Error('Cloudfront invalidation failed!');

              case 23:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[3, 15]]);
      }));

      function invalidateDistribution() {
        return _invalidateDistribution.apply(this, arguments);
      }

      return invalidateDistribution;
    }()
  }]);

  return Deployer;
}();

var _default = Deployer;
exports.default = _default;