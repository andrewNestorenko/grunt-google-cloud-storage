/*
 * grunt-google-cloud-storage
 * https://github.com/UsabilityDynamics/grunt-google-cloud-storage
 *
 * Copyright (c) 2013 Andy Potanin
 * Licensed under the MIT license.
 */
'use strict';
module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
//        jshint: {
//            all: [
//                'Gruntfile.js', 'tasks/*.js', '<%= nodeunit.tests %>'
//            ],
//            options: {
//                jshintrc: '.jshintrc'
//            }
//        },
//        // Before generating any new files, remove any previously-created files.
//        clean: {
//            tests: ['tmp']
//        },
        // Configuration to be run (and then tested).
        google_cloud_storage: {
            default_options: {
                options: {
                },
                files: {

                }
            }
        },

        watch : {
            all: {
                files: ['cdn/*'],
                tasks: ['google_cloud_storage'],
                options: {
                    spawn: false
                }
            }
        },
        // Unit tests.
        nodeunit: {
            tests: ['test/*_test.js']
        }

    });
    grunt.event.on('watch', function(action, filepath) {
        console.log('watch', action, filepath);
        grunt.config('google_cloud_storage.default_options.file', filepath);
        grunt.config('google_cloud_storage.default_options.event', action);
    });


    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');
    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-contrib-watch');
    // Whenever the "test" task is run, first clean the "tmp" dir, then run this
    // plugin's task(s), then test the result.
    grunt.registerTask('test', [/*'clean',*/ 'watch', 'nodeunit']);
    // By default, lint and run all tests.
    grunt.registerTask('default', ['watch']);
};
