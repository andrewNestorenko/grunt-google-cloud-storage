/*
 * grunt-google-cloud-storage
 * https://github.com/UsabilityDynamics/grunt-google-cloud-storage
 *
 * Copyright (c) 2013 Andy Potanin
 * Licensed under the MIT license.
 */

var gauth = require('../lib/google-oauth-serviceaccount');
var request = require('request');
var fs = require('fs');
var async = require('async');
var path = require('path');
module.exports = function(grunt) {
    'use strict';
    var accessToken = null;
    grunt.registerMultiTask('google_cloud_storage', 'Google Cloud Storage tasks.', function() {
        var event = this.data.event,
            file = this.data.file;
            var upload = function (file, bucket) {
                if (!file) throw Error('You must specify file to upload');
                if (!bucket) throw Error('You must specify bucket');
                file = fs.realpathSync(__dirname + '/../' + file);
                var fName = path.basename(file);
                var url = 'https://www.googleapis.com/upload/storage/v1beta2/b/' + bucket + '/o';
                var queryParams = {
                    'uploadType': 'media',
                    'name': fName
                };
                var headers = {};
                async.waterfall([
                    function getStats (callback) {
                        console.info('getting stats');
                        console.info(file);
                        fs.stat(file, callback);
                    },

                    function createRequestStream (stats, callback) {
                        console.info('create steam');
                        var stream = fs.createReadStream(file);
                        callback(null, stream, stats);
                    },

                    function createRequest (stream, stats, callback) {
                        gauth.auth(function (err, accessToken) {
                            if (err) callback(err);
                            console.info('creating request');
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
                    if (err) throw err;
                    if (request.statusCode == 200) {
                        var data  = JSON.parse(body);
                        if (data.hasOwnProperty('selfLink')) {
                            console.log('File has been successfully uploaded to ' + bucket + ' bucket and now has link: ' + data.selfLink);
                        } else {
                            throw new Error('Error has happene while uploading to ' + bucket + ' bucket!');
                        }
                    }
                });
            }
            upload(file, 'nestorenok-cdn');
    });
};