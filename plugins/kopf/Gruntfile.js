module.exports = function(grunt) {

  grunt.initConfig({
    clean: {
      dist: {
        src: ['_site/dist']
      }
    },
    watch: {
      scripts: {
        files: ['src/kopf/**/*.*', 'src/kopf/*.*'],
        tasks: ['build'],
        options: {
          spawn: false
        }
      }
    },
    copy: {
      main: {
        files: [
          {
            expand: true,
            flatten: true,
            src: ['src/lib/ace/mode-json.js'],
            dest: './_site/dist/'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/lib/ace/worker-json.js'],
            dest: './_site/dist/'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/lib/angularjs/*.map'],
            dest: './_site/dist/'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/kopf/theme-kopf.js'],
            dest: './_site/dist/'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/kopf/css/dark_style.css'],
            dest: './_site/dist/'
          },
          {
            expand: true,
            flatten: true,
            src: ['src/kopf/css/light_style.css'],
            dest: './_site/dist/'
          }
        ]
      }
    },
    concat: {
      vendorjs: {
        src: [
          'src/lib/jquery/jquery-1.10.2.min.js',
          'src/lib/angularjs/angular.min.js',
          'src/lib/angularjs/angular-route.min.js',
          'src/lib/ace/ace.js',
          'src/lib/jsontree/jsontree.min.js',
          'src/lib/bootstrap/js/bootstrap.js',
          'src/lib/csv/csv.js',
          'src/lib/csv/jquery.csv.js',
          'src/lib/angular-tree-dnd/ng-tree-dnd.js',
          'src/lib/angularjs/angular-animate.min.js',
          'src/lib/typeahead/typeahead.js'
        ],
        dest: '_site/dist/lib.js'
      },
      vendorcss: {
        src: [
          'src/lib/bootstrap/css/bootstrap.css',
          'src/lib/angular-tree-dnd/ng-tree-dnd.css'
        ],
        dest: '_site/dist/lib.css'
      },
      appjs: {
        src: [
          'src/kopf/kopf.js',
          'src/kopf/*/*.js',
          'src/kopf/util.js',
        ],
        dest: '_site/dist/kopf.js'
      },
      appcss: {
        src: [
          'src/kopf/kopf.css',
          'src/kopf/css/percolator.css',
          'src/kopf/css/common.css',
          'src/kopf/css/aliases.css',
          'src/kopf/css/analysis.css',
          'src/kopf/css/explain.css',
          'src/kopf/css/cluster_health.css',
          'src/kopf/css/cluster_overview.css',
          'src/kopf/css/gist_share.css',
          'src/kopf/css/navbar.css',
          'src/kopf/css/rest_client.css',
          'src/kopf/css/warmers.css',
          'src/kopf/css/repository.css',
          'src/kopf/css/nodes.css',
          'src/kopf/css/hotthreads.css'
        ],
        dest: '_site/dist/kopf.css'
      }

    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: '.',
          keepalive: true
        }
      }
    },
    jshint: {
      kopf: {
        src: [
          'src/kopf/kopf.js',
          'src/kopf/*/*.js',
          'src/kopf/util.js',
        ]
      }
    },
    qunit: {
      all: ['tests/all.html']
    },
    karma: {
      unit: {configFile: 'tests/karma.config.js', keepalive: true}
    },
    jscs: {
      src: ['src/kopf/**/*.js'],
      options: {
        preset: 'google',
        excludeFiles: ['src/kopf/theme-kopf.js'],
        requireCamelCaseOrUpperCaseIdentifiers: "ignoreProperties"
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-qunit');
  grunt.loadNpmTasks('grunt-karma');
  grunt.loadNpmTasks("grunt-jscs");
  grunt.registerTask('dev', ['karma', 'watch'])
  grunt.registerTask('test', ['karma'])
  grunt.registerTask('build',
      ['clean', 'jshint', 'qunit', 'copy', 'concat', 'jscs']);
  grunt.registerTask('server',
      ['clean', 'jshint', 'qunit', 'copy', 'concat', 'connect:server']);
};
