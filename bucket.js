"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _cliSharedUtils = require("@vue/cli-shared-utils");

var _mimeTypes = _interopRequireDefault(require("mime-types"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Bucket =
/*#__PURE__*/
function () {
  function Bucket(name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var connection = arguments.length > 2 ? arguments[2] : undefined;

    _classCallCheck(this, Bucket);

    if (!name) throw new TypeError('Bucket name must be defined.');
    if (!connection) throw new TypeError('Bucket requires a connection.');
    this.name = name;
    this.options = options;
    this.connection = connection;
  }

  _createClass(Bucket, [{
    key: "validate",
    value: function () {
      var _validate = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee() {
        var params, message;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                params = {
                  Bucket: this.name
                };
                _context.prev = 1;
                _context.next = 4;
                return this.connection.headBucket(params).promise();

              case 4:
                return _context.abrupt("return", _context.sent);

              case 7:
                _context.prev = 7;
                _context.t0 = _context["catch"](1);
                message = _context.t0.toString().toLowerCase();

                if (!message.includes('forbidden')) {
                  _context.next = 14;
                  break;
                }

                throw new Error("Bucket: ".concat(this.name, " exists, but you do not have permission to access it."));

              case 14:
                if (!message.includes('notfound')) {
                  _context.next = 25;
                  break;
                }

                if (!this.options.createBucket) {
                  _context.next = 22;
                  break;
                }

                (0, _cliSharedUtils.logWithSpinner)("Bucket: creating bucket ".concat(this.name, " ..."));
                _context.next = 19;
                return this.createBucket();

              case 19:
                (0, _cliSharedUtils.stopSpinner)();
                _context.next = 23;
                break;

              case 22:
                throw new Error("Bucket: ".concat(this.name, " not found."));

              case 23:
                _context.next = 27;
                break;

              case 25:
                (0, _cliSharedUtils.error)("Bucket: ".concat(this.name, " could not be validated."));
                throw new Error("AWS Error: ".concat(_context.t0.toString()));

              case 27:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 7]]);
      }));

      function validate() {
        return _validate.apply(this, arguments);
      }

      return validate;
    }()
  }, {
    key: "createBucket",
    value: function () {
      var _createBucket = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee2() {
        var params;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                params = {
                  Bucket: this.name,
                  ACL: this.options.acl
                };
                _context2.prev = 1;
                _context2.next = 4;
                return this.connection.createBucket(params).promise();

              case 4:
                _context2.next = 10;
                break;

              case 6:
                _context2.prev = 6;
                _context2.t0 = _context2["catch"](1);
                (0, _cliSharedUtils.error)("Bucket: ".concat(this.name, " could not be created."));
                throw new Error("AWS Error: ".concat(_context2.t0.toString()));

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[1, 6]]);
      }));

      function createBucket() {
        return _createBucket.apply(this, arguments);
      }

      return createBucket;
    }()
  }, {
    key: "enableHosting",
    value: function () {
      var _enableHosting = _asyncToGenerator(
      /*#__PURE__*/
      regeneratorRuntime.mark(function _callee3() {
        var params;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                params = {
                  Bucket: this.name,
                  WebsiteConfiguration: {
                    ErrorDocument: {
                      Key: this.options.staticErrorPage
                    },
                    IndexDocument: {
                      Suffix: this.options.staticIndexPage
                    }
                  }
                };

                if (this.options.staticWebsiteConfiguration) {
                  params.WebsiteConfiguration = this.options.staticWebsiteConfiguration;
                }

                _context3.prev = 2;
                (0, _cliSharedUtils.logWithSpinner)("Bucket: enabling static hosting...");
                _context3.next = 6;
                return this.connection.putBucketWebsite(params).promise();

              case 6:
                (0, _cliSharedUtils.stopSpinner)();
                _context3.next = 13;
                break;

              case 9:
                _context3.prev = 9;
                _context3.t0 = _context3["catch"](2);
                (0, _cliSharedUtils.error)("Static hosting could not be enabled on bucket: ".concat(this.name));
                throw new Error("AWS Error: ".concat(_context3.t0.toString()));

              case 13:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[2, 9]]);
      }));

      function enableHosting() {
        return _enableHosting.apply(this, arguments);
      }

      return enableHosting;
    }()
  }, {
    key: "uploadFile",
    value: function uploadFile(fileKey, fileStream, uploadOptions) {
      var uploadFileKey = fileKey.replace(this.options.fullAssetPath, '').replace(/\\/g, '/');
      var fullFileKey = "".concat(this.options.deployPath).concat(uploadFileKey);
      var uploadParams = {
        Bucket: this.name,
        Key: fullFileKey,
        ACL: this.options.acl,
        Body: fileStream,
        ContentType: this.contentTypeFor(fileKey)
      };

      if (uploadOptions.pwa) {
        uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
      } else {
        uploadParams.CacheControl = this.options.cacheControl;
      }

      if (uploadOptions.gzip) {
        uploadParams.ContentEncoding = 'gzip';
      }

      return this.connection.upload(uploadParams, {
        partSize: 5 * 1024 * 1024,
        queueSize: 4
      }).promise();
    }
  }, {
    key: "contentTypeFor",
    value: function contentTypeFor(filename) {
      return _mimeTypes.default.lookup(filename) || 'application/octet-stream';
    }
  }]);

  return Bucket;
}();

var _default = Bucket;
exports.default = _default;