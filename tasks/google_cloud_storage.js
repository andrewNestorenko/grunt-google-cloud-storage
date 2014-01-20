/*
 * grunt-google-cloud-storage
 * https://github.com/UsabilityDynamics/grunt-google-cloud-storage
 *
 * Copyright (c) 2013 Andy Potanin
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {
    'use strict';
    // Please see the Grunt documentation for more information regarding task
    // creation: http://gruntjs.com/creating-tasks
    grunt.registerMultiTask('google_cloud_storage', 'Google Cloud Storage tasks.', function() {
        console.log("File: " + this.data.files + ' is ' + this.data.event);

    });
};
