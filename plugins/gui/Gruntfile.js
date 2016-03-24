'use strict';

module.exports = function (grunt) {
    grunt.initConfig({
        pkg:grunt.file.readJSON('package.json'),
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n',
        watch: {
            js: {
                files: '<%= jshint.all %>',
                tasks: ['concat']
            },
            sass: {
                files: ['sass/*.scss'],
                tasks: ['sass']
            }
        },
        concat: {
            options: {
                banner: '<%= banner %>',
                stripBanners: true
            },
            dist: {
                src: [
                    'javascript/**/*.module.js',
                    'javascript/**/*.service.js',
                    'javascript/**/*.js'
                    ],
                dest: '_site/assets/js/<%= pkg.name %>.js'
            }
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                "force": true
            },
            all: [
                'Gruntfile.js',
                'javascript/controllers/*',
                'javascript/services/*',
                'javascript/dashboard/*',
                'javascript/*.js'
            ]
        },
        uglify: {
            options: {
                banner: '<%= banner %>',
                sourceMap: '_site/assets/js/<%= pkg.name %>.js.map',
                sourceMappingURL: '_site/assets/js/<%= pkg.name %>.js.map',
                sourceMapPrefix: 2
            },
            dist: {
                src: '<%= concat.dist.dest %>',
                dest: '_site/assets/js/<%= pkg.name %>.min.js'
            }
        },
        sass: {
            dist: {
                options: {
                    sourcemap: true,
                    style: 'compressed'
                },
                files: {
                    '_site/assets/css/app.min.css': 'sass/style.scss'
                }
            }
        },
        rsync: {
            git: {
                options: {
                    src: ["./"],
                    args: ["--verbose"],
                    exclude: ['.git*',
                        '.idea',
                        '.sass-cache',
                        'bower_components',
                        'javascript',
                        'node_modules',
                        'sass',
                        '.jshintrc',
                        'bower.json',
                        '*.iml',
                        'Gruntfile.js',
                        'package.json',
                        '.DS_Store',
                        'README.md',
                        "plugin-descriptor.properties"
                    ],
                    recursive: true,
                    syncDestIgnoreExcl: true,
                    dest: "./_site/"
                }
            },
            libs: {
                options: {
                    src: [
                        "bower_components/angular/angular.min.js",
                        "bower_components/angular-route/angular-route.min.js",
                        "bower_components/c3/c3.min.js",
                        "bower_components/d3/d3.min.js",
                        "bower_components/c3-angular/c3-angular.min.js",
                        "bower_components/elasticsearch/elasticsearch.angular.min.js",
                        "bower_components/moment/min/moment.min.js",
                        "bower_components/ui-bootstrap/dist/ui-bootstrap-0.12.1.min.js"
                    ],
                    args: ["--verbose"],
                    recursive: true,
                    syncDestIgnoreExcl: true,
                    dest: "./_site/assets/libs/"
                }
            },
            deploy: {
                options: {
                    src: ["_site","plugin-descriptor.properties"],
                    args: ["--verbose"],
                    exclude: [
                    ],
                    recursive: true,
                    syncDestIgnoreExcl: true,
                    dest: "/Users/jettrocoenradie/javalibs/elasticsearch/plugins2/gui/"
                }
            }
        },
        devserver: {
            options: {
                port : 8888,
                base : "_site"
            },
            server: {}
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-rsync');
    grunt.loadNpmTasks('grunt-devserver');

    grunt.registerTask('combine',['concat:dist','uglify:dist']);
};