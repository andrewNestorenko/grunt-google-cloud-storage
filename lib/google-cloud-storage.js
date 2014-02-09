/*
 * grunt-google-cloud-storage
 * https://github.com/UsabilityDynamics/grunt-google-cloud-storage
 *
 * Copyright (c) 2013 Andy Potanin
 * Licensed under the MIT license.
 */

var gauth = require('./google-oauth-serviceaccount');
var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');

var GCS = function() {
    this.baseUrl = 'https://www.googleapis.com';
    this.uploadUrl = this.baseUrl + '/upload/storage/v1beta2/b/{bucket}/o';
    this.deleteUrl = this.baseUrl + '/storage/v1beta2/b/{bucket}/o/{object}';
    this.accessToken = null;
};

GCS.prototype.uploadFile = function (file, bucket, cb) {
    if (!file) throw Error('You must specify file to upload');
    if (!bucket) throw Error('You must specify bucket');
    var self = this;
    var realPath = fs.realpathSync(__dirname + '/../' + file);
    var baseFileName = path.basename(realPath);
    var url = this.uploadUrl.replace('{bucket}', bucket);
    var queryParams = {
        'uploadType': 'media',
        'name': file
    };
    var headers = {};
    async.waterfall([
        function getStats (callback) {
            console.info('getting stats');
            console.info(file);
            fs.exists(file, function(exist) {
                if (exist) {
                    fs.stat(file, callback);
                } else {
                    callback(new Error('File to upload: ' + file + ' does not exist!'))
                }
            })
        },

        function createRequestStream (stats, callback) {
            console.info('create steam');
            var stream = fs.createReadStream(file);
            stream.on('error', function(err) {
                callback(err);
            });
            stream.on('open', function() {
                callback(null, stream, stats);
            });
        },

        function createRequest (stream, stats, callback) {
            console.info('creating request');
            self.getAccessToken(function(err, accessToken) {
                if (err) callback(err);
                headers['Authorization'] = 'Bearer ' + accessToken;
                headers['Content-Type'] = 'text/plain';
                headers['Content-Length'] = stats.size;
                stream.pipe(
                    request.post(
                        url, {headers: headers, qs: queryParams}, callback
                    )
                );
            });
        }
    ], function(err, request, body) {
        console.log('done');
        if (err) {
            cb(err);
        } else {
            if (request.statusCode == 200) {
                var parsedBody  = JSON.parse(body);
                if (request.statusCode == 200) {
                    if (parsedBody.hasOwnProperty('error')) {
                        cb(parsedBody.error);
                    } else {
                        if (parsedBody.hasOwnProperty('selfLink')) {
                            cb(null, parsedBody.selfLink);
                        } else {
                            cb(new Error('Error has happene while uploading to ' + bucket + ' bucket!'));
                        }

                    }
                }
            }
        }
    });
};

GCS.prototype.deleteFile = function(file, bucket, callback) {
    var fName = path.basename(file);
    var url = this.deleteUrl.replace('{bucket}', bucket).replace('{object}', fName);
    this.getAccessToken(function (err, accessToken) {
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
    });
};


GCS.prototype.getAccessToken = function(callback) {
    if (this.accessToken) {
        callback(null, this.accessToken);
    } else {
        gauth.auth(callback);
    }
};

module.exports = new GCS();