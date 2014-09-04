module.exports = function(grunt) {

	grunt.initConfig({
		clean: {
			dist: {
				src: ['dist']
			}
		},
		watch: {
			scripts: {
					files: ['src/kopf/**/*.*','src/kopf/*.*'],
					tasks: ['build'],
					options: {
					spawn: false
				}
			}
		},
		copy: {
			main: {
				files: [
					{expand: true, flatten: true, src: ['src/lib/ace/mode-json.js'], dest: './'},
					{expand: true, flatten: true, src: ['src/lib/ace/worker-json.js'], dest: './'},
					{expand: true, flatten: true, src: ['src/kopf/theme-kopf.js'], dest: './'},
					{expand: true, flatten: true, src: ['src/kopf/css/dark_style.css'], dest: './dist/'},
					{expand: true, flatten: true, src: ['src/kopf/css/light_style.css'], dest: './dist/'}
				]
			}
		},
		concat: {
			vendorjs: {
				src: [
					'src/lib/jquery/jquery-1.10.2.min.js',
					'src/lib/angularjs/angular.min.js',
					'src/lib/ace/ace.js',
					'src/lib/jsontree/jsontree.min.js',
					'src/lib/bootstrap/js/bootstrap.js'
				],
				dest: 'dist/lib.js'
			},
			vendorcss: {
				src: [
					'src/lib/bootstrap/css/bootstrap.css'
				],
				dest: 'dist/lib.css'
			},
			appjs: {
				src: [
					'src/kopf/elastic/alias.js',
					'src/kopf/elastic/cluster_changes.js',
					'src/kopf/elastic/cluster_health.js',
					'src/kopf/elastic/cluster_settings.js',
					'src/kopf/elastic/cluster.js',
					'src/kopf/elastic/elastic_client.js',
					'src/kopf/elastic/es_connection.js',
					'src/kopf/elastic/index.js',
					'src/kopf/elastic/editable_index_settings.js',
					'src/kopf/elastic/node.js',
					'src/kopf/elastic/shard.js',
					'src/kopf/elastic/token.js',
					'src/kopf/elastic/repository.js',
					'src/kopf/elastic/snapshot.js',
                    'src/kopf/elastic/warmer.js',
                    'src/kopf/elastic/percolator.js',
                    'src/kopf/elastic/index_metadata.js',
					// CONTROLLERS
					'src/kopf/kopf.js',
					'src/kopf/controllers/aliases.js',
					'src/kopf/controllers/analysis.js',
					'src/kopf/controllers/cluster_health.js',
					'src/kopf/controllers/cluster_overview.js',
					'src/kopf/controllers/cluster_settings.js',
					'src/kopf/controllers/create_index.js',
					'src/kopf/controllers/global.js',
					'src/kopf/controllers/index_settings.js',
					'src/kopf/controllers/navbar.js',
					'src/kopf/controllers/rest.js',
					'src/kopf/controllers/percolator.js',
					'src/kopf/controllers/repository.js',
					'src/kopf/controllers/confirm_dialog.js',
					'src/kopf/controllers/warmup.js',
					'src/kopf/controllers/benchmark.js',
					// SERVICES
					'src/kopf/services/alerts.js',
					'src/kopf/services/settings.js',
					'src/kopf/services/aceeditor.js',
					'src/kopf/services/theme.js',
                    'src/kopf/services/elastic.js',
					// MODELS
					'src/kopf/models/ace_editor.js',
					'src/kopf/models/gist.js',
					'src/kopf/models/benchmark.js',
                    'src/kopf/models/request.js',
                    'src/kopf/models/cluster_navigation.js',
                    'src/kopf/models/modal_controls.js',
                    'src/kopf/models/paginator.js',
                    'src/kopf/models/alias_filter.js',
                    'src/kopf/models/snapshot_filter.js',
                    'src/kopf/models/warmer_filter.js',
                    'src/kopf/models/index_filter.js',
                    'src/kopf/models/node_filter.js',
					// UTIL
					'src/kopf/util.js'
				],
				dest: 'dist/kopf.js'
			},
			appcss: {
				src: [
					'src/kopf/kopf.css',
					'src/kopf/css/percolator.css',
					'src/kopf/css/common.css',
					'src/kopf/css/aliases.css',
					'src/kopf/css/analysis.css',
					'src/kopf/css/cluster_health.css',
					'src/kopf/css/cluster_overview.css',
					'src/kopf/css/gist_share.css',
					'src/kopf/css/json_tree.css',
					'src/kopf/css/navbar.css',
					'src/kopf/css/rest_client.css',
					'src/kopf/css/warmup.css',
					'src/kopf/css/repository.css'
				],
				dest: 'dist/kopf.css'
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
					'src/kopf/elastic/alias.js',
					'src/kopf/elastic/cluster_changes.js',
					'src/kopf/elastic/cluster_health.js',
					'src/kopf/elastic/cluster_settings.js',
					'src/kopf/elastic/cluster.js',
					'src/kopf/elastic/elastic_client.js',
					'src/kopf/elastic/es_connection.js',
					'src/kopf/elastic/index.js',
					'src/kopf/elastic/editable_index_settings.js',
					'src/kopf/elastic/node.js',
					'src/kopf/elastic/shard.js',
					'src/kopf/elastic/token.js',
					'src/kopf/elastic/repository.js',
					'src/kopf/elastic/snapshot.js',
                    'src/kopf/elastic/warmer.js',
                    'src/kopf/elastic/percolator.js',
                    'src/kopf/elastic/index_metadata.js',
					// CONTROLLERS
					'src/kopf/kopf.js',
					'src/kopf/controllers/aliases.js',
					'src/kopf/controllers/analysis.js',
					'src/kopf/controllers/cluster_health.js',
					'src/kopf/controllers/cluster_overview.js',
					'src/kopf/controllers/cluster_settings.js',
					'src/kopf/controllers/create_index.js',
					'src/kopf/controllers/global.js',
					'src/kopf/controllers/index_settings.js',
					'src/kopf/controllers/navbar.js',
					'src/kopf/controllers/rest.js',
					'src/kopf/controllers/percolator.js',
					'src/kopf/controllers/repository.js',
					'src/kopf/controllers/confirm_dialog.js',
					'src/kopf/controllers/warmup.js',
					'src/kopf/controllers/benchmark.js',
					// SERVICES
					'src/kopf/services/alerts.js',
					'src/kopf/services/settings.js',
					'src/kopf/services/aceeditor.js',
					'src/kopf/services/theme.js',
                    'src/kopf/services/elastic.js',
					// MODELS
					'src/kopf/models/ace_editor.js',
					'src/kopf/models/gist.js',
					'src/kopf/models/benchmark.js',
                    'src/kopf/models/request.js',
                    'src/kopf/models/cluster_navigation.js',
                    'src/kopf/models/modal_controls.js',
                    'src/kopf/models/paginator.js',
                    'src/kopf/models/alias_filter.js',
                    'src/kopf/models/snapshot_filter.js',
                    'src/kopf/models/warmer_filter.js',
                    'src/kopf/models/index_filter.js',
                    'src/kopf/models/node_filter.js',
					// UTIL
					'src/kopf/util.js'
				]
			}
		},
		qunit: {
			all: ['tests/all.html']
		},
		karma: {
			unit: { configFile: 'tests/karma.config.js', keepalive: true }
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
	grunt.registerTask('dev', ['karma', 'watch'])
	grunt.registerTask('test', ['karma'])
	grunt.registerTask('build', ['clean', 'jshint', 'qunit', 'copy', 'concat']);
	grunt.registerTask('server', ['clean', 'jshint', 'qunit', 'copy', 'concat','connect:server']);
};
