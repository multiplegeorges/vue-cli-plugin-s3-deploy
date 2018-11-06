"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('@vue/cli-shared-utils'),
    info = _require.info,
    error = _require.error,
    logWithSpinner = _require.logWithSpinner,
    stopSpinner = _require.stopSpinner;

var path = require('path');

var fs = require('fs');

var mime = require('mime-types');

var globby = require('globby');

var AWS = require('aws-sdk');

var PromisePool = require('es6-promise-pool');

function contentTypeFor(filename) {
  return mime.lookup(filename) || 'application/octet-stream';
}

function createBucket(_x) {
  return _createBucket.apply(this, arguments);
}

function _createBucket() {
  _createBucket = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee3(options) {
    var createParams;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            createParams = {
              Bucket: options.bucket,
              ACL: options.acl // Create bucket

            };
            _context3.prev = 1;
            _context3.next = 4;
            return S3.createBucket(createParams).promise();

          case 4:
            _context3.next = 10;
            break;

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3["catch"](1);
            error("Bucket: ".concat(options.bucket, " could not be created. AWS Error: ").concat(_context3.t0.toString(), "."));
            return _context3.abrupt("return", false);

          case 10:
            info("Bucket: ".concat(options.bucket, " created."));
            return _context3.abrupt("return", true);

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, this, [[1, 6]]);
  }));
  return _createBucket.apply(this, arguments);
}

function enableStaticHosting(_x2) {
  return _enableStaticHosting.apply(this, arguments);
}

function _enableStaticHosting() {
  _enableStaticHosting = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee4(options) {
    var staticParams;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            staticParams = {
              Bucket: options.bucket,
              WebsiteConfiguration: {
                ErrorDocument: {
                  Key: options.staticErrorPage
                },
                IndexDocument: {
                  Suffix: options.staticIndexPage
                }
              } // use custom WebsiteConfiguration if set

            };

            if (options.staticWebsiteConfiguration) {
              staticParams.WebsiteConfiguration = options.staticWebsiteConfiguration;
            } // enable static hosting


            _context4.prev = 2;
            _context4.next = 5;
            return S3.putBucketWebsite(staticParams).promise();

          case 5:
            info("Static Hosting is enabled.");
            _context4.next = 11;
            break;

          case 8:
            _context4.prev = 8;
            _context4.t0 = _context4["catch"](2);
            error("Static Hosting could not be enabled on bucket: ".concat(options.bucket, ". AWS Error: ").concat(_context4.t0.toString(), "."));

          case 11:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, this, [[2, 8]]);
  }));
  return _enableStaticHosting.apply(this, arguments);
}

function bucketExists(_x3) {
  return _bucketExists.apply(this, arguments);
}

function _bucketExists() {
  _bucketExists = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee5(options) {
    var headParams, bucketExists, errStr;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            headParams = {
              Bucket: options.bucket
            };
            bucketExists = false;
            _context5.prev = 2;
            _context5.next = 5;
            return S3.headBucket(headParams).promise();

          case 5:
            bucketExists = _context5.sent;
            info("Bucket: ".concat(options.bucket, " exists."));
            _context5.next = 28;
            break;

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5["catch"](2);
            errStr = _context5.t0.toString().toLowerCase();

            if (!(errStr.indexOf('forbidden') > -1)) {
              _context5.next = 16;
              break;
            }

            error("Bucket: ".concat(options.bucket, " exists, but you do not have permission to access it."));
            _context5.next = 28;
            break;

          case 16:
            if (!(errStr.indexOf('notfound') > -1)) {
              _context5.next = 27;
              break;
            }

            if (!options.createBucket) {
              _context5.next = 24;
              break;
            }

            info("Bucket: ".concat(options.bucket, " does not exist, attempting to create."));
            _context5.next = 21;
            return createBucket(options);

          case 21:
            bucketExists = _context5.sent;
            _context5.next = 25;
            break;

          case 24:
            error("Bucket: ".concat(options.bucket, " does not exist."));

          case 25:
            _context5.next = 28;
            break;

          case 27:
            error("Could not verify that bucket ".concat(options.bucket, " exists. AWS Error: ").concat(_context5.t0, "."));

          case 28:
            if (!(bucketExists && options.staticHosting)) {
              _context5.next = 31;
              break;
            }

            _context5.next = 31;
            return enableStaticHosting(options);

          case 31:
            return _context5.abrupt("return", bucketExists);

          case 32:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, this, [[2, 9]]);
  }));
  return _bucketExists.apply(this, arguments);
}

function getAllFiles(pattern, assetPath) {
  return;
}

function invalidateDistribution(_x4) {
  return _invalidateDistribution.apply(this, arguments);
}

function _invalidateDistribution() {
  _invalidateDistribution = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee6(options) {
    var cloudfront, invalidationItems, params, data;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            cloudfront = new AWS.CloudFront();
            invalidationItems = options.cloudfrontMatchers.split(',');
            params = {
              DistributionId: options.cloudfrontId,
              InvalidationBatch: {
                CallerReference: "vue-cli-plugin-s3-deploy-".concat(Date.now().toString()),
                Paths: {
                  Quantity: invalidationItems.length,
                  Items: invalidationItems
                }
              }
            };
            logWithSpinner("Invalidating CloudFront distribution: ".concat(options.cloudfrontId));
            _context6.prev = 4;
            _context6.next = 7;
            return cloudfront.createInvalidation(params).promise();

          case 7:
            data = _context6.sent;
            info("Invalidation ID: ".concat(data['Invalidation']['Id']));
            info("Status: ".concat(data['Invalidation']['Status']));
            info("Call Reference: ".concat(data['Invalidation']['InvalidationBatch']['CallerReference']));
            info("See your AWS console for on-going status on this invalidation.");
            _context6.next = 20;
            break;

          case 14:
            _context6.prev = 14;
            _context6.t0 = _context6["catch"](4);
            error('Cloudfront Error!');
            error("Code: ".concat(_context6.t0.code));
            error("Message: ".concat(_context6.t0.message));
            error("AWS Request ID: ".concat(_context6.t0.requestId));

          case 20:
            stopSpinner();

          case 21:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, this, [[4, 14]]);
  }));
  return _invalidateDistribution.apply(this, arguments);
}

function uploadFile(_x5, _x6, _x7) {
  return _uploadFile.apply(this, arguments);
}

function _uploadFile() {
  _uploadFile = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee7(filename, fileBody, options) {
    var fileKey, pwaSupport, fullFileKey, uploadParams;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            fileKey = filename.replace(options.fullAssetPath, '').replace(/\\/g, '/');
            pwaSupport = options.pwa && options.pwaFiles.split(',').indexOf(fileKey) > -1;
            fullFileKey = "".concat(options.deployPath).concat(fileKey);
            uploadParams = {
              Bucket: options.bucket,
              Key: fileKey,
              ACL: options.acl,
              Body: fileBody,
              ContentType: contentTypeFor(fileKey)
            };

            if (pwaSupport) {
              uploadParams.CacheControl = 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0';
            }

            _context7.prev = 5;
            _context7.next = 8;
            return S3.upload(uploadParams, options.uploadOptions).promise();

          case 8:
            _context7.next = 13;
            break;

          case 10:
            _context7.prev = 10;
            _context7.t0 = _context7["catch"](5);
            throw new Error("(".concat(options.uploadCount, "/").concat(options.uploadTotal, ") Upload failed: ").concat(fullFileKey, ". AWS Error: ").concat(_context7.t0.toString(), "."));

          case 13:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, this, [[5, 10]]);
  }));
  return _uploadFile.apply(this, arguments);
}

module.exports =
/*#__PURE__*/
function () {
  var _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee2(config, api) {
    var awsConfig, credentials, fullAssetPath, fileList, uploadCount, uploadTotal, remotePath, nextFile, uploadPool;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            info("Options: ".concat(JSON.stringify(options)));
            awsConfig = {
              region: options.region,
              httpOptions: {
                connectTimeout: 30 * 1000,
                timeout: 120 * 1000
              }
            };

            if (!(options.awsProfile.toString() !== 'default')) {
              _context2.next = 6;
              break;
            }

            credentials = new AWS.SharedIniFileCredentials({
              profile: options.awsProfile
            });
            _context2.next = 6;
            return credentials.get(function (err) {
              if (err) {
                error(err.toString());
              }

              awsConfig.credentials = credentials;
            });

          case 6:
            AWS.config.update(awsConfig);
            _context2.next = 9;
            return bucketExists(options);

          case 9:
            _context2.t0 = _context2.sent;

            if (!(_context2.t0 === false)) {
              _context2.next = 13;
              break;
            }

            error('Deployment terminated.');
            return _context2.abrupt("return");

          case 13:
            options.uploadOptions = {
              partSize: 5 * 1024 * 1024,
              queueSize: 4
            };
            fullAssetPath = path.join(process.cwd(), options.assetPath) + path.sep; // path.sep appends a trailing / or \ depending on platform.

            fileList = getAllFiles(options.assetMatch, fullAssetPath);
            uploadCount = 0;
            uploadTotal = fileList.length;
            remotePath = "https://".concat(options.bucket, ".s3-website-").concat(options.region, ".amazonaws.com/");

            if (options.staticHosting) {
              remotePath = "https://s3-".concat(options.region, ".amazonaws.com/").concat(options.bucket, "/");
            }

            info("Deploying ".concat(fileList.length, " assets from ").concat(fullAssetPath, " to ").concat(remotePath)); // STOPPED HERE

            nextFile =
            /*#__PURE__*/
            function () {
              var _ref2 = _asyncToGenerator(
              /*#__PURE__*/
              regeneratorRuntime.mark(function _callee() {
                var filename, fileStream, fileKey, fullFileKey, pwaSupport, pwaStr;
                return regeneratorRuntime.wrap(function _callee$(_context) {
                  while (1) {
                    switch (_context.prev = _context.next) {
                      case 0:
                        if (!(fileList.length === 0)) {
                          _context.next = 2;
                          break;
                        }

                        return _context.abrupt("return", null);

                      case 2:
                        filename = fileList.pop();
                        fileStream = fs.readFileSync(filename);
                        fileKey = filename.replace(fullAssetPath, '').replace(/\\/g, '/');
                        fullFileKey = "".concat(deployPath).concat(fileKey);
                        _context.prev = 6;
                        _context.next = 9;
                        return uploadFile(fullFileKey, fileStream, options);

                      case 9:
                        uploadCount++;
                        pwaSupport = options.pwa && options.pwaFiles.split(',').indexOf(fileKey) > -1;
                        pwaStr = pwaSupport ? ' with cache disabled for PWA' : '';
                        info("(".concat(uploadCount, "/").concat(uploadTotal, ") Uploaded ").concat(fullFileKey).concat(pwaStr));
                        _context.next = 19;
                        break;

                      case 15:
                        _context.prev = 15;
                        _context.t0 = _context["catch"](6);
                        error("Upload failed: ".concat(fullFileKey));
                        error(_context.t0.toString());

                      case 19:
                      case "end":
                        return _context.stop();
                    }
                  }
                }, _callee, this, [[6, 15]]);
              }));

              return function nextFile() {
                return _ref2.apply(this, arguments);
              };
            }();

            uploadPool = new PromisePool(nextFile, parseInt(options.uploadConcurrency, 10));
            _context2.prev = 23;
            _context2.next = 26;
            return uploadPool.start();

          case 26:
            info('Deployment complete.');

            if (options.enableCloudfront) {
              invalidateDistribution(options);
            }

            _context2.next = 34;
            break;

          case 30:
            _context2.prev = 30;
            _context2.t1 = _context2["catch"](23);
            error("Deployment completed with errors.");
            error("".concat(_context2.t1.toString()));

          case 34:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, this, [[23, 30]]);
  }));

  return function (_x8, _x9) {
    return _ref.apply(this, arguments);
  };
}();