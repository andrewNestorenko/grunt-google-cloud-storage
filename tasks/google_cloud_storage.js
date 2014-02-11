module.exports = function(grunt) {
    'use strict';
    grunt.registerMultiTask('google_cloud_storage', 'Google Cloud Storage tasks.', function() {
        var done = this.async();
        var GCS = require('../lib/google-cloud-storage')(this.data.options.google);
        var event = this.data.event,
            file = this.data.file;
        if (['changed', 'added'].indexOf(event) != -1) {
            GCS.uploadFile(file, 'nestorenok-cdn', function(err, link) {
                console.log(arguments);
                done();
            });
        }
        if (event === 'deleted') {
            GCS.deleteFile(file, 'nestorenok-cdn', function(err, link) {
                console.log(arguments);
                done();
            });
        }
    });
};
