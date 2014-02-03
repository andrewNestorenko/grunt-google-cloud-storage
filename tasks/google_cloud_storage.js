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
module.exports = function(grunt) {
    'use strict';
    var accessToken = null;
    grunt.registerMultiTask('google_cloud_storage', 'Google Cloud Storage tasks.', function() {
        var event = this.data.event,
            file = this.data.file;

        if (!accessToken) {
            gauth.auth(function(err, accessToken) {
                if(err) console.log(err);
                var headers = {};
                var bucket = 'nestorenok-cdn';
                var filepath = 'readme.md';
                var stream = fs.createReadStream(filepath);
//                stream.pause();
                var stats = fs.statSync(filepath);
                console.log(stats);
                headers.Authorization = 'Bearer ' + accessToken;
                //                headers.Date = new Date().toString();
//                headers.Host = 'storage.googleapis.com';
//                headers['x-goog-api-version'] = 2;
                headers['Content-Type'] = 'text/plain';
                headers['Content-Length'] = stats.size;
                console.log(stream);
                var url = 'https://storage.googleapis.com/upload/storage/v1beta2/b/' + bucket + '/o?uploadType=media&name=object';
//                stream.resume();
                stream.pipe(request.post(url, {headers: headers}, function(err, request, body) {
                    console.log(accessToken);
                    console.log(request.statusCode);
                    console.log(body);
                }));
            })
        }
    });
};