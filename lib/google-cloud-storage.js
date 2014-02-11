/*
 * grunt-google-cloud-storage
 * https://github.com/UsabilityDynamics/grunt-google-cloud-storage
 *
 * Copyright (c) 2013 Andy Potanin
 * Licensed under the MIT license.
 */
var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');
var mime = require('mime');
var GCS = function(authData) {
    this.baseUrl = 'https://www.googleapis.com';
    this.uploadUrl = this.baseUrl + '/upload/storage/v1beta2/b/{bucket}/o';
    this.deleteUrl = this.baseUrl + '/storage/v1beta2/b/{bucket}/o/{object}';
    this.accessToken = null;
    this.authData = authData;
};
/**
 *
 * @param file string
 * @param bucket string
 * @param callback callback
 */
GCS.prototype.uploadFile = function(file, bucket, callback) {
    if (!file) {
        throw Error('You must specify file to upload');
    }
    if (!bucket) {
        throw Error('You must specify bucket');
    }
    var self = this;
    var realPath = fs.realpathSync(__dirname + '/../' + file);
    var baseFileName = path.basename(realPath); //todo in what place do we have to upload file? base directory or with sub directories?
    var url = this.uploadUrl.replace('{bucket}', bucket);
    var queryParams = {
        'uploadType': 'media',
        'name': file
    };
    var headers = {};
    async.waterfall([
        function getStats(next) {
            console.info('getting stats');
            console.info(file);
            fs.exists(file, function(exist) {
                if (exist) {
                    fs.stat(file, next);
                } else {
                    next(new Error('File to upload: ' + file + ' does not exist!'))
                }
            })
        }, function createRequestStream(stats, next) {
            console.info('create steam');
            var stream = fs.createReadStream(file);
            stream.on('error', function(err) {
                next(err);
            });
            stream.on('open', function() {
                next(null, stream, stats);
            });
        }, function createRequest(stream, stats, next) {
            console.info('creating request');
            self.getAccessToken(function(err, accessToken) {
                if (err) {
                    next(err);
                } else {
                    headers['Authorization'] = 'Bearer ' + accessToken;
                    headers['Content-Type'] = mime.lookup(baseFileName);
                    headers['Content-Length'] = stats.size;
                    stream.pipe(request.post(url, {headers: headers, qs: queryParams}, next));
                }
            });
        }
    ], function(err, request, body) {
        if (err) {
            callback(err);
        } else {
            if (request.statusCode == 200) {
                var parsedBody = JSON.parse(body);
                if (request.statusCode == 200) {
                    if (parsedBody.hasOwnProperty('error')) {
                        callback(parsedBody.error);
                    } else {
                        if (parsedBody.hasOwnProperty('selfLink')) {
                            callback(null, parsedBody.selfLink);
                        } else {
                            callback(new Error('Error has happened while uploading to ' + bucket + ' bucket!'));
                        }
                    }
                }
            }
        }
    });
};
GCS.prototype.deleteFile = function(file, bucket, callback) {
    //    var fName = path.basename(file);
    var url = this.deleteUrl.replace('{bucket}', bucket).replace('{object}', encodeURIComponent(file));
    this.getAccessToken(function(err, accessToken) {
        if (err) {
            callback(err);
        } else {
            var headers = [];
            headers['Authorization'] = 'Bearer ' + accessToken;
            request.del(url, {headers: headers}, function(err, request, body) {
                if (err) {
                    callback(err);
                } else {
                    if (request.statusCode == 200 && body === '') {
                        callback(null)
                    } else {
                        try {
                            var parsedBody = JSON.parse(body);
                            if (parsedBody.hasOwnProperty('error')) {
                                callback(parsedBody.error);
                            } else {
                                callback(new Error('Unexpected error has happened while deleting ' + file + ' file'));
                            }
                        } catch (err) {
                            callback(body);
                        }
                    }
                }
            });
        }
    });
};
GCS.prototype.getAccessToken = function(callback) {
    if (this.accessToken) {
        callback(null, this.accessToken);
    } else {
        var gauth = require('./google-oauth-serviceaccount')(this.authData);
        gauth.auth(callback);
    }
};
module.exports = function(authData) {
    return new GCS(authData);
}