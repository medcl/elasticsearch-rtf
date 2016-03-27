var kopf = angular.module('kopf', ['ngRoute', 'ntt.TreeDnD', 'ngAnimate',
  'ui.bootstrap']);

// manages behavior of confirmation dialog
kopf.factory('ConfirmDialogService', function() {
  this.header = 'Default Header';
  this.body = 'Default Body';
  this.cancel_text = 'cancel';
  this.confirm_text = 'confirm';

  this.confirm = function() {
    // when created, does nothing
  };

  this.close = function() {
    // when created, does nothing
  };

  this.open = function(header, body, action, confirmCallback, closeCallback) {
    this.header = header;
    this.body = body;
    this.action = action;
    this.confirm = confirmCallback;
    this.close = closeCallback;
  };

  return this;
});

kopf.config(function($routeProvider, $locationProvider) {
  $locationProvider.hashPrefix('!');
  $routeProvider.
      when('/cluster', {
        templateUrl: 'partials/cluster_overview.html',
        controller: 'ClusterOverviewController'
      }).
      when('/nodes', {
        templateUrl: 'partials/nodes/nodes.html',
        controller: 'NodesController'
      }).
      when('/rest', {
        templateUrl: 'partials/rest_client.html',
        controller: 'RestController'
      }).
      when('/aliases', {
        templateUrl: 'partials/aliases.html',
        controller: 'AliasesController'
      }).
      when('/analysis', {
        templateUrl: 'partials/analysis.html',
        controller: 'AnalysisController'
      }).
      when('/percolator', {
        templateUrl: 'partials/percolator.html',
        controller: 'PercolatorController'
      }).
      when('/warmers', {
        templateUrl: 'partials/warmers.html',
        controller: 'WarmersController'
      }).
      when('/snapshot', {
        templateUrl: 'partials/snapshot.html',
        controller: 'SnapshotController'
      }).
      when('/createIndex', {
        templateUrl: 'partials/create_index.html',
        controller: 'CreateIndexController'
      }).
      when('/clusterHealth', {
        templateUrl: 'partials/cluster_health.html',
        controller: 'ClusterHealthController'
      }).
      when('/clusterSettings', {
        templateUrl: 'partials/cluster_settings.html',
        controller: 'ClusterSettingsController'
      }).
      when('/indexSettings', {
        templateUrl: 'partials/index_settings.html',
        controller: 'IndexSettingsController'
      }).
      when('/indexTemplates', {
        templateUrl: 'partials/index_templates.html',
        controller: 'IndexTemplatesController'
      }).
      when('/cat', {
        templateUrl: 'partials/cat.html',
        controller: 'CatController'
      }).
      when('/hotthreads', {
        templateUrl: 'partials/hotthreads.html',
        controller: 'HotThreadsController'
      }).
      otherwise({redirectTo: '/cluster'});
});

kopf.controller('AlertsController', ['$scope', 'AlertService',
  function($scope, AlertService) {

    $scope.alerts = [];

    $scope.$watch(
        function() {
          return AlertService.alerts;
        },
        function(newValue, oldValue) {
          $scope.alerts = AlertService.alerts;
        }
    );

    $scope.remove = function(id) {
      AlertService.remove(id);
    };

  }

]);

kopf.controller('AliasesController', ['$scope', 'AlertService',
  'AceEditorService', 'ElasticService',
  function($scope, AlertService, AceEditorService, ElasticService) {

    $scope.paginator = new Paginator(1, 10, [], new AliasFilter('', ''));
    $scope.page = $scope.paginator.getPage();
    $scope.original = [];
    $scope.editor = undefined;
    $scope.new_alias = new Alias('', '', '', '', '');

    $scope.aliases = [];

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getIndices();
        },
        true
    );

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.viewDetails = function(alias) {
      $scope.details = alias;
    };

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('alias-filter-editor');
      }
    };

    $scope.addAlias = function() {
      $scope.new_alias.filter = $scope.editor.format();
      if (!isDefined($scope.editor.error)) {
        try {
          $scope.new_alias.validate();
          var indexName = $scope.new_alias.index;
          var aliasName = $scope.new_alias.alias;
          // if alias already exists, check if its already associated with index
          var collection = $scope.paginator.getCollection();
          var indices = collection.filter(function(a) {
            return a.index == indexName;
          });
          if (indices.length === 0) {
            collection.push(new IndexAliases(indexName, [$scope.new_alias]));
          } else {
            var indexAliases = indices[0];
            var aliases = indexAliases.aliases.filter(function(a) {
              return aliasName == a.alias;
            });
            if (aliases.length > 0) {
              throw 'Alias is already associated with this index';
            } else {
              indexAliases.aliases.push($scope.new_alias);
            }
          }
          $scope.new_alias = new Alias();
          $scope.paginator.setCollection(collection);
          $scope.page = $scope.paginator.getPage();
          AlertService.success('Alias successfully added. Note that changes ' +
              'made will only be persisted after saving changes');
        } catch (error) {
          AlertService.error(error, null);
        }
      } else {
        AlertService.error('Invalid filter defined for alias',
            $scope.editor.error);
      }
    };

    $scope.removeIndexAliases = function(index) {
      var collection = $scope.paginator.getCollection();
      for (var position = 0; position < collection.length; position++) {
        if (index == collection[position].index) {
          collection.splice(position, 1);
          break;
        }
      }
      $scope.paginator.setCollection(collection);
      $scope.page = $scope.paginator.getPage();
      AlertService.success('All aliases were removed for ' + index);
    };

    $scope.removeIndexAlias = function(index, alias) {
      var indexPosition = 0;
      var collection = $scope.paginator.getCollection();
      for (; indexPosition < collection.length; indexPosition++) {
        if (index == collection[indexPosition].index) {
          break;
        }
      }
      var indexAliases = collection[indexPosition];
      var size = indexAliases.aliases.length;
      for (var aliasPosition = 0; aliasPosition < size; aliasPosition++) {
        if (alias == indexAliases.aliases[aliasPosition].alias) {
          indexAliases.aliases.splice(aliasPosition, 1);
          if (indexAliases.aliases.length === 0) {
            collection.splice(indexPosition, 1);
          }
          break;
        }
      }
      $scope.paginator.setCollection(collection);
      $scope.page = $scope.paginator.getPage();
      AlertService.success('Alias successfully dissociated from index. ' +
          'Note that changes made will only be persisted after saving changes');
    };

    $scope.mergeAliases = function() {
      var collection = $scope.paginator.getCollection();
      var deletes = IndexAliases.diff(collection, $scope.original);
      var adds = IndexAliases.diff($scope.original, collection);
      if (adds.length === 0 && deletes.length === 0) {
        AlertService.warn('No changes were made: nothing to save');
      } else {
        ElasticService.updateAliases(adds, deletes,
            function(response) {
              AlertService.success('Aliases were successfully updated',
                  response);
              $scope.loadAliases();
            },
            function(error) {
              AlertService.error('Error while updating aliases', error);
            }
        );
      }
    };

    $scope.loadAliases = function() {
      ElasticService.fetchAliases(
          function(indexAliases) {
            $scope.original = indexAliases.map(function(ia) {
              return ia.clone();
            });
            $scope.paginator.setCollection(indexAliases);
            $scope.page = $scope.paginator.getPage();
          },
          function(error) {
            AlertService.error('Error while fetching aliases', error);
          }
      );
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
      $scope.loadAliases();
      $scope.initEditor();
    };

  }
]);

kopf.controller('AnalysisController', ['$scope', '$location', '$timeout',
  'AlertService', 'ElasticService',
  function($scope, $location, $timeout, AlertService, ElasticService) {

    $scope.indices = null;

    // by index
    $scope.field_index = null;
    $scope.field_index_metadata = null;
    $scope.field_type = '';
    $scope.field_field = '';
    $scope.field_text = '';
    $scope.field_tokens = [];

    // By analyzer
    $scope.analyzer_index = '';
    $scope.analyzer_index_metadata = null;
    $scope.analyzer_analyzer = '';
    $scope.analyzer_text = '';
    $scope.analyzer_tokens = [];

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getOpenIndices();
        },
        true
    );

    $scope.$watch('field_index', function(current, previous) {
      if (isDefined(current)) {
        $scope.loadIndexTypes(current.name);
      }
    });

    $scope.loadIndexTypes = function(index) {
      $scope.field_type = '';
      $scope.field_field = '';
      if (notEmpty(index)) {
        ElasticService.getIndexMetadata(index,
            function(metadata) {
              $scope.field_index_metadata = metadata;
            },
            function(error) {
              $scope.field_index = '';
              AlertService.error('Error loading index types', error);
            }
        );
      }
    };

    $scope.$watch('analyzer_index', function(current, previous) {
      if (isDefined(current)) {
        $scope.loadIndexAnalyzers(current.name);
      }
    });

    $scope.loadIndexAnalyzers = function(index) {
      $scope.analyzer_analyzer = '';
      if (notEmpty(index)) {
        ElasticService.getIndexMetadata(index,
            function(metadata) {
              $scope.analyzer_index_metadata = metadata;
            },
            function(error) {
              $scope.analyzer_index = '';
              AlertService.error('Error loading index analyzers', error);
            }
        );
      }
    };

    $scope.analyzeByField = function() {
      if ($scope.field_field.length > 0 && $scope.field_text.length > 0) {
        $scope.field_tokens = null;
        ElasticService.analyzeByField($scope.field_index.name,
            $scope.field_field, $scope.field_text,
            function(response) {
              $scope.field_tokens = response;
            },
            function(error) {
              $scope.field_tokens = null;
              AlertService.error('Error analyzing text by field', error);
            }
        );
      }
    };

    $scope.analyzeByAnalyzer = function() {
      if (notEmpty($scope.analyzer_analyzer) &&
          notEmpty($scope.analyzer_text)) {
        $scope.analyzer_tokens = null;
        ElasticService.analyzeByAnalyzer($scope.analyzer_index.name,
            $scope.analyzer_analyzer, $scope.analyzer_text,
            function(response) {
              $scope.analyzer_tokens = response;
            },
            function(error) {
              $scope.analyzer_tokens = null;
              AlertService.error('Error analyzing text by analyzer', error);
            }
        );
      }
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getOpenIndices();
    };

  }
]);

kopf.controller('BenchmarkController', ['$scope', '$location', '$timeout',
  'AlertService', 'ElasticService',
  function($scope, $location, $timeout, AlertService, ElasticService) {

    $scope.bench = new Benchmark();
    $scope.competitor = new Competitor();
    $scope.indices = [];
    $scope.types = [];

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
    };

    $scope.addCompetitor = function() {
      if (notEmpty($scope.competitor.name)) {
        this.bench.addCompetitor($scope.competitor);
        $scope.competitor = new Competitor();
      } else {
        AlertService.error('Competitor needs a name');
      }
    };

    $scope.removeCompetitor = function(index) {
      $scope.bench.competitors.splice(index, 1);
    };

    $scope.editCompetitor = function(index) {
      var edit = $scope.bench.competitors.splice(index, 1);
      $scope.competitor = edit[0];
    };

    $scope.runBenchmark = function() {
      $('#benchmark-result').html('');
      try {
        var json = $scope.bench.toJson();
        ElasticService.executeBenchmark(json,
            function(response) {
              $scope.result = JSONTree.create(response);
              $('#benchmark-result').html($scope.result);
            },
            function(error, status) {
              if (status == 503) {
                AlertService.info('No available nodes for benchmarking. ' +
                    'At least one node must be started with ' +
                    '\'--node.bench true\' option.');
              } else {
                AlertService.error(error.error);
              }
            }
        );
      } catch (error) {
        AlertService.error(error);
      }
    };

  }
]);

kopf.controller('CatController', ['$scope', 'ElasticService', 'AlertService',
  function($scope, ElasticService, AlertService) {

    $scope.apis = [
      'aliases',
      //'allocation',
      'count',
      //'fielddata',
      //'health',
      //'indices',
      'master',
      //'nodes',
      //'pending_tasks',
      'plugins',
      'recovery',
      //'thread_pool',
      //'shards',
      //'segments'
    ];

    $scope.api = '';

    $scope.result = undefined;

    $scope.execute = function() {
      if ($scope.api.length > 0) {
        ElasticService.executeCatRequest(
            $scope.api,
            function(result) {
              $scope.result = result;
            },
            function(error) {
              AlertService.error('Error while fetching data', error);
              $scope.result = undefined;
            }
        );
      } else {
        AlertService.error('You must select an API');
      }
    };
  }

]);

kopf.controller('ClusterHealthController', ['$scope', '$location', '$timeout',
  '$sce', '$http', 'AlertService', 'ConfirmDialogService', 'ElasticService',
  function($scope, $location, $timeout, $sce, $http, AlertService,
           ConfirmDialogService, ElasticService) {

    var defaultDescription = 'Cluster information delivered by kopf';
    $scope.shared_url = '';
    $scope.results = null;

    $scope.initializeController = function() {
      $('#cluster_health_option a').tab('show');
      $scope.results = null;
      // selects which info should be retrieved
      $scope.retrieveHealth = true;
      $scope.retrieveState = true;
      $scope.retrieveStats = true;
      $scope.retrieveHotThreads = true;
      $scope.gist_title = '';
    };

    $scope.checkPublishClusterHealth = function() {
      ConfirmDialogService.open(
          'Are you share you want to share your cluster information?',
              'By sharing information through a public Gist you might be ' +
              'exposing sensitive information about your cluster, such as ' +
              'host name, indices names and etc.',
          'Agree',
          function() {
            $scope.confirm_share = true;
            $scope.publishClusterHealth();
          }
      );
    };

    $scope.loadClusterHealth = function() {
      var results = {};
      $scope.results = null;
      var infoId = AlertService.info('Loading cluster health state. ' +
          'This could take a few moments.', {}, 30000);
      ElasticService.getClusterDiagnosis($scope.retrieveHealth,
          $scope.retrieveState, $scope.retrieveStats, $scope.retrieveHotThreads,
          function(responses) {
            $scope.state = '';
            if (!(responses instanceof Array)) {
              // so logic bellow remains the same in case result is not an array
              responses = [responses];
            }
            var idx = 0;
            if ($scope.retrieveHealth) {
              results.health_raw = responses[idx++];
              var htmlHealth = JSONTree.create(results.health_raw);
              results.health = $sce.trustAsHtml(htmlHealth);
            }
            if ($scope.retrieveState) {
              results.state_raw = responses[idx++];
              var htmlState = JSONTree.create(results.state_raw);
              results.state = $sce.trustAsHtml(htmlState);
            }
            if ($scope.retrieveStats) {
              results.stats_raw = responses[idx++];
              var htmlStats = JSONTree.create(results.stats_raw);
              results.stats = $sce.trustAsHtml(htmlStats);
            }
            if ($scope.retrieveHotThreads) {
              results.hot_threads = responses[idx];
            }
            $scope.results = results;
            $scope.state = '';
            AlertService.remove(infoId);
          },
          function(failedRequest) {
            AlertService.remove(infoId);
            AlertService.error('Error while retrieving cluster health ' +
                'information', failedRequest.data);
          }
      );
    };

    $scope.publishClusterHealth = function() {
      var gist = {description: defaultDescription, public: true};
      if (notEmpty($scope.gist_title)) {
        gist.description = $scope.gist_title;
      }
      var files = {};
      if (isDefined($scope.results)) {
        if (isDefined($scope.results.health_raw)) {
          var health = JSON.stringify($scope.results.health_raw, undefined, 4);
          files.health = {'content': health, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.state_raw)) {
          var state = JSON.stringify($scope.results.state_raw, undefined, 4);
          files.state = {'content': state, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.stats_raw)) {
          var stats = JSON.stringify($scope.results.stats_raw, undefined, 4);
          files.stats = {'content': stats, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.hot_threads)) {
          var ht = $scope.results.hot_threads;
          files.hot_threads = {'content': ht,
            'indent': '2', 'language': 'JSON'
          };
        }
      }
      gist.files = files;
      var data = JSON.stringify(gist, undefined, 4);

      $http({method: 'POST', url: 'https://api.github.com/gists', data: data}).
          success(function(data, status, headers, config) {
            $scope.addToHistory(new Gist(gist.description, data.html_url));
            AlertService.success('Cluster health information successfully ' +
                    'shared at: ' + data.html_url,
                null, 60000);
          }).
          error(function(data, status, headers, config) {
            AlertService.error('Error while publishing Gist', data);
          });
    };

    $scope.addToHistory = function(gist) {
      $scope.gist_history.unshift(gist);
      if ($scope.gist_history.length > 30) {
        $scope.gist_history.length = 30;
      }
      localStorage.kopf_gist_history = JSON.stringify($scope.gist_history);
    };

    $scope.loadHistory = function() {
      var history = [];
      if (isDefined(localStorage.kopf_gist_history)) {
        try {
          history = JSON.parse(localStorage.kopf_gist_history).map(function(h) {
            return new Gist().loadFromJSON(h);
          });
        } catch (error) {
          localStorage.kopf_gist_history = null;
        }
      }
      return history;
    };

    $scope.gist_history = $scope.loadHistory();

  }
]);

kopf.controller('ClusterOverviewController', ['$scope', '$window',
  'ConfirmDialogService', 'AlertService', 'ElasticService', 'AppState',
  function($scope, $window, ConfirmDialogService, AlertService, ElasticService,
           AppState) {

    $scope.cluster = undefined;

    $scope.nodes = [];

    $scope.relocatingShard = undefined;

    $scope.expandedView = false;

    $($window).resize(function() {
      $scope.$apply(function() {
        $scope.index_paginator.setPageSize($scope.getPageSize());
      });
    });

    $scope.getPageSize = function() {
      return Math.max(Math.round($window.innerWidth / 280), 1);
    };

    $scope.index_filter = AppState.getProperty(
        'ClusterOverview',
        'index_filter',
        new IndexFilter('', true, false, true, true, 0)
    );

    $scope.index_paginator = AppState.getProperty(
        'ClusterOverview',
        'index_paginator',
        new Paginator(1, $scope.getPageSize(), [], $scope.index_filter)
    );

    $scope.page = $scope.index_paginator.getPage();

    $scope.node_filter = AppState.getProperty(
        'ClusterOverview',
        'node_filter',
        new NodeFilter('', true, false, false, 0)
    );

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(newValue, oldValue) {
          $scope.cluster = ElasticService.cluster;
          $scope.setIndices(ElasticService.getIndices());
          $scope.setNodes(ElasticService.getNodes());
          if ($scope.cluster &&
              $scope.cluster.unassigned_shards === 0 &&
              $scope.cluster.relocating_shards === 0 &&
              $scope.cluster.initializing_shards === 0) {
            // since control is only exposed when shards are moving
            $scope.index_filter.healthy = true;
          }
        }
    );

    $scope.$watch('node_filter',
        function(filter, previous) {
          $scope.setNodes(ElasticService.getNodes());
        },
        true);

    $scope.$watch('index_paginator', function(filter, previous) {
      $scope.setIndices(ElasticService.getIndices());
    }, true);

    $scope.selectShardRelocation = function(shard) {
      $scope.relocatingShard = shard;
    };

    $scope.setNodes = function(nodes) {
      $scope.nodes = nodes.filter(function(node) {
        return $scope.node_filter.matches(node);
      });
    };

    $scope.setIndices = function(indices) {
      $scope.index_paginator.setCollection(indices);
      $scope.page = $scope.index_paginator.getPage();
    };

    $scope.optimizeIndex = function(index) {
      ElasticService.optimizeIndex(index,
          function(response) {
            AlertService.success('Index was successfully optimized', response);
          },
          function(error) {
            AlertService.error('Error while optimizing index', error);
          }
      );
    };

    $scope.promptOptimizeIndex = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to optimize index ' + index + '?',
          'Optimizing an index is a resource intensive operation and ' +
          'should be done with caution. Usually, you will only want to ' +
          'optimize an index when it will no longer receive updates',
          'Optimize',
          function() {
            $scope.optimizeIndex(index);
          }
      );
    };

    $scope.deleteIndex = function(index) {
      ElasticService.deleteIndex(index,
          function(response) {
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while deleting index', error);
          }
      );
    };

    $scope.promptDeleteIndex = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to delete index ' + index + '?',
          'Deleting an index cannot be undone and all data for this ' +
          'index will be lost',
          'Delete',
          function() {
            $scope.deleteIndex(index);
          }
      );
    };

    $scope.clearCache = function(index) {
      ElasticService.clearCache(index,
          function(response) {
            AlertService.success('Index cache was cleared', response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while clearing index cache', error);
          }
      );
    };

    $scope.promptClearCache = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to clear the cache for ' + index + '?',
          'This will clear all caches for this index.',
          'Clear',
          function() {
            $scope.clearCache(index);
          }
      );
    };

    $scope.refreshIndex = function(index) {
      ElasticService.refreshIndex(index,
          function(response) {
            AlertService.success('Index was successfully refreshed', response);
          },
          function(error) {
            AlertService.error('Error while refreshing index', error);
          }
      );
    };

    $scope.promptRefreshIndex = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to refresh index ' + index + '?',
          'Refreshing an index makes all operations performed since the ' +
          'last refresh available for search.',
          'Refresh',
          function() {
            $scope.refreshIndex(index);
          }
      );
    };

    $scope.enableAllocation = function() {
      ElasticService.enableShardAllocation(
          function(response) {
            AlertService.success('Shard allocation was enabled', response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while enabling shard allocation', error);
          }
      );
    };

    $scope.disableAllocation = function() {
      ElasticService.disableShardAllocation(
          function(response) {
            AlertService.success('Shard allocation was disabled', response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while disabling shard allocation', error);
          }
      );
    };

    $scope.promptCloseIndex = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to close index ' + index + '?',
          'Closing an index will remove all it\'s allocated shards from ' +
          'the cluster.  Both searches and updates will no longer be ' +
          'accepted for the index. A closed index can be reopened.',
          'Close index',
          function() {
            ElasticService.closeIndex(index);
          }
      );
    };

    $scope.promptOpenIndex = function(index) {
      ConfirmDialogService.open(
          'are you sure you want to open index ' + index + '?',
          'Opening an index will trigger the recovery process. ' +
          'This process could take sometime depending on the index size.',
          'Open index',
          function() {
            ElasticService.openIndex(index);
          }
      );
    };

    $scope.promptCloseIndices = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to close all selected indices?',
          'Closing an index will remove all it\'s allocated shards from ' +
          'the cluster.  Both searches and updates will no longer be ' +
          'accepted for the index. A closed index can be reopened.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Close index',
          function() {
            ElasticService.closeIndex(indices.join(','));
          }
      );
    };

    $scope.promptOpenIndices = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to open all selected indices?',
          'Opening an index will trigger the recovery process. ' +
          'This process could take sometime depending on the index size.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Open index',
          function() {
            ElasticService.openIndex(indices.join(','));
          }
      );
    };

    $scope.promptRefreshIndices = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to refresh all selected indices?',
          'Refreshing an index makes all operations performed since the ' +
          'last refresh available for search.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Refresh',
          function() {
            $scope.refreshIndex(indices.join(','));
          }
      );
    };

    $scope.promptClearCaches = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to clear the cache for all selected indices?',
          'This will clear all caches for this index.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Clear',
          function() {
            $scope.clearCache(indices.join(','));
          }
      );
    };

    $scope.promptDeleteIndices = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to delete all selected indices?',
          'Deleting an index cannot be undone and all data for this ' +
          'index will be lost.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Delete',
          function() {
            $scope.deleteIndex(indices.join(','));
          }
      );
    };

    $scope.promptOptimizeIndices = function() {
      var indices = $scope.index_paginator.getResults().map(function(index) {
        return index.name;
      });
      ConfirmDialogService.open(
          'are you sure you want to optimize all selected indices?',
          'Optimizing an index is a resource intensive operation and ' +
          'should be done with caution. Usually, you will only want to ' +
          'optimize an index when it will no longer receive updates.\n\n' +
          'Selected indices:\n' + indices.join('\n'),
          'Optimize',
          function() {
            $scope.optimizeIndex(indices.join(','));
          }
      );
    };

    $scope.showIndexSettings = function(index) {
      ElasticService.getIndexMetadata(index,
          function(metadata) {
            $scope.displayInfo('settings for ' + index, metadata.settings);
          },
          function(error) {
            AlertService.error('Error while loading index settings', error);
          }
      );
    };

    $scope.showIndexMappings = function(index) {
      ElasticService.getIndexMetadata(index,
          function(metadata) {
            $scope.displayInfo('mappings for ' + index, metadata.mappings);
          },
          function(error) {
            AlertService.error('Error while loading index mappings', error);
          }
      );
    };

    $scope.showNodeStats = function(nodeId) {
      ElasticService.getNodeStats(nodeId,
          function(nodeStats) {
            $scope.displayInfo('stats for ' + nodeStats.name, nodeStats.stats);
          },
          function(error) {
            AlertService.error('Error while loading node stats', error);
          }
      );
    };

    $scope.showShardStats = function(shard, index, nodeId) {
      ElasticService.getShardStats(shard, index, nodeId,
          function(stats) {
            $scope.displayInfo('stats for shard ' + shard, stats.stats);
          },
          function(error) {
            AlertService.error('Error while loading shard stats', error);
          }
      );
    };

    $scope.relocateShard = function(shard, index, fromNode, toNode) {
      ElasticService.relocateShard(shard, index, fromNode, toNode,
          function(response) {
            ElasticService.refresh();
            $scope.relocatingShard = undefined;
            AlertService.success('Relocation successfully executed', response);
          },
          function(error) {
            $scope.relocatingShard = undefined;
            AlertService.error('Error while moving shard', error);
          }
      );
    };

    /**
     * Prompts confirmation dialog for relocating currently selected shard
     * to the given node
     * @param {string} toNode - target node id
     */
    $scope.promptRelocateShard = function(toNode) {
      var shard = $scope.relocatingShard.shard;
      var index = $scope.relocatingShard.index;
      var fromNode = $scope.relocatingShard.node;
      ConfirmDialogService.open(
          'are you sure you want relocate the shard?',
          'Once the relocation finishes, the cluster will try to ' +
          'rebalance itself to an even state',
          'Relocate',
          function() {
            $scope.relocateShard(shard, index, fromNode, toNode);
          }
      );
    };

    /**
     * Evaluates if relocation target box should be displayed for the cell
     * corresponding to the given index and node
     *
     * @param {Index} index - index
     * @param {Node} node - target node
     * @returns {boolean}
     */
    $scope.canReceiveShard = function(index, node) {
      var shard = $scope.relocatingShard;
      if (shard && index) { // in case num indices < num columns
        if (shard.node !== node.id && shard.index === index.name) {
          var shards = $scope.cluster.getShards(node.id, index.name);
          var sameShard = function(s) {
            return s.shard === shard.shard;
          };
          if (shards.filter(sameShard).length === 0) {
            return true;
          }
        }
      }
      return false;
    };

  }
]);

kopf.controller('ClusterSettingsController', ['$scope', '$location', '$timeout',
  'AlertService', 'ElasticService',
  function($scope, $location, $timeout, AlertService, ElasticService) {

    $scope.initializeController = function() {
      $('#cluster_settings_option a').tab('show');
      $('#cluster_settings_tabs a:first').tab('show');
      $('.setting-info').popover();
      $scope.active_settings = 'transient'; // remember last active?
      $scope.settings = new ClusterSettings(ElasticService.cluster.settings);
    };

    $scope.save = function() {
      var settings = JSON.stringify($scope.settings, undefined, '');
      ElasticService.updateClusterSettings(settings,
          function(response) {
            AlertService.success('Cluster settings were successfully updated',
                response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while updating cluster settings', error);
          }
      );
    };
  }
]);

kopf.controller('ClusterStatsController', ['$scope', 'ElasticService',
  function($scope, ElasticService) {

    $scope.cluster = undefined;

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(newValue, oldValue) {
          $scope.cluster = ElasticService.cluster;
        }
    );

  }
]);

kopf.controller('ConfirmDialogController', ['$scope', 'ConfirmDialogService',
  function($scope, ConfirmDialogService) {

    $scope.dialog_service = ConfirmDialogService;

    $scope.close = function() {
      $scope.dialog_service.close();
    };

    $scope.confirm = function() {
      $scope.dialog_service.confirm();
    };

  }
]);

kopf.controller('CreateIndexController', ['$scope', 'AlertService',
  'ElasticService', 'AceEditorService',
  function($scope, AlertService, ElasticService, AceEditorService) {

    $scope.source_index = null;
    $scope.shards = '';
    $scope.replicas = '';
    $scope.name = '';
    $scope.indices = [];

    $scope.initializeController = function() {
      $('#create_index_option a').tab('show');
      $scope.prepareCreateIndex();
    };

    $scope.updateEditor = function() {
      ElasticService.getIndexMetadata($scope.source_index,
          function(meta) {
            var body = {settings: meta.settings, mappings: meta.mappings};
            $scope.editor.setValue(JSON.stringify(body, null, 2));
          },
          function(error) {
            AlertService.error('Error while loading index settings', error);
          }
      );
    };

    $scope.createIndex = function() {
      if ($scope.name.trim().length === 0) {
        AlertService.error('You must specify a valid index name');
      } else {
        var bodyString = $scope.editor.format();
        if (isDefined($scope.editor.error)) {
          AlertService.error('Invalid JSON: ' + $scope.editor.error);
        } else {
          var body = JSON.parse(bodyString);
          if (Object.keys(body).length === 0) {
            body = {settings: {index: {}}};
            if ($scope.shards.trim().length > 0) {
              body.settings.index.number_of_shards = $scope.shards;
            }
            if ($scope.replicas.trim().length > 0) {
              body.settings.index.number_of_replicas = $scope.replicas;
            }
            bodyString = JSON.stringify(body);
          }
          ElasticService.createIndex($scope.name, bodyString,
              function(response) {
                ElasticService.refresh();
              },
              function(error) {
                AlertService.error('Error while creating index', error);
              }
          );
        }
      }
    };

    $scope.prepareCreateIndex = function() {
      if (!isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('index-settings-editor');
      }
      $scope.indices = ElasticService.getIndices();
      $scope.source_index = null;
      $scope.editor.setValue('{}');
      $scope.shards = '';
      $scope.name = '';
      $scope.replicas = '';
    };
  }
]);

kopf.controller('DebugController', ['$scope', 'DebugService',
  function($scope, DebugService) {

    $scope.messages = [];

    $scope.visible = false;

    $scope.$watch(
        function() {
          return $scope.visible ? DebugService.getUpdatedAt() : 0;
        },
        function(newValue, oldValue) {
          $scope.messages = $scope.visible ? DebugService.getMessages() : [];
        }
    );

  }

]);

kopf.controller('GlobalController', ['$scope', '$location', '$sce', '$window',
  'AlertService', 'ElasticService', 'ExternalSettingsService', 'PageService',
  function($scope, $location, $sce, $window, AlertService, ElasticService,
           ExternalSettingsService, PageService) {

    $scope.version = '2.0.1';

    $scope.modal = new ModalControls();

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(newValue, oldValue) {
          var version = ElasticService.getVersion();
          if (version && version.isValid()) {
            var major = version.getMajor();
            if (major != parseInt($scope.version.charAt(0))) {
              AlertService.warn(
                  'This version of kopf is not compatible with your ES version',
                  'Upgrading to newest supported version is recommended'
              );
            }
          }
        }
    );

    $scope.getTheme = function() {
      return ExternalSettingsService.getTheme();
    };

    $scope.readParameter = function(name) {
      var regExp = new RegExp('[\\?&]' + name + '=([^&#]*)');
      var results = regExp.exec($window.location.href);
      return isDefined(results) ? results[1] : null;
    };

    $scope.connect = function() {
      try {
        var host = 'http://localhost:9200'; // default
        if ($location.host() !== '') { // not opening from fs
          var location = $scope.readParameter('location');
          var url = $location.absUrl();
          if (isDefined(location)) {
            host = location;
          } else if (url.indexOf('/_plugin/kopf') > -1) {
            host = url.substring(0, url.indexOf('/_plugin/kopf'));
          } else {
            host = $location.protocol() + '://' + $location.host() +
                ':' + $location.port();
          }
        }
        ElasticService.connect(host);
      } catch (error) {
        AlertService.error(error.message, error.body);
      }
    };

    $scope.connect();

    ElasticService.refresh();

    $scope.hasConnection = function() {
      return isDefined(ElasticService.cluster);
    };

    $scope.displayInfo = function(title, info) {
      $scope.modal.title = title;
      $scope.modal.info = $sce.trustAsHtml(JSONTree.create(info));
      $('#modal_info').modal({show: true, backdrop: true});
    };

  }
]);

kopf.controller('HotThreadsController', ['$scope', 'ElasticService',
  'AlertService',
  function($scope, ElasticService, AlertService) {

    $scope.node = undefined;

    $scope.nodes = [];

    $scope.type = 'cpu';

    $scope.types = ['cpu', 'wait', 'block'];

    $scope.interval = '500ms';

    $scope.threads = 3;

    $scope.ignoreIdleThreads = true;

    $scope.nodesHotThreads = undefined;

    $scope.execute = function() {
      ElasticService.getHotThreads($scope.node, $scope.type, $scope.threads,
          $scope.interval, $scope.ignoreIdleThreads,
          function(result) {
            $scope.nodesHotThreads = result;
          },
          function(error) {
            AlertService.error('Error while fetching hot threads', error);
            $scope.nodesHotThreads = undefined;
          }
      );
    };

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(current, previous) {
          $scope.nodes = ElasticService.getNodes();
        },
        true
    );

    $scope.initializeController = function() {
      $scope.nodes = ElasticService.getNodes();
    };

  }

]);

kopf.controller('IndexSettingsController', ['$scope', '$location',
  'AlertService', 'ElasticService',
  function($scope, $location, AlertService, ElasticService) {

    $scope.index = null;
    $scope.settings = null;
    $scope.editable_settings = null;

    $scope.save = function() {
      var index = $scope.index;
      var settings = $scope.settings;
      var newSettings = {};
      var editableSettings = $scope.editable_settings;
      // TODO: could move that to editable_index_settings model
      editableSettings.valid_settings.forEach(function(setting) {
        if (notEmpty(editableSettings[setting])) {
          newSettings[setting] = editableSettings[setting];
        }
      });
      ElasticService.updateIndexSettings(index,
          JSON.stringify(newSettings, undefined, ''),
          function(response) {
            AlertService.success('Index settings were successfully updated',
                response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while updating index settings', error);
          }
      );
    };

    $scope.initializeController = function() {
      var index = $location.search().index;
      ElasticService.getIndexMetadata(index,
          function(metadata) {
            $scope.index = index;
            $scope.settings = metadata.settings;
            $scope.editable_settings = new EditableIndexSettings(
                $scope.settings
            );
          },
          function(error) {
            AlertService.error('Error while loading index settings for [' +
                    index + ']',
                error);
          }
      );
    };

  }
]);

kopf.controller('IndexTemplatesController', ['$scope', 'ConfirmDialogService',
  'AlertService', 'AceEditorService', 'ElasticService',
  function($scope, ConfirmDialogService, AlertService, AceEditorService,
           ElasticService) {

    var TemplateBase = JSON.stringify(
        {
          template: 'template pattern(e.g.: index*)',
          settings: {},
          mappings: {},
          aliases: {}
        },
        undefined,
        2
    );

    $scope.editor = undefined;

    $scope.paginator = new Paginator(1, 10, [],
        new IndexTemplateFilter('', ''));

    $scope.template = new IndexTemplate('', {});

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('index-template-editor');
        $scope.editor.setValue(TemplateBase);
      }
    };

    $scope.loadTemplates = function() {
      ElasticService.getIndexTemplates(
          function(templates) {
            $scope.paginator.setCollection(templates);
            $scope.page = $scope.paginator.getPage();
          },
          function(error) {
            AlertService.error('Error while loading templates', error);
          }
      );
    };

    $scope.createIndexTemplate = function() {
      if ($scope.template.name) {
        if ($scope.editor.hasContent()) {
          $scope.editor.format();
          if (!isDefined($scope.editor.error)) {
            $scope.template.body = $scope.editor.getValue();
            ElasticService.createIndexTemplate($scope.template,
                function(response) {
                  $scope.loadTemplates();
                  AlertService.success(
                      'Template successfully created',
                      response
                  );
                },
                function(error) {
                  AlertService.error('Error while creating template', error);
                }
            );
          }
        } else {
          AlertService.error('Template body can\'t be empty');
        }
      } else {
        AlertService.error('Template name can\'t be empty');
      }
    };

    $scope.deleteIndexTemplate = function(template) {
      ConfirmDialogService.open(
          'are you sure you want to delete template ' + template.name + '?',
          template.body,
          'Delete',
          function() {
            ElasticService.deleteIndexTemplate(template.name,
                function(response) {
                  AlertService.success('Template successfully deleted',
                      response);
                  $scope.loadTemplates();
                },
                function(error) {
                  AlertService.error('Error while deleting template', error);
                }
            );
          }
      );
    };

    $scope.loadIndexTemplate = function(template) {
      $scope.template.name = template.name;
      $scope.editor.setValue(JSON.stringify(template.body, undefined, 2));
    };

    $scope.initializeController = function() {
      $scope.loadTemplates();
      $scope.initEditor();
    };
  }
]);

kopf.controller('NavbarController', ['$scope', '$location',
  'ExternalSettingsService', 'ElasticService', 'AlertService',
  'HostHistoryService',
  function($scope, $location, ExternalSettingsService, ElasticService,
           AlertService, HostHistoryService) {

    $scope.new_refresh = '' + ExternalSettingsService.getRefreshRate();
    $scope.theme = ExternalSettingsService.getTheme();
    $scope.new_host = '';
    $scope.current_host = ElasticService.getHost();
    $scope.host_history = HostHistoryService.getHostHistory();

    $scope.clusterStatus = undefined;
    $scope.clusterName = undefined;
    $scope.fetchedAt = undefined;

    $scope.$watch(
        function() {
          return ElasticService.getHost();
        },
        function(newValue, oldValue) {
          $scope.current_host = ElasticService.getHost();
        }
    );

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(newValue, oldValue) {
          if (isDefined(ElasticService.cluster)) {
            $scope.clusterStatus = ElasticService.cluster.status;
            $scope.clusterName = ElasticService.cluster.name;
            $scope.fetchedAt = ElasticService.cluster.fetched_at;
            $scope.clientName = ElasticService.cluster.clientName;
          } else {
            $scope.clusterStatus = undefined;
            $scope.clusterName = undefined;
            $scope.fetchedAt = undefined;
            $scope.clientName = undefined;
          }
        }
    );

    $scope.handleConnectToHost = function(event) {
      if (event.keyCode == 13 && notEmpty($scope.new_host)) {
        $scope.connectToHost($scope.new_host);
      }
    };

    $scope.connectToHost = function(host) {
      try {
        ElasticService.connect(host);
        HostHistoryService.addToHistory(ElasticService.connection);
        $scope.host_history = HostHistoryService.getHostHistory();
      } catch (error) {
        AlertService.error('Error while connecting to new target host', error);
      } finally {
        $scope.current_host = ElasticService.connection.host;
        ElasticService.refresh();
      }
    };

    $scope.changeRefresh = function() {
      ExternalSettingsService.setRefreshRate($scope.new_refresh);
    };

    $scope.changeTheme = function() {
      ExternalSettingsService.setTheme($scope.theme);
    };

  }
]);

kopf.controller('NodesController', ['$scope', 'ConfirmDialogService',
  'AlertService', 'ElasticService', 'AppState',
  function($scope, ConfirmDialogService, AlertService, ElasticService,
           AppState) {

    $scope.sortBy = 'name';
    $scope.reverse = false;

    $scope.setSortBy = function(field) {
      if ($scope.sortBy === field) {
        $scope.reverse = !$scope.reverse;
      }
      $scope.sortBy = field;
    };

    $scope.filter = AppState.getProperty(
        'NodesController',
        'filter',
        new NodeFilter('', true, true, true, 0)
    );

    $scope.nodes = [];

    $scope.$watch('filter',
        function(newValue, oldValue) {
          $scope.refresh();
        },
        true);

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(newValue, oldValue) {
          $scope.refresh();
        }
    );

    $scope.refresh = function() {
      var nodes = ElasticService.getNodes();
      $scope.nodes = nodes.filter(function(node) {
        return $scope.filter.matches(node);
      });
    };

    $scope.showNodeStats = function(nodeId) {
      ElasticService.getNodeStats(nodeId,
          function(nodeStats) {
            $scope.displayInfo('stats for ' + nodeStats.name, nodeStats.stats);
          },
          function(error) {
            AlertService.error('Error while loading node stats', error);
          }
      );
    };

  }

]);

kopf.controller('PercolatorController', ['$scope', 'ConfirmDialogService',
  'AlertService', 'AceEditorService', 'ElasticService',
  function($scope, ConfirmDialogService, AlertService, AceEditorService,
           ElasticService) {
    $scope.editor = undefined;
    $scope.pagination = new PercolatorsPage(0, 0, 0, []);

    $scope.filter = '';
    $scope.id = '';

    $scope.index = null;
    $scope.indices = [];
    $scope.new_query = new PercolateQuery({});

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getIndices();
        },
        true
    );

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('percolator-query-editor');
      }
    };

    $scope.previousPage = function() {
      $scope.loadPercolatorQueries(this.pagination.previousOffset());
    };

    $scope.nextPage = function() {
      $scope.loadPercolatorQueries(this.pagination.nextOffset());
    };

    $scope.parseSearchParams = function() {
      var queries = [];
      var id = $scope.id;
      if (id.trim().length > 0) {
        queries.push({'query_string': {default_field: '_id', query: id}});
      }
      if ($scope.filter.trim().length > 0) {
        var filter = JSON.parse($scope.filter);
        Object.keys(filter).forEach(function(field) {
          var q = {};
          q[field] = filter[field];
          queries.push({'term': q});
        });
      }
      return queries;
    };

    $scope.deletePercolatorQuery = function(query) {
      ConfirmDialogService.open('are you sure you want to delete query ' +
              query.id + ' for index ' + query.index + '?',
          query.sourceAsJSON(),
          'Delete',
          function() {
            ElasticService.deletePercolatorQuery(query.index, query.id,
                function(response) {
                  var refreshIndex = query.index;
                  ElasticService.refreshIndex(refreshIndex,
                      function(response) {
                        AlertService.success('Query successfully deleted',
                            response);
                        $scope.loadPercolatorQueries();
                      },
                      function(error) {
                        AlertService.error('Error while reloading queries',
                            error);
                      }
                  );
                },
                function(error) {
                  AlertService.error('Error while deleting query', error);
                }
            );
          }
      );
    };

    $scope.createNewQuery = function() {
      if (!notEmpty($scope.new_query.index) || !notEmpty($scope.new_query.id)) {
        AlertService.error('Both index and query id must be specified');
        return;
      }

      $scope.new_query.source = $scope.editor.format();
      if (isDefined($scope.editor.error)) {
        AlertService.error('Invalid percolator query');
        return;
      }

      if (!notEmpty($scope.new_query.source)) {
        AlertService.error('Query must be defined');
        return;
      }
      ElasticService.createPercolatorQuery($scope.new_query,
          function(response) {
            var refreshIndex = $scope.new_query.index;
            ElasticService.refreshIndex(refreshIndex,
                function(response) {
                  AlertService.success('Percolator Query successfully created',
                      response);
                  $scope.index = $scope.new_query.index;
                  $scope.loadPercolatorQueries(0);
                },
                function(error) {
                  AlertService.success('Error while reloading queries', error);
                }
            );
          },
          function(error) {
            AlertService.error('Error while creating percolator query', error);
          }
      );
    };

    $scope.searchPercolatorQueries = function() {
      if (isDefined($scope.index)) {
        $scope.loadPercolatorQueries();
      } else {
        AlertService.info('No index is selected');
      }
    };

    $scope.loadPercolatorQueries = function(from) {
      try {
        from = isDefined(from) ? from : 0;
        var queries = $scope.parseSearchParams();
        var body = {from: from, size: 10};
        if (queries.length > 0) {
          body.query = {bool: {must: queries}};
        }
        ElasticService.fetchPercolateQueries($scope.index, body,
            function(percolators) {
              $scope.pagination = percolators;
            },
            function(error) {
              AlertService.error('Error loading percolate queries', error);
            }
        );
      } catch (error) {
        AlertService.error('Filter is not a valid JSON');
      }
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
      $scope.initEditor();
    };

  }
]);

kopf.controller('RestController', ['$scope', '$location', '$timeout',
  'ExplainService', 'AlertService', 'AceEditorService', 'ElasticService',
  'ClipboardService',
  function($scope, $location, $timeout, ExplainService, AlertService,
           AceEditorService, ElasticService, ClipboardService) {
    $scope.request = new Request(
        decodeURIComponent($location.search().path || ''),
        decodeURIComponent($location.search().method || 'GET'),
        decodeURIComponent($location.search().body || '{}')
    );

    $scope.validation_error = null;

    $scope.history = [];

    $scope.editor = null;
    $scope.response = '';
    $scope.explanationResults = [];

    $scope.mapping = undefined;
    $scope.options = [];

    $scope.updateOptions = function(text) {
      if ($scope.mapping) {
        var autocomplete = new URLAutocomplete($scope.mapping);
        $scope.options = autocomplete.getAlternatives(text);
      }
    };

    $scope.copyAsCURLCommand = function() {
      var method = $scope.request.method;
      var host = ElasticService.getHost();
      var path = encodeURI($scope.request.path);
      var body = $scope.editor.getValue();
      var curl = 'curl -X' + method + ' \'' + host + path + '\'';
      if (['POST', 'PUT'].indexOf(method) >= 0) {
        curl += ' -d \'' + body + '\'';
      }
      ClipboardService.copy(
          curl,
          function() {
            AlertService.info('cURL request successfully copied to clipboard');
          },
          function() {
            AlertService.error('Error while copying request to clipboard');
          }
      );
    };

    $scope.loadHistory = function() {
      var history = [];
      var rawHistory = localStorage.getItem('kopf_request_history');
      if (isDefined(rawHistory)) {
        try {
          JSON.parse(rawHistory).forEach(function(h) {
            history.push(new Request().loadFromJSON(h));
          });
        } catch (error) {
          localStorage.setItem('kopf_request_history', null);
        }
      }
      return history;
    };

    $scope.loadFromHistory = function(request) {
      $scope.request.path = encodeURI(request.path);
      $scope.request.body = request.body;
      $scope.request.method = request.method;
      $scope.editor.setValue(request.body);
    };

    $scope.addToHistory = function(path, method, body) {
      var request = new Request(path, method, body);
      var exists = false;
      for (var i = 0; i < $scope.history.length; i++) {
        if ($scope.history[i].equals(request)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        $scope.history.unshift(request);
        if ($scope.history.length > 30) {
          $scope.history.length = 30;
        }
        var historyRaw = JSON.stringify($scope.history);
        localStorage.setItem('kopf_request_history', historyRaw);
      }
    };

    function _handleResponse(data) {
      $scope.response = data;
    }

    function doSendRequest(successCallback) {
      if (notEmpty($scope.request.path)) {
        var path = encodeURI('/' + $scope.request.path);
        $scope.request.body = $scope.editor.format();
        $scope.response = '';
        $scope.explanationResults = [];
        if ($scope.request.method == 'GET' && '{}' !== $scope.request.body) {
          AlertService.info('You are executing a GET request with body ' +
              'content. Maybe you meant to use POST or PUT?');
        }
        ElasticService.clusterRequest($scope.request.method,
            path, {}, $scope.request.body,
            function(response) {
              successCallback(response);
              $scope.addToHistory($scope.request.path,
                  $scope.request.method, $scope.request.body);
            },
            function(error, status) {
              if (status !== 0) {
                AlertService.error('Request was not successful');
                _handleResponse(error);
              } else {
                var url = ElasticService.connection.host + path;
                AlertService.error(url + ' is unreachable');
              }
            }
        );
      } else {
        AlertService.warn('Path is empty');
      }
    }

    $scope.sendRequest = function() {
      doSendRequest(function(response) {
        _handleResponse(response);
      });
    };
    $scope.isExplain = function() {
      var isSearch = $scope.request.path.indexOf('_search') >= 0;
      var isExplain = $scope.request.path.indexOf('_explain') >= 0;
      return ($scope.request.method === 'GET' && (isExplain || isSearch)) ||
        ($scope.request.method === 'POST' && isSearch);
    };
    $scope.explainRequest = function() {
      if (!ExplainService.isExplainPath($scope.request.path)) {
        AlertService.info('You are executing a request ' +
          'without _explain nor ?explain=true');
      }
      doSendRequest(function(response) {
        $scope.explanationResults =
          ExplainService.normalizeExplainResponse(response);
        $scope.response = response;
      });
    };

    $scope.exportAsCSV = function() {
      var csv = doCSV($scope.response);
      var blob = new Blob([csv], {type:'data:text/csv;charset=utf-8;'});
      var downloadLink = angular.element('<a></a>');
      downloadLink.attr('href', window.URL.createObjectURL(blob));
      downloadLink.attr('download', 'data.csv');
      downloadLink[0].click();
    };

    $scope.initEditor = function() {
      if (!isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('rest-client-editor');
        $scope.editor.setValue($scope.request.body);
      }
    };

    $scope.initializeController = function() {
      $scope.initEditor();
      $scope.history = $scope.loadHistory();
      ElasticService.getClusterMapping(
          function(mapping) {
            $scope.mapping = mapping;
            $scope.updateOptions($scope.request.path);
          },
          function(error) {
            AlertService.error('Error while loading cluster mappings', error);
          }
      );
    };

    $scope.explanationTreeConfig = {
      expandOn: {
        field: 'description',
        titleClass: 'explanation-result-description'
      },
      columnDefs: [
        {
          field: 'value',
          titleClass: 'explanation-result-header',
          cellClass: 'text-right'
        }
      ]
    };
  }

]);

kopf.controller('SnapshotController', ['$scope', 'ConfirmDialogService',
  'AlertService', 'ElasticService',
  function($scope, ConfirmDialogService, AlertService, ElasticService) {
    // registered snapshot
    $scope.showSpecialIndices = false;
    $scope.repositories = [];
    $scope.indices = [];

    $scope.paginator = new Paginator(1, 10, [], new SnapshotFilter());
    $scope.page = $scope.paginator.getPage();
    $scope.snapshots = [];

    $scope.snapshot = null;
    $scope.snapshot_repository = '';

    $scope.restorable_indices = [];
    $scope.repository_form = new Repository('', {settings: {}, type: ''});
    $scope.new_snap = {};
    $scope.restore_snap = {};
    $scope.editor = undefined;

    $scope.$watch('showSpecialIndices', function(current, previous) {
      $scope.loadIndices();
    });

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.loadIndices();
        },
        true
    );

    $scope.loadIndices = function() {
      var indices = $scope.indices = ElasticService.getIndices();
      if (!$scope.showSpecialIndices) {
        indices = indices.filter(function(idx) { return !idx.special; });
      }
      $scope.indices = indices;
    };

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.reload = function() {
      $scope.loadIndices();
      $scope.loadRepositories();
      if (notEmpty($scope.snapshot_repository)) {
        $scope.fetchSnapshots($scope.snapshot_repository);
      }
    };

    $scope.optionalParam = function(body, object, paramname) {
      if (angular.isDefined(object[paramname])) {
        body[paramname] = object[paramname];
      }
      return body;
    };

    $scope.executeDeleteRepository = function(repository) {
      ElasticService.deleteRepository(repository.name,
          function(response) {
            AlertService.success('Repository successfully deleted', response);
            if (notEmpty($scope.snapshot_repository) &&
                $scope.snapshot_repository == repository.name) {
              $scope.snapshot_repository = '';
            }
            $scope.reload();
          },
          function(error) {
            AlertService.error('Error while deleting repository', error);
          }
      );
    };

    $scope.deleteRepository = function(repository) {
      ConfirmDialogService.open('are you sure you want to delete repository ' +
              repository.name + '?',
          repository.settings,
          'Delete',
          function() {
            $scope.executeDeleteRepository(repository);
          }
      );
    };

    $scope.restoreSnapshot = function() {
      var body = {};
      // dont add to body if not present, these are optional, all indices included by default
      if (angular.isDefined($scope.restore_snap.indices) &&
          $scope.restore_snap.indices.length > 0) {
        body.indices = $scope.restore_snap.indices.join(',');
      }

      $scope.optionalParam(body, $scope.restore_snap, 'include_global_state');
      $scope.optionalParam(body, $scope.restore_snap, 'include_aliases');
      $scope.optionalParam(body, $scope.restore_snap, 'ignore_unavailable');
      $scope.optionalParam(body, $scope.restore_snap, 'rename_replacement');
      $scope.optionalParam(body, $scope.restore_snap, 'rename_pattern');

      ElasticService.restoreSnapshot($scope.snapshot_repository,
          $scope.snapshot.name, JSON.stringify(body),
          function(response) {
            AlertService.success('Snapshot Restored Started');
            $scope.reload();
          },
          function(error) {
            AlertService.error('Error while starting restore of snapshot',
                error);
          }
      );
    };

    $scope.createRepository = function() {
      try {
        $scope.repository_form.validate();
        ElasticService.createRepository($scope.repository_form.name,
            $scope.repository_form.asJson(),
            function(response) {
              AlertService.success('Repository created');
              $scope.loadRepositories();
            },
            function(error) {
              AlertService.error('Error while creating repository', error);
            }
        );
      } catch (error) {
        AlertService.error(error);
      }
    };

    $scope.loadRepositories = function() {
      ElasticService.getRepositories(
          function(response) {
            $scope.repositories = response;
          },
          function(error) {
            $scope.repositories = [];
            AlertService.error('Error while reading snapshot', error);
          }
      );
    };

    $scope.createSnapshot = function() {
      var body = {};

      // name and repo required
      if (!isDefined($scope.new_snap.repository)) {
        AlertService.warn('Repository is required');
        return;
      }

      if (!isDefined($scope.new_snap.name)) {
        AlertService.warn('Snapshot name is required');
        return;
      }

      // dont add to body if not present, these are optional, all indices included by default
      if (isDefined($scope.new_snap.indices) &&
          $scope.new_snap.indices.length > 0) {
        body.indices = $scope.new_snap.indices.join(',');
      }

      if (isDefined($scope.new_snap.include_global_state)) {
        body.include_global_state = $scope.new_snap.include_global_state;
      }

      $scope.optionalParam(body, $scope.new_snap, 'ignore_unavailable');

      ElasticService.createSnapshot($scope.new_snap.repository.name,
          $scope.new_snap.name, JSON.stringify(body),
          function(response) {
            AlertService.success('Snapshot created');
            $scope.reload();
          },
          function(error) {
            AlertService.error('Error while creating snapshot', error);
          }
      );
    };

    $scope.deleteSnapshot = function(snapshot) {
      ConfirmDialogService.open(
              'are you sure you want to delete snapshot ' + snapshot.name + '?',
          snapshot,
          'Delete',
          function() {
            ElasticService.deleteSnapshot(
                $scope.snapshot_repository,
                snapshot.name,
                function(response) {
                  AlertService.success('Snapshot successfully deleted',
                      response);
                  $scope.reload();
                },
                function(error) {
                  AlertService.error('Error while deleting snapshot', error);
                }
            );
          }
      );
    };

    $scope.fetchSnapshots = function(repository) {
      ElasticService.getSnapshots(repository,
          function(response) {
            $scope.paginator.setCollection(response);
            $scope.page = $scope.paginator.getPage();
          },
          function(error) {
            $scope.paginator.setCollection([]);
            $scope.page = $scope.paginator.getPage();
            AlertService.error('Error while fetching snapshots', error);
          }
      );
    };

    $scope.selectSnapshot = function(snapshot) {
      $scope.snapshot = snapshot;
    };

    $scope.unselectSnapshot = function() {
      $scope.snapshot = null;
    };

    $scope.selectRepository = function(repository) {
      $scope.snapshot_repository = repository;
      $scope.fetchSnapshots(repository);
    };

    $scope.initializeController = function() {
      $scope.snapshot = null; // clear 'active' snapshot
      $scope.reload();
    };

  }
]);

kopf.controller('WarmersController', [
  '$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService',
  'ElasticService',
  function($scope, ConfirmDialogService, AlertService, AceEditorService,
           ElasticService) {
    $scope.editor = undefined;
    $scope.indices = [];
    $scope.index = null;
    $scope.paginator = new Paginator(1, 10, [], new WarmerFilter(''));
    $scope.page = $scope.paginator.getPage();

    $scope.warmer = new Warmer('', '', {types: [], source: {}});

    $scope.warmers = [];

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getIndices();
        },
        true
    );

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('warmer-editor');
      }
    };

    $scope.createWarmer = function() {
      if ($scope.editor.hasContent()) {
        $scope.editor.format();
        if (!isDefined($scope.editor.error)) {
          $scope.warmer.source = $scope.editor.getValue();
          ElasticService.registerWarmer($scope.warmer,
              function(response) {
                $scope.loadIndexWarmers();
                AlertService.success('Warmer successfully created', response);
              },
              function(error) {
                AlertService.error('Request returned invalid JSON', error);
              }
          );
        }
      } else {
        AlertService.error('Warmer query can\'t be empty');
      }
    };

    $scope.deleteWarmer = function(warmer) {
      ConfirmDialogService.open(
          'are you sure you want to delete warmer ' + warmer.id + '?',
          warmer.source,
          'Delete',
          function() {
            ElasticService.deleteWarmer(warmer, // FIXME: better send name + id
                function(response) {
                  AlertService.success('Warmer successfully deleted', response);
                  $scope.loadIndexWarmers();
                },
                function(error) {
                  AlertService.error('Error while deleting warmer', error);
                }
            );
          }
      );
    };

    $scope.loadIndexWarmers = function() {
      if (isDefined($scope.index)) {
        ElasticService.getIndexWarmers($scope.index, '',
            function(warmers) {
              $scope.paginator.setCollection(warmers);
              $scope.page = $scope.paginator.getPage();
            },
            function(error) {
              $scope.paginator.setCollection([]);
              $scope.page = $scope.paginator.getPage();
              AlertService.error('Error while fetching warmers', error);
            }
        );
      } else {
        $scope.paginator.setCollection([]);
        $scope.page = $scope.paginator.getPage();
      }
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
      $scope.initEditor();
    };

  }
]);

(function(kopf, JSONTree) {
  'use strict';
  kopf.directive('kopfJsonTree', function($sce) {
    var directive = {
      restrict: 'E',
      template:'<div class="json-tree" ng-bind-html="result"></div>',
      scope: {
        kopfBind: '='
      },
      link: function(scope, element, attrs, requires) {
        scope.$watch('kopfBind', function(value) {
          var result;
          if (value) {
            try {
              result = JSONTree.create(value);
            } catch (invalidJsonError) {
              result = invalidJsonError;
            }
          } else {
            result = '';
          }

          scope.result = $sce.trustAsHtml(result);
        });
      }
    };
    return directive;
  });
})(kopf, JSONTree);

kopf.directive('ngNavbarSection', ['$location', 'ElasticService',
  function($location, ElasticService) {

    return {
      template: function(elem, attrs) {
        if (!attrs.version || ElasticService.versionCheck(attrs.version)) {
          var target = attrs.target;
          var text = attrs.text;
          var icon = attrs.icon;
          return '<a href="#!' + target + '">' +
              '<i class="fa fa-fw ' + icon + '"></i> ' + text +
              '</a>';
        } else {
          return '';
        }
      }
    };
  }

]);

kopf.directive('ngPagination', ['$document', function($document) {

  return {
    scope: {
      paginator: '=paginator',
      page: '=page',
      label: '=label'
    },
    templateUrl: './partials/directives/pagination.html',
    link: function(scope, element, attrs) {
      var handler = function(event) {
        var $target = $(event.target);
        if ($target.is('input, textarea')) {
          return;
        }
        if (event.keyCode == 39 && scope.page.next) {
          scope.$apply(function() {
            scope.paginator.nextPage();
            event.preventDefault();
          });
        }
        if (event.keyCode == 37 && scope.page.previous) {
          scope.$apply(function() {
            scope.paginator.previousPage();
            event.preventDefault();
          });
        }
      };

      $document.bind('keydown', handler);
      element.on('$destroy', function() {
        $document.unbind('keydown', handler);
      });
    }
  };
}]);

kopf.directive('ngSortBy',
    function() {

      function updateSortingIcon(scope, elem, attrs) {
        var sorts = scope.sortBy === attrs.property;
        var sortIcon = elem.find('i');
        sortIcon.removeClass('fa-sort-asc fa-sort-desc');
        if (sorts) {
          if (scope.reverse) {
            sortIcon.addClass('fa-sort-desc');
          } else {
            sortIcon.addClass('fa-sort-asc');
          }
        }
      }

      function link(scope, elem, attrs) {
        scope.$watch(
            function() {
              return scope.sortBy;
            },
            function() {
              updateSortingIcon(scope, elem, attrs);
            });

        scope.$watch(
            function() {
              return scope.reverse;
            },
            function() {
              updateSortingIcon(scope, elem, attrs);
            }
        );
      }

      return {
        link: link,
        template: function(elem, attrs) {
          return '<a href="" target="_self" ng-click=setSortBy(\'' +
              attrs.property + '\')>' + attrs.text +
              '<i class="fa fa-fw fa-sort-asc"></i></a>';
        }
      };
    }
);

kopf.directive('ngStaticInclude', function() {
  return {
    templateUrl: function(elem, attr) {
      return './partials/' + attr.file + '.html';
    }
  };
});

function IndexAliases(index, aliases) {
  this.index = index;
  this.aliases = aliases;

  this.clone = function() {
    var cloned = new IndexAliases(this.index, []);
    cloned.aliases = this.aliases.map(function(alias) {
      return alias.clone();
    });
    return cloned;
  };
}

IndexAliases.diff = function(original, modified) {
  var differences = [];
  modified.forEach(function(ia) {
    var isNew = true;
    original.forEach(function(origIA) {
      if (ia.index == origIA.index) {
        isNew = false;
        ia.aliases.forEach(function(alias) {
          var originalAliases = origIA.aliases.filter(function(originalAlias) {
            return alias.equals(originalAlias);
          });
          if (originalAliases.length === 0) {
            differences.push(alias);
          }
        });
      }
    });
    if (isNew) {
      ia.aliases.forEach(function(alias) {
        differences.push(alias);
      });
    }
  });
  return differences;
};

function Alias(alias, index, filter, indexRouting, searchRouting) {
  this.alias = isDefined(alias) ? alias.toLowerCase() : '';
  this.index = isDefined(index) ? index.toLowerCase() : '';
  this.filter = isDefined(filter) ? filter : '';
  this.index_routing = isDefined(indexRouting) ? indexRouting : '';
  this.search_routing = isDefined(searchRouting) ? searchRouting : '';

  this.validate = function() {
    if (!notEmpty(this.alias)) {
      throw 'Alias must have a non empty name';
    }
    if (!notEmpty(this.index)) {
      throw 'Alias must have a valid index name';
    }
  };

  this.equals = function(otherAlias) {
    var equal =
        (this.alias === otherAlias.alias) &&
        (this.index === otherAlias.index) &&
        (this.filter === otherAlias.filter) &&
        (this.index_routing === otherAlias.index_routing) &&
        (this.search_routing === otherAlias.search_routing);
    return equal;
  };

  this.info = function() {
    var info = {};
    info.index = this.index;
    info.alias = this.alias;

    if (isDefined(this.filter)) {
      if (typeof this.filter == 'string' && notEmpty(this.filter)) {
        info.filter = JSON.parse(this.filter);
      } else {
        info.filter = this.filter;
      }
    }
    if (notEmpty(this.index_routing)) {
      info.index_routing = this.index_routing;
    }
    if (notEmpty(this.search_routing)) {
      info.search_routing = this.search_routing;
    }
    return info;
  };

  this.clone = function() {
    return new Alias(this.alias, this.index, this.filter, this.index_routing,
        this.search_routing);
  };
}

function BrokenCluster(health, state, nodesStats, settings, nodes) {

  this.status = health.status;
  this.initializing_shards = health.initializing_shards;
  this.active_primary_shards = health.active_primary_shards;
  this.active_shards = health.active_shards;
  this.relocating_shards = health.relocating_shards;
  this.unassigned_shards = health.unassigned_shards;
  this.number_of_nodes = health.number_of_nodes;
  this.number_of_data_nodes = health.number_of_data_nodes;
  this.timed_out = health.timed_out;
  this.shards = this.active_shards + this.relocating_shards +
  this.unassigned_shards + this.initializing_shards;
  this.fetched_at = getTimeString(new Date());

  this.name = state.cluster_name;
  this.master_node = state.master_node;

  this.settings = settings;

  var totalSize = 0;

  this.nodes = Object.keys(nodes.nodes).map(function(nodeId) {
    var nodeStats = nodesStats.nodes[nodeId];
    var nodeInfo = nodes.nodes[nodeId];
    var node = new Node(nodeId, nodeStats, nodeInfo);
    if (nodeId === state.master_node) {
      node.setCurrentMaster();
    }
    return node;
  });

  this.getNodes = function() {
    return this.nodes;
  };

  this.total_size = readablizeBytes(totalSize);
  this.total_size_in_bytes = totalSize;
  this.indices = [];
}

function CatResult(result) {
  var lines = result.split('\n');
  var header = lines[0];
  var columns = header.match(/\S+/g);
  var values = lines.slice(1, -1).map(function(line) {
    return columns.map(function(column, i) {
      var start = header.indexOf(column);
      var lastColumn = i < columns.length - 1;
      var end = lastColumn ? header.indexOf(columns[i + 1]) : undefined;
      return line.substring(start, end).trim();
    });
  });

  this.columns = columns;
  this.lines = values;
}

function Cluster(health, state, stats, nodesStats, settings, aliases, nodes,
                 main) {
  this.created_at = new Date().getTime();

  // main -> GET /
  this.clientName = main.name;

  // Cluster Health(/_cluster/health)
  this.status = health.status;
  this.initializing_shards = health.initializing_shards;
  this.active_primary_shards = health.active_primary_shards;
  this.active_shards = health.active_shards;
  this.relocating_shards = health.relocating_shards;
  this.unassigned_shards = health.unassigned_shards;
  this.number_of_nodes = health.number_of_nodes;
  this.number_of_data_nodes = health.number_of_data_nodes;
  this.timed_out = health.timed_out;
  this.shards = (this.active_shards + this.relocating_shards +
  this.unassigned_shards + this.initializing_shards);

  this.fetched_at = getTimeString(new Date());

  this.name = state.cluster_name;
  this.master_node = state.master_node;

  this.closedIndices = 0;

  this.disableAllocation = 'false';
  var persistentAllocation = getProperty(settings,
      'persistent.cluster.routing.allocation.enable', 'all');

  var transientAllocation = getProperty(settings,
      'transient.cluster.routing.allocation.enable', '');

  if (transientAllocation !== '') {
    this.disableAllocation = transientAllocation == 'all' ? 'false' : 'true';
  } else {
    if (persistentAllocation != 'all') {
      this.disableAllocation = 'true';
    }
  }

  this.settings = settings;

  this.nodes = Object.keys(nodes.nodes).map(function(nodeId) {
    var nodeStats = nodesStats.nodes[nodeId];
    var nodeInfo = nodes.nodes[nodeId];
    var node = new Node(nodeId, nodeStats, nodeInfo);
    if (nodeId === state.master_node) {
      node.setCurrentMaster();
    }
    return node;
  });

  this.getNodes = function() {
    return this.nodes;
  };

  this.number_of_nodes = this.nodes.length;

  var indicesNames = Object.keys(state.routing_table.indices);
  var specialIndices = 0;
  var closedIndices = 0;
  this.indices = indicesNames.map(function(indexName) {
    var indexStats = stats.indices[indexName];
    var indexAliases = aliases[indexName];
    var index = new Index(indexName, state, indexStats, indexAliases);
    if (index.special) {
      specialIndices++;
    }
    return index;
  });

  if (isDefined(state.blocks.indices)) {
    var indices = this.indices;
    Object.keys(state.blocks.indices).forEach(function(indexName) {
      // INDEX_CLOSED_BLOCK = new ClusterBlock(4, "index closed", ...
      if (state.blocks.indices[indexName]['4']) {
        indices.push(new Index(indexName));
        closedIndices++;
      }
    });
  }
  this.special_indices = specialIndices;
  this.closedIndices = closedIndices;
  var hasData = Object.keys(stats._all.primaries).length > 0;
  this.num_docs = hasData ? stats._all.primaries.docs.count : 0;
  this.total_size_in_bytes = hasData ? stats._all.total.store.size_in_bytes : 0;
  this.total_indices = this.indices.length;

  this.changes = null;

  this.computeChanges = function(oldCluster) {
    var nodes = this.nodes;
    var indices = this.indices;
    var changes = new ClusterChanges();
    if (isDefined(oldCluster) && this.name === oldCluster.name) {
      // checks for node differences
      oldCluster.nodes.forEach(function(node) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].equals(node)) {
            node = null;
            break;
          }
        }
        if (isDefined(node)) {
          changes.addLeavingNode(node);
        }
      });

      if (oldCluster.nodes.length != nodes.length || !changes.hasJoins()) {
        nodes.forEach(function(node) {
          for (var i = 0; i < oldCluster.nodes.length; i++) {
            if (oldCluster.nodes[i].equals(node)) {
              node = null;
              break;
            }
          }
          if (isDefined(node)) {
            changes.addJoiningNode(node);
          }
        });
      }

      // checks for indices differences
      oldCluster.indices.forEach(function(index) {
        for (var i = 0; i < indices.length; i++) {
          if (indices[i].equals(index)) {
            index = null;
            break;
          }
        }
        if (isDefined(index)) {
          changes.addDeletedIndex(index);
        }
      });

      var equalNumberOfIndices = oldCluster.indices.length != indices.length;
      if (equalNumberOfIndices || !changes.hasCreatedIndices()) {
        indices.forEach(function(index) {
          for (var i = 0; i < oldCluster.indices.length; i++) {
            if (oldCluster.indices[i].equals(index)) {
              index = null;
              break;
            }
          }
          if (isDefined(index)) {
            changes.addCreatedIndex(index);
          }
        });
      }
      var docDelta = this.num_docs - oldCluster.num_docs;
      // var docRate = docDelta / ((this.created_at - old_cluster.created_at) / 1000);
      changes.setDocDelta(docDelta);
      var dataDelta = this.total_size_in_bytes - oldCluster.total_size_in_bytes;
      changes.setDataDelta(dataDelta);
    }
    this.changes = changes;
  };

  this.open_indices = function() {
    return this.indices.filter(function(index) {
      return index.state === 'open';
    });
  };

  var shards = {};
  var unassignedShards = {};

  var indicesRouting = state.routing_table.indices;
  indicesNames.forEach(function(indexName) {
    var totalShards = Object.keys(indicesRouting[indexName].shards);

    totalShards.forEach(function(shardNum) {
      indicesRouting[indexName].shards[shardNum].forEach(function(shardData) {
        if (shardData.state === 'UNASSIGNED') {
          if (!isDefined(unassignedShards[shardData.index])) {
            unassignedShards[shardData.index] = [];
          }
          unassignedShards[shardData.index].push(new Shard(shardData));
        } else {
          var shard = new Shard(shardData);
          var key = shard.node + '_' + shard.index;
          if (!isDefined(shards[key])) {
            shards[key] = [];
          }
          shards[key].push(shard);
        }
      });
    });
  });

  this.getShards = function(nodeId, indexName) {
    var allocated = shards[nodeId + '_' + indexName];
    return isDefined(allocated) ? allocated : [];
  };

  this.getUnassignedShards = function(indexName) {
    var unassigned = unassignedShards[indexName];
    return isDefined(unassigned) ? unassigned : [];
  };

}

function ClusterChanges() {

  this.nodeJoins = null;
  this.nodeLeaves = null;
  this.indicesCreated = null;
  this.indicesDeleted = null;

  this.docDelta = 0;
  this.dataDelta = 0;

  this.setDocDelta = function(delta) {
    this.docDelta = delta;
  };

  this.getDocDelta = function() {
    return this.docDelta;
  };

  this.absDocDelta = function() {
    return Math.abs(this.docDelta);
  };

  this.absDataDelta = function() {
    return readablizeBytes(Math.abs(this.dataDelta));
  };

  this.getDataDelta = function() {
    return this.dataDelta;
  };

  this.setDataDelta = function(delta) {
    this.dataDelta = delta;
  };

  this.hasChanges = function() {
    return (
      isDefined(this.nodeJoins) ||
      isDefined(this.nodeLeaves) ||
      isDefined(this.indicesCreated) ||
      isDefined(this.indicesDeleted)
      );
  };

  this.addJoiningNode = function(node) {
    this.changes = true;
    if (!isDefined(this.nodeJoins)) {
      this.nodeJoins = [];
    }
    this.nodeJoins.push(node);
  };

  this.addLeavingNode = function(node) {
    this.changes = true;
    if (!isDefined(this.nodeLeaves)) {
      this.nodeLeaves = [];
    }
    this.nodeLeaves.push(node);
  };

  this.hasJoins = function() {
    return isDefined(this.nodeJoins);
  };

  this.hasLeaves = function() {
    return isDefined(this.nodeLeaves);
  };

  this.hasCreatedIndices = function() {
    return isDefined(this.indicesCreated);
  };

  this.hasDeletedIndices = function() {
    return isDefined(this.indicesDeleted);
  };

  this.addCreatedIndex = function(index) {
    if (!isDefined(this.indicesCreated)) {
      this.indicesCreated = [];
    }
    this.indicesCreated.push(index);
  };

  this.addDeletedIndex = function(index) {
    if (!isDefined(this.indicesDeleted)) {
      this.indicesDeleted = [];
    }
    this.indicesDeleted.push(index);
  };

}

function ClusterHealth(health) {
  this.status = health.status;
  this.cluster_name = health.cluster_name;
  this.initializing_shards = health.initializing_shards;
  this.active_primary_shards = health.active_primary_shards;
  this.active_shards = health.active_shards;
  this.relocating_shards = health.relocating_shards;
  this.unassigned_shards = health.unassigned_shards;
  this.number_of_nodes = health.number_of_nodes;
  this.number_of_data_nodes = health.number_of_data_nodes;
  this.timed_out = health.timed_out;
  this.shards = this.active_shards + this.relocating_shards +
      this.unassigned_shards + this.initializing_shards;
  this.fetched_at = getTimeString(new Date());
}

function ClusterMapping(data) {

  this.getIndices = function() {
    return Object.keys(data);
  };

  this.getTypes = function(index) {
    var indexMapping = getProperty(data, index + '.mappings', {});
    return Object.keys(indexMapping);
  };

}

function ClusterSettings(settings) {
  // FIXME: 0.90/1.0 check
  var valid = [
    // cluster
    'cluster.blocks.read_only',
    'indices.ttl.interval',
    'indices.cache.filter.size',
    'discovery.zen.minimum_master_nodes',
    // recovery
    'indices.recovery.concurrent_streams',
    'indices.recovery.compress',
    'indices.recovery.file_chunk_size',
    'indices.recovery.translog_ops',
    'indices.recovery.translog_size',
    'indices.recovery.max_bytes_per_sec',
    // routing
    'cluster.routing.allocation.node_initial_primaries_recoveries',
    'cluster.routing.allocation.cluster_concurrent_rebalance',
    'cluster.routing.allocation.awareness.attributes',
    'cluster.routing.allocation.node_concurrent_recoveries',
    'cluster.routing.allocation.disable_allocation',
    'cluster.routing.allocation.disable_replica_allocation'
  ];
  var instance = this;
  ['persistent', 'transient'].forEach(function(type) {
    instance[type] = {};
    var currentSettings = settings[type];
    valid.forEach(function(setting) {
      instance[type][setting] = getProperty(currentSettings, setting);
    });
  });
}

function EditableIndexSettings(settings) {
  // FIXME: 0.90/1.0 check
  this.valid_settings = [
    // blocks
    'index.blocks.read_only',
    'index.blocks.read',
    'index.blocks.write',
    'index.blocks.metadata',
    // cache
    'index.cache.filter.max_size',
    'index.cache.filter.expire',
    // index
    'index.number_of_replicas',
    'index.index_concurrency',
    'index.warmer.enabled',
    'index.refresh_interval',
    'index.term_index_divisor',
    'index.ttl.disable_purge',
    'index.fail_on_merge_failure',
    'index.gc_deletes',
    'index.codec',
    'index.compound_on_flush',
    'index.term_index_interval',
    'index.auto_expand_replicas',
    'index.recovery.initial_shards',
    'index.compound_format',
    // routing
    'index.routing.allocation.disable_allocation',
    'index.routing.allocation.disable_new_allocation',
    'index.routing.allocation.disable_replica_allocation',
    'index.routing.allocation.total_shards_per_node',
    // slowlog
    'index.search.slowlog.threshold.query.warn',
    'index.search.slowlog.threshold.query.info',
    'index.search.slowlog.threshold.query.debug',
    'index.search.slowlog.threshold.query.trace',
    'index.search.slowlog.threshold.fetch.warn',
    'index.search.slowlog.threshold.fetch.info',
    'index.search.slowlog.threshold.fetch.debug',
    'index.search.slowlog.threshold.fetch.trace',
    'index.indexing.slowlog.threshold.index.warn',
    'index.indexing.slowlog.threshold.index.info',
    'index.indexing.slowlog.threshold.index.debug',
    'index.indexing.slowlog.threshold.index.trace',
    // translog
    'index.translog.flush_threshold_ops',
    'index.translog.flush_threshold_size',
    'index.translog.flush_threshold_period',
    'index.translog.disable_flush',
    'index.translog.fs.type'
  ];
  var instance = this;
  this.valid_settings.forEach(function(setting) {
    instance[setting] = getProperty(settings, setting);
  });
}


// Expects URL according to /^(https|http):\/\/(\w+):(\w+)@(.*)/i;
// Examples:
// http://localhost:9200
// http://user:password@localhost:9200
// https://localhost:9200
function ESConnection(url, withCredentials) {
  if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
    url = 'http://' + url;
  }
  var protectedUrl = /^(https|http):\/\/(\w+):(\w+)@(.*)/i;
  this.host = 'http://localhost:9200'; // default
  this.withCredentials = withCredentials;
  if (notEmpty(url)) {
    var connectionParts = protectedUrl.exec(url);
    if (isDefined(connectionParts)) {
      this.host = connectionParts[1] + '://' + connectionParts[4];
      this.username = connectionParts[2];
      this.password = connectionParts[3];
      this.auth = 'Basic ' + window.btoa(this.username + ':' + this.password);
    } else {
      this.host = url;
    }
  }

}

function HotThread(header) {
  this.header = header;
  this.subHeader = undefined;
  this.stack = [];
}

function HotThreads(data) {
  this.nodes_hot_threads = data.split(':::').slice(1).map(function(data) {
    return new NodeHotThreads(data);
  });
}

function Index(indexName, clusterState, indexStats, aliases) {
  this.name = indexName;
  this.shards = null;
  this.metadata = {};
  this.state = 'close';
  this.num_of_shards = 0;
  this.num_of_replicas = 0;
  this.aliases = [];
  if (isDefined(aliases)) {
    var indexAliases = aliases.aliases;
    if (isDefined(indexAliases)) {
      this.aliases = Object.keys(aliases.aliases);
    }
  }

  if (isDefined(clusterState)) {
    var routing = getProperty(clusterState, 'routing_table.indices');
    this.state = 'open';
    if (isDefined(routing)) {
      var shards = Object.keys(routing[indexName].shards);
      this.num_of_shards = shards.length;
      var shardMap = routing[indexName].shards;
      this.num_of_replicas = shardMap[0].length - 1;
    }
  }
  this.num_docs = getProperty(indexStats, 'primaries.docs.count', 0);
  this.deleted_docs = getProperty(indexStats, 'primaries.docs.deleted', 0);
  this.size_in_bytes = getProperty(indexStats,
      'primaries.store.size_in_bytes', 0);
  this.total_size_in_bytes = getProperty(indexStats,
      'total.store.size_in_bytes', 0);

  this.unassigned = [];
  this.unhealthy = false;

  if (isDefined(clusterState) && isDefined(clusterState.routing_table)) {
    var instance = this;
    var shardsMap = clusterState.routing_table.indices[this.name].shards;
    Object.keys(shardsMap).forEach(function(shardNum) {
      shardsMap[shardNum].forEach(function(shard) {
        if (shard.state != 'STARTED') {
          instance.unhealthy = true;
        }
      });
    });
  }

  this.special = this.name.indexOf('.') === 0 || this.name.indexOf('_') === 0;

  this.equals = function(index) {
    return index !== null && index.name == this.name;
  };

  this.closed = this.state === 'close';

  this.open = this.state === 'open';

}

function IndexMetadata(index, metadata) {
  this.index = index;
  this.mappings = metadata.mappings;
  this.settings = metadata.settings;

  this.getTypes = function() {
    return Object.keys(this.mappings).sort(function(a, b) {
      return a.localeCompare(b);
    });
  };

  this.getAnalyzers = function() {
    var analyzers = Object.keys(getProperty(this.settings,
        'index.analysis.analyzer', {}));
    if (analyzers.length === 0) {
      Object.keys(this.settings).forEach(function(setting) {
        if (setting.indexOf('index.analysis.analyzer') === 0) {
          var analyzer = setting.substring('index.analysis.analyzer.'.length);
          analyzer = analyzer.substring(0, analyzer.indexOf('.'));
          if ($.inArray(analyzer, analyzers) == -1) {
            analyzers.push(analyzer);
          }
        }
      });
    }
    return analyzers.sort(function(a, b) {
      return a.localeCompare(b);
    });
  };

  function isAnalyzable(type) {
    var analyzableTypes = ['float', 'double', 'byte', 'short', 'integer',
      'long', 'nested', 'object'
    ];
    return analyzableTypes.indexOf(type) == -1;
  }

  this.getFields = function(type) {
    var fields = [];
    if (isDefined(this.mappings[type])) {
      fields = this.getProperties('', this.mappings[type].properties);
    }
    return fields.sort(function(a, b) {
      return a.localeCompare(b);
    });
  };

  this.getProperties = function(parent, fields) {
    var prefix = parent !== '' ? parent + '.' : '';
    var validFields = [];
    for (var field in fields) {
      // multi field
      if (isDefined(fields[field].fields)) {
        var addPrefix = fields[field].path != 'just_name';
        var multiPrefix = addPrefix ? prefix + field : prefix;
        var multiProps = this.getProperties(multiPrefix, fields[field].fields);
        validFields = validFields.concat(multiProps);
      }
      // nested and object types
      var nestedType = fields[field].type == 'nested';
      var objectType = fields[field].type == 'object';
      if (nestedType || objectType || !isDefined(fields[field].type)) {
        var nestedProperties = this.getProperties(prefix + field,
            fields[field].properties);
        validFields = validFields.concat(nestedProperties);
      }
      // normal fields
      if (isDefined(fields[field].type) && isAnalyzable(fields[field].type)) {
        validFields.push(prefix + field);
      }
    }
    return validFields;
  };
}

function IndexTemplate(name, body) {
  this.name = name;
  this.body = body;
}

function Node(nodeId, nodeStats, nodeInfo) {
  this.id = nodeId;
  this.name = nodeInfo.name;
  this.elasticVersion = nodeInfo.version;
  this.jvmVersion = nodeInfo.jvm.version;
  this.availableProcessors = nodeInfo.os.available_processors;
  this.transportAddress = nodeInfo.transport_address;
  this.host = nodeInfo.host;

  var attributes = getProperty(nodeInfo, 'attributes', {});
  var master = attributes.master === 'false' ? false : true;
  var data = attributes.data === 'false' ? false : true;
  var client = attributes.client === 'true' ? true : false;
  this.master = master && !client;
  this.data = data && !client;
  this.client = client || !master && !data;
  this.current_master = false;

  this.stats = nodeStats;
  this.uptime = nodeStats.jvm.uptime_in_millis;

  this.heap_used = readablizeBytes(getProperty(this.stats,
    'jvm.mem.heap_used_in_bytes'));

  this.heap_committed = readablizeBytes(getProperty(this.stats,
    'jvm.mem.heap_committed_in_bytes'));

  this.heap_used_percent = getProperty(this.stats, 'jvm.mem.heap_used_percent');

  this.heap_max = readablizeBytes(getProperty(this.stats,
    'jvm.mem.heap_max_in_bytes'));

  this.disk_total_in_bytes = getProperty(this.stats, 'fs.total.total_in_bytes');
  this.disk_free_in_bytes = getProperty(this.stats, 'fs.total.free_in_bytes');
  var diskUsedInBytes = (this.disk_total_in_bytes - this.disk_free_in_bytes);
  var usedRatio = (diskUsedInBytes / this.disk_total_in_bytes);
  this.disk_used_percent = Math.round(100 * usedRatio);

  this.cpu = getProperty(this.stats, 'process.cpu.percent');

  this.load_average = getProperty(this.stats, 'os.load_average');

  this.setCurrentMaster = function() {
    this.current_master = true;
  };

  this.equals = function(node) {
    return node.id === this.id;
  };

}

function NodeHotThreads(data) {
  var lines = data.split('\n');
  this.header = lines[0];
  // pre 4859ce5d79a786b58b1cd2fb131614677efd6b91
  var BackwardCompatible = lines[1].indexOf('Hot threads at') == -1;
  var HeaderLines = BackwardCompatible ? 2 : 3;
  this.subHeader = BackwardCompatible ? undefined : lines[1];
  this.node = this.header.substring(
      this.header.indexOf('[') + 1,
      this.header.indexOf(']')
  );
  var threads = [];
  var thread;
  if (lines.length > HeaderLines) {
    lines.slice(HeaderLines).forEach(function(line) {
      var blankLine = line.trim().length === 0;
      if (thread) {
        if (thread.subHeader) {
          thread.stack.push(line);
          if (blankLine) {
            thread = undefined;
          }
        } else {
          thread.subHeader = line;
        }
      } else {
        thread = new HotThread(line);
        threads.push(thread);
      }
    });
  }
  this.threads = threads;

}

function NodeStats(id, stats) {
  this.id = id;
  this.name = stats.name;
  this.stats = stats;
}

function PercolateQuery(queryInfo) {
  this.index = queryInfo._index;
  this.id = queryInfo._id;
  this.source = queryInfo._source;
  this.filter = {};

  this.sourceAsJSON = function() {
    try {
      return JSON.stringify(this.source, undefined, 2);
    } catch (error) {

    }
  };

  this.equals = function(other) {
    return (other instanceof PercolateQuery &&
      this.index == other.index &&
      this.id == other.id &&
      this.source == other.source);
  };
}

function PercolatorsPage(from, size, total, percolators) {
  this.from = from;
  this.size = size;
  this.total = total;
  this.percolators = percolators;

  this.hasNextPage = function() {
    return from + size < total;
  };

  this.hasPreviousPage = function() {
    return from > 0;
  };

  this.firstResult = function() {
    return total > 0 ? from + 1 : 0;
  };

  this.lastResult = function() {
    return this.hasNextPage() ? from + size : total;
  };

  this.nextOffset = function() {
    return this.hasNextPage() ? from + size : from;
  };

  this.previousOffset = function() {
    return this.hasPreviousPage() ? from - size : from;
  };

  this.getPage = function() {
    return percolators;
  };

  this.total = function() {
    return total;
  };
}

function Repository(name, info) {
  this.name = name;
  this.type = info.type;
  this.settings = info.settings;

  this.asJson = function() {
    var json = {type: this.type};
    if (this.type === 'fs') {
      var fsSettings = ['location', 'chunk_size', 'max_restore_bytes_per_sec',
        'max_snapshot_bytes_per_sec', 'compress'];
      json.settings = this.getSettings(fsSettings);
    }
    if (this.type === 'url') {
      var urlSettings = ['url'];
      json.settings = this.getSettings(urlSettings);
    }
    if (this.type === 's3') {
      var s3Settings = ['region', 'bucket', 'base_path', 'access_key',
        'secret_key', 'chunk_size', 'max_retries', 'compress',
        'server_side_encryption'
      ];
      json.settings = this.getSettings(s3Settings);
    }
    if (this.type === 'hdfs') {
      var hdfsSettings = ['uri', 'path', 'load_defaults', 'conf_location',
        'concurrent_streams', 'compress', 'chunk_size'];
      json.settings = this.getSettings(hdfsSettings);
    }
    if (this.type === 'azure') {
      var azureSettings = ['container', 'base_path', 'concurrent_streams',
        'chunk_size', 'compress'];
      json.settings = this.getSettings(azureSettings);
    }
    return JSON.stringify(json);
  };

  this.validate = function() {
    if (!notEmpty(this.name)) {
      throw 'Repository name is required';
    }
    if (!notEmpty(this.type)) {
      throw 'Repository type is required';
    }
    if (this.type === 'fs') {
      var fsRequired = ['location'];
      this.validateSettings(fsRequired);
    }
    if (this.type === 'url') {
      var urlRequired = ['url'];
      this.validateSettings(urlRequired);
    }
    if (this.type === 's3') {
      var s3Required = ['bucket'];
      this.validateSettings(s3Required);
    }
    if (this.type === 'hdfs') {
      var hdfsRequired = ['path'];
      this.validateSettings(hdfsRequired);
    }
  };

  this.validateSettings = function(required) {
    var repository = this;
    required.forEach(function(setting) {
      if (!notEmpty(repository.settings[setting])) {
        var type = repository.type;
        throw(setting + ' is required for snapshot of type ' + type);
      }
    });
  };

  this.getSettings = function(availableSettings) {
    var settings = {};
    var currentSettings = this.settings;
    availableSettings.forEach(function(setting) {
      if (notEmpty(currentSettings[setting])) {
        settings[setting] = currentSettings[setting];
      }
    });
    return settings;
  };
}

function Shard(routing) {
  this.primary = routing.primary;
  this.shard = routing.shard;
  this.state = routing.state;
  this.node = routing.node;
  this.index = routing.index;
  this.id = this.node + '_' + this.shard + '_' + this.index;
}

function ShardStats(shard, index, stats) {
  this.shard = shard;
  this.index = index;
  this.stats = stats;
}

function Snapshot(info) {
  this.name = info.snapshot;
  this.indices = info.indices;
  this.state = info.state;
  this.start_time = info.start_time;
  this.start_time_in_millis = info.start_time_in_millis;
  this.end_time = info.end_time;
  this.end_time_in_millis = info.end_time_in_millis;
  this.duration_in_millis = info.duration_in_millis;
  this.failures = info.failures;
  this.shards = info.shards;
}

/** TYPES **/
function Token(token, startOffset, endOffset, position) {
  this.token = token;
  this.start_offset = startOffset;
  this.end_offset = endOffset;
  this.position = position;
}

function Version(version) {
  var checkVersion = new RegExp('(\\d)\\.(\\d)\\.(\\d)\\.*');
  var major;
  var minor;
  var patch;
  var value = version;
  var valid = false;

  if (checkVersion.test(value)) {
    valid = true;
    var parts = checkVersion.exec(version);
    major = parseInt(parts[1]);
    minor = parseInt(parts[2]);
    patch = parseInt(parts[3]);
  }

  this.isValid = function() {
    return valid;
  };

  this.getMajor = function() {
    return major;
  };

  this.getMinor = function() {
    return minor;
  };

  this.getPatch = function() {
    return patch;
  };

  this.getValue = function() {
    return value;
  };

  this.isGreater = function(other) {
    var higherMajor = major > other.getMajor();
    var higherMinor = major == other.getMajor() && minor > other.getMinor();
    var higherPatch = (
        major == other.getMajor() &&
        minor == other.getMinor() &&
        patch >= other.getPatch()
    );
    return (higherMajor || higherMinor || higherPatch);
  };

}

function Warmer(id, index, body) {
  this.id = id;
  this.index = index;
  this.source = body.source;
  this.types = body.types;
}

kopf.filter('bytes', function() {

  var UNITS = ['b', 'KB', 'MB', 'GB', 'TB', 'PB'];

  function stringify(bytes) {
    if (bytes > 0) {
      var e = Math.floor(Math.log(bytes) / Math.log(1024));
      return (bytes / Math.pow(1024, e)).toFixed(2) + UNITS[e];
    } else {
      return 0 + UNITS[0];
    }
  }

  return function(bytes) {
    return stringify(bytes);
  };

});

kopf.filter('startsWith', function() {

  function strStartsWith(str, prefix) {
    return (str + '').indexOf(prefix) === 0;
  }

  return function(elements, prefix) {
    var filtered = [];
    angular.forEach(elements, function(element) {
      if (strStartsWith(element, prefix)) {
        filtered.push(element);
      }
    });

    return filtered;
  };
});

kopf.filter('timeInterval', function() {

  var UNITS = ['yr', 'mo', 'd', 'h', 'min'];

  var UNIT_MEASURE = {
    yr: 31536000000,
    mo: 2678400000,
    wk: 604800000,
    d: 86400000,
    h: 3600000,
    min: 60000
  };

  function stringify(seconds) {

    var result = 'less than a minute';

    for (var idx = 0; idx < UNITS.length; idx++) {
      var amount = Math.floor(seconds / UNIT_MEASURE[UNITS[idx]]);
      if (amount) {
        result = amount + UNITS[idx] + '.';
        break;
      }
    }

    return result;
  }

  return function(seconds) {
    return stringify(seconds);
  };

});

function AceEditor(target) {
  // ace editor
  ace.config.set('basePath', 'dist/');
  this.editor = ace.edit(target);
  this.editor.setFontSize('10px');
  this.editor.setTheme('ace/theme/kopf');
  this.editor.getSession().setMode('ace/mode/json');
  this.editor.setOptions({
    fontFamily: 'Monaco, Menlo, Consolas, "Courier New", monospace',
    fontSize: '12px',
    fontWeight: '400'
  });

  // validation error
  this.error = null;

  // sets value and moves cursor to beggining
  this.setValue = function(value) {
    this.editor.setValue(value, 1);
    this.editor.gotoLine(0, 0, false);
  };

  this.getValue = function() {
    return this.editor.getValue();
  };

  // formats the json content
  this.format = function() {
    var content = this.editor.getValue();
    try {
      if (isDefined(content) && content.trim().length > 0) {
        this.error = null;
        content = JSON.stringify(JSON.parse(content), undefined, 2);
        this.editor.setValue(content, 0);
        this.editor.gotoLine(0, 0, false);
      }
    } catch (error) {
      this.error = error.toString();
    }
    return content;
  };

  this.hasContent = function() {
    return this.editor.getValue().trim().length > 0;
  };
}

function AliasFilter(index, alias) {

  this.index = index;
  this.alias = alias;

  this.clone = function() {
    return new AliasFilter(this.index, this.alias);
  };

  this.getSorting = function() {
    return undefined;
  };

  this.equals = function(other) {
    return (other !== null &&
      this.index == other.index &&
      this.alias == other.alias);
  };

  this.isBlank = function() {
    return !notEmpty(this.index) && !notEmpty(this.alias);
  };

  this.matches = function(indexAlias) {
    if (this.isBlank()) {
      return true;
    } else {
      var matches = true;
      if (notEmpty(this.index)) {
        matches = indexAlias.index.indexOf(this.index) != -1;
      }
      if (matches && notEmpty(this.alias)) {
        matches = false;
        var aliases = indexAlias.aliases;
        for (var i = 0; !matches && i < aliases.length; i++) {
          var alias = aliases[i];
          matches = alias.alias.indexOf(this.alias) != -1;
        }
      }
      return matches;
    }
  };

}

function Benchmark() {
  this.name = '';
  this.num_executor = 1;
  this.percentiles = '[10, 25, 50, 75, 90, 99]';
  this.competitors = [];

  this.addCompetitor = function(competitor) {
    this.competitors.push(competitor);
  };

  this.toJson = function() {
    var body = {};
    body.name = this.name;
    if (notEmpty(this.num_executor)) {
      body.num_executor_nodes = this.num_executor;
    }
    if (notEmpty(this.percentiles)) {
      body.percentiles = JSON.parse(this.percentiles);
    }
    if (this.competitors.length > 0) {
      body.competitors = this.competitors.map(function(c) {
        return c.toJson();
      });
    }
    if (notEmpty(this.iterations)) {
      body.iterations = this.iterations;
    }
    if (notEmpty(this.concurrency)) {
      body.concurrency = this.concurrency;
    }
    if (notEmpty(this.multiplier)) {
      body.multiplier = this.multiplier;
    }
    if (notEmpty(this.num_slowest)) {
      body.num_slowest = this.num_slowest;
    }
    return JSON.stringify(body, null, 4);
  };

}

function Competitor() {
  this.name = '';

  // override benchmark options
  this.iterations = '';
  this.concurrency = '';
  this.multiplier = '';
  this.num_slowest = '';
  this.warmup = true;
  this.requests = [];

  // defined only by competitor
  this.search_type = 'query_then_fetch';
  this.indices = '';
  this.types = '';

  // cache
  this.filter_cache = false;
  this.field_data = false;
  this.recycler_cache = false;
  this.id_cache = false;

  this.cache_fields = '';
  this.cache_keys = '';

  this.toJson = function() {
    var body = {};
    body.name = this.name;
    if (notEmpty(this.requests)) {
      body.requests = JSON.parse(this.requests);
    }
    if (notEmpty(this.iterations)) {
      if (isNumber(this.iterations)) {
        body.iterations = parseInt(this.iterations);
      } else {
        throw 'Iterations must be a valid number';
      }
    }
    if (notEmpty(this.concurrency)) {
      if (isNumber(this.concurrency)) {
        body.concurrency = parseInt(this.concurrency);
      } else {
        throw 'Concurrency must be a valid number';
      }
    }
    if (notEmpty(this.multiplier)) {
      if (isNumber(this.multiplier)) {
        body.multiplier = parseInt(this.multiplier);
      } else {
        throw 'Multiplier must be a valid number';
      }
    }
    if (notEmpty(this.num_slowest)) {
      if (isNumber(this.num_slowest)) {
        body.num_slowest = parseInt(this.num_slowest);
      } else {
        throw 'Num slowest must be a valid number';
      }
    }
    if (notEmpty(this.indices)) {
      body.indices = this.indices.split(',').map(function(index) {
        return index.trim();
      });
    }
    if (notEmpty(this.types)) {
      body.types = this.types.split(',').map(function(type) {
        return type.trim();
      });
    }

    body.search_type = this.search_type;

    body.clear_caches = {};
    body.clear_caches.filter = this.filter_cache;
    body.clear_caches.field_data = this.field_data;
    body.clear_caches.id = this.id_cache;
    body.clear_caches.recycler = this.recycler_cache;
    if (notEmpty(this.cache_fields)) {
      body.clear_caches.fields = this.cache_fields.split(',').map(
        function(field) {
          return field.trim();
        });
    }
    if (notEmpty(this.cache_keys)) {
      body.clear_caches.filter_keys = this.cache_keys.split(',').map(
        function(key) {
          return key.trim();
        });
    }

    return body;
  };

}

function Gist(title, url) {
  this.timestamp = getTimeString(new Date());
  this.title = title;
  this.url = url;

  this.loadFromJSON = function(json) {
    this.title = json.title;
    this.url = json.url;
    this.timestamp = json.timestamp;
    return this;
  };

}

function IndexFilter(name, closed, special, healthy, asc, timestamp) {
  this.name = name;
  this.closed = closed;
  this.special = special;
  this.healthy = healthy;
  this.sort = 'name';
  this.asc = asc;
  this.timestamp = timestamp;

  this.getSorting = function() {
    var asc = this.asc;
    switch (this.sort) {
      case 'name':
        return function(a, b) {
          if (asc) {
            return a.name.localeCompare(b.name);
          } else {
            return b.name.localeCompare(a.name);
          }
        };
      default:
        return undefined;
    }
  };

  this.clone = function() {
    return new IndexFilter(
        this.name,
        this.closed,
        this.special,
        this.healthy,
        this.asc,
        this.timestamp
    );
  };

  this.equals = function(other) {
    return (
    other !== null &&
    this.name === other.name &&
    this.closed === other.closed &&
    this.special === other.special &&
    this.healthy === other.healthy &&
    this.asc === other.asc &&
    this.timestamp === other.timestamp
    );
  };

  this.isBlank = function() {
    return (
    !notEmpty(this.name) &&
    this.closed &&
    this.special &&
    this.healthy &&
    this.asc
    );
  };

  this.matches = function(index) {
    var matches = true;
    if (!this.special && index.special) {
      matches = false;
    }
    if (!this.closed && index.closed) {
      matches = false;
    }
    // Hide healthy == show unhealthy only
    if (!this.healthy && !index.unhealthy) {
      matches = false;
    }
    if (matches && notEmpty(this.name)) {
      try {
        var regExp = new RegExp(this.name.trim(), 'i');
        matches = regExp.test(index.name);
        if (!matches) {
          for (var idx = 0; idx < index.aliases.length; idx++) {
            if ((matches = regExp.test(index.aliases[idx]))) {
              break;
            }
          }
        }
      }
      catch (err) { // if not valid regexp, still try normal matching
        matches = index.name.indexOf(this.name.toLowerCase()) != -1;
        if (!matches) {
          for (var idx = 0; idx < index.aliases.length; idx++) {
            var alias = index.aliases[idx].toLowerCase();
            matches = true;
            if ((matches = (alias.indexOf(this.name.toLowerCase()) != -1))) {
              break;
            }
          }
        }
      }
    }
    return matches;
  };

}

function IndexTemplateFilter(name, template) {

  this.name = name;
  this.template = template;

  this.clone = function() {
    return new IndexTemplateFilter(name, template);
  };

  this.getSorting = function() {
    return function(a, b) {
      return a.name.localeCompare(b.name);
    };
  };

  this.equals = function(other) {
    return (other !== null &&
    this.name === other.name &&
    this.template === other.template);
  };

  this.isBlank = function() {
    return !notEmpty(this.name) && !notEmpty(this.template);
  };

  this.matches = function(template) {
    if (this.isBlank()) {
      return true;
    } else {
      var matches = true;
      if (notEmpty(this.name)) {
        matches = template.name.indexOf(this.name) != -1;
      }
      if (matches && notEmpty(this.template)) {
        matches = template.body.template.indexOf(this.template) != -1;
      }
      return matches;
    }
  };

}

function ModalControls() {
  this.alert = null;
  this.active = false;
  this.title = '';
  this.info = '';
}

function NodeFilter(name, data, master, client, timestamp) {
  this.name = name;
  this.data = data;
  this.master = master;
  this.client = client;
  this.timestamp = timestamp;

  this.clone = function() {
    return new NodeFilter(this.name, this.data, this.master, this.client);
  };

  this.getSorting = function() {
    return undefined;
  };

  this.equals = function(other) {
    return (
      other !== null &&
      this.name == other.name &&
      this.data == other.data &&
      this.master == other.master &&
      this.client == other.client &&
      this.timestamp == other.timestamp
      );
  };

  this.isBlank = function() {
    return !notEmpty(this.name) && (this.data && this.master && this.client);
  };

  this.matches = function(node) {
    if (this.isBlank()) {
      return true;
    } else {
      return this.matchesName(node.name) && this.matchesType(node);
    }
  };

  this.matchesType = function(node) {
    return (
      node.data && this.data ||
      node.master && this.master ||
      node.client && this.client
      );
  };

  this.matchesName = function(name) {
    if (notEmpty(this.name)) {
      return name.toLowerCase().indexOf(this.name.toLowerCase()) != -1;
    } else {
      return true;
    }
  };

}

function Paginator(page, pageSize, collection, filter) {

  this.filter = filter;

  this.page = page;

  this.pageSize = pageSize;

  this.$collection = isDefined(collection) ? collection : [];

  this.nextPage = function() {
    this.page += 1;
  };

  this.previousPage = function() {
    this.page -= 1;
  };

  this.setPageSize = function(newSize) {
    this.pageSize = newSize;
  };

  this.getPageSize = function() {
    return this.pageSize;
  };

  this.getCurrentPage = function() {
    return this.page;
  };

  this.getPage = function() {
    var results = this.getResults();
    var total = results.length;

    var first = total > 0 ? ((this.page - 1) * this.pageSize) + 1 : 0;
    while (total < first) {
      this.previousPage();
      first = (this.page - 1) * this.pageSize + 1;
    }
    var lastPage = this.page * this.pageSize > total;
    var last = lastPage ? total : this.page * this.pageSize;

    var elements = total > 0 ? results.slice(first - 1, last) : [];

    var next = this.pageSize * this.page < total;
    var previous = this.page > 1;
    while (elements.length < this.pageSize) {
      elements.push(null);
    }
    return new Page(elements, total, first, last, next, previous);
  };

  this.setCollection = function(collection) {
    if (this.filter.getSorting()) {
      this.$collection = collection.sort(this.filter.getSorting());
    } else {
      this.$collection = collection;
    }
  };

  this.getResults = function() {
    var filter = this.filter;
    var collection = this.$collection;
    if (filter.isBlank()) {
      return collection;
    } else {
      var filtered = [];
      collection.forEach(function(item) {
        if (filter.matches(item)) {
          filtered.push(item);
        }
      });
      return filtered;
    }
  };

  this.getCollection = function() {
    return this.$collection;
  };

}

function Page(elements, total, first, last, next, previous) {
  this.elements = elements;
  this.total = total;
  this.first = first;
  this.last = last;
  this.next = next;
  this.previous = previous;
}

function Request(path, method, body) {
  this.timestamp = getTimeString(new Date());
  this.path = path;
  this.method = method;
  this.body = body;

  this.clear = function() {
    this.path = '';
    this.method = '';
    this.body = '';
  };

  this.loadFromJSON = function(json) {
    if (isDefined(json.url)) {
      var url = json.url.substring(7);
      var path = url.substring(url.indexOf('/'));
      this.path = path;
    } else {
      this.path = json.path;
    }
    this.method = json.method;
    this.body = json.body;
    this.timestamp = json.timestamp;
    return this;
  };

  this.equals = function(request) {
    return (
      this.path === request.path &&
      this.method.toUpperCase() === request.method.toUpperCase() &&
      this.body === request.body
      );
  };
}

function SnapshotFilter() {

  this.clone = function() {
    return new SnapshotFilter();
  };

  this.getSorting = function() {
    return undefined;
  };

  this.equals = function(other) {
    return other !== null;
  };

  this.isBlank = function() {
    return true;
  };

  this.matches = function(snapshot) {
    return true;
  };

}

function URLAutocomplete(mappings) {

  var PATHS = [
    // Suggest
    '_suggest',
    '{index}/_suggest',
    // Multi Search
    '_msearch',
    '{index}/_msearch',
    '{index}/{type}/_msearch',
    '_msearch/template',
    '{index}/_msearch/template',
    '{index}/{type}/_msearch/template',
    // Search
    '_search',
    '{index}/_search',
    '{index}/{type}/_search',
    '_search/template',
    '{index}/_search/template',
    '{index}/{type}/_search/template',
    '_search/exists',
    '{index}/_search/exists',
    '{index}/{type}/_search/exists'
  ];

  var format = function(previousTokens, suggestedToken) {
    if (previousTokens.length > 1) {
      var prefix = previousTokens.slice(0, -1).join('/');
      if (prefix.length > 0) {
        return prefix + '/' + suggestedToken;
      } else {
        return suggestedToken;
      }
    } else {
      return suggestedToken;
    }
  };

  this.getAlternatives = function(path) {
    var pathTokens = path.split('/');
    var suggestedTokenIndex = pathTokens.length - 1;

    /**
     * Replaces the variables on suggestedPathTokens({index}, {type}...) for
     * actual values extracted from pathTokens
     * @param {Array} pathTokens tokens for the path to be suggested
     * @param {Array} suggestedPathTokens tokens for the suggested path
     * @returns {Array} a new array with the variables from suggestedPathTokens
     * replaced by the actual values from pathTokens
     */
    var replaceVariables = function(pathTokens, suggestedPathTokens) {
      var replaced = suggestedPathTokens.map(function(token, position) {
        if (position < pathTokens.length - 1 && token.indexOf('{') === 0) {
          return pathTokens[position];
        } else {
          return token;
        }
      });
      return replaced;
    };

    /**
     * Checks if a given path matches the definition and current state of
     * the path to be autocompleted
     *
     * @param {Array} pathTokens tokens of path to be autocompleted
     * @param {Array} suggestedPathTokens tokens of possible suggestion
     * @returns {boolean} if suggestion is valid
     */
    var isValidSuggestion = function(pathTokens, suggestedPathTokens) {
      var valid = true;
      suggestedPathTokens.forEach(function(token, index) {
        if (valid && index < pathTokens.length - 1) {
          switch (token) {
            case '{index}':
              valid = mappings.getIndices().indexOf(pathTokens[index]) >= 0;
              break;
            case '{type}':
              valid = mappings.getTypes(pathTokens[index - 1]).
                      indexOf(pathTokens[index]) >= 0;
              break;
            default:
              valid = pathTokens[index] === token;
          }
        }
      });
      return valid;
    };

    var alternatives = [];

    var addIfNotPresent = function(collection, element) {
      if (collection.indexOf(element) === -1) {
        collection.push(element);
      }
    };

    PATHS.forEach(function(suggestedPath) {
      var suggestedPathTokens = suggestedPath.split('/');
      if (suggestedPathTokens.length > suggestedTokenIndex &&
          isValidSuggestion(pathTokens, suggestedPathTokens)) {
        suggestedPathTokens = replaceVariables(
            pathTokens,
            suggestedPathTokens
        );
        var suggestedToken = suggestedPathTokens[suggestedTokenIndex];
        switch (suggestedToken) {
          case '{index}':
            mappings.getIndices().forEach(function(index) {
              addIfNotPresent(alternatives, format(pathTokens, index));
            });
            break;
          case '{type}':
            var pathIndex = pathTokens[suggestedTokenIndex - 1];
            mappings.getTypes(pathIndex).forEach(function(type) {
              addIfNotPresent(alternatives, format(pathTokens, type));
            });
            break;
          default:
            addIfNotPresent(alternatives, format(pathTokens, suggestedToken));
        }
      }
    });

    return alternatives.sort(function(a, b) {
      return a.localeCompare(b);
    });
  };

  return this;

}

function WarmerFilter(id) {

  this.id = id;

  this.clone = function() {
    return new WarmerFilter(this.id);
  };

  this.getSorting = function() {
    return undefined;
  };

  this.equals = function(other) {
    return other !== null && this.id == other.id;
  };

  this.isBlank = function() {
    return !notEmpty(this.id);
  };

  this.matches = function(warmer) {
    if (this.isBlank()) {
      return true;
    } else {
      return warmer.id.indexOf(this.id) != -1;
    }
  };

}

kopf.factory('AceEditorService', function() {

  this.init = function(name) {
    return new AceEditor(name);
  };

  return this;
});

var Alert = function(message, response, level, _class, icon) {
  var currentDate = new Date();
  this.message = message;
  this.response = response;
  this.level = level;
  this.class = _class;
  this.icon = icon;
  this.timestamp = getTimeString(currentDate);
  this.id = 'alert_box_' + currentDate.getTime();

  this.hasResponse = function() {
    return isDefined(this.response);
  };

  this.getResponse = function() {
    if (isDefined(this.response)) {
      return JSON.stringify(this.response, undefined, 2);
    }
  };
};

kopf.factory('AlertService', function() {
  this.maxAlerts = 3;

  this.alerts = [];

  // removes ALL alerts
  this.clear = function() {
    this.alerts.length = 0;
  };

  // remove a particular alert message
  this.remove = function(id) {
    $('#' + id).fadeTo(1000, 0).slideUp(200, function() {
      $(this).remove();
    });
    this.alerts = this.alerts.filter(function(a) {
      return id != a.id;
    });
  };

  // creates an error alert
  this.error = function(msg, resp, timeout) {
    timeout = isDefined(timeout) ? timeout : 7500;
    var alert = new Alert(msg, resp, 'error', 'alert-danger', 'fa fa-warning');
    return this.addAlert(alert, timeout);
  };

  // creates an info alert
  this.info = function(msg, resp, timeout) {
    timeout = isDefined(timeout) ? timeout : 2500;
    var alert = new Alert(msg, resp, 'info', 'alert-info', 'fa fa-info');
    return this.addAlert(alert, timeout);
  };

  // creates success alert
  this.success = function(msg, resp, timeout) {
    timeout = isDefined(timeout) ? timeout : 2500;
    var alert = new Alert(msg, resp, 'success', 'alert-success', 'fa fa-check');
    return this.addAlert(alert, timeout);
  };

  // creates a warn alert
  this.warn = function(msg, resp, timeout) {
    timeout = isDefined(timeout) ? timeout : 5000;
    var alert = new Alert(msg, resp, 'warn', 'alert-warning', 'fa fa-info');
    return this.addAlert(alert, timeout);
  };

  this.addAlert = function(alert, timeout) {
    this.alerts.unshift(alert);
    var service = this;
    setTimeout(function() {
      service.remove(alert.id);
    }, timeout);
    if (this.alerts.length >= this.maxAlerts) {
      this.alerts.length = 3;
    }
    return alert.id;
  };

  return this;
});

kopf.factory('ClipboardService', ['AlertService', '$document', '$window',
  function(AlertService, $document, $window) {
    var textarea = angular.element($document[0].createElement('textarea'));
    textarea.css({
      position: 'absolute',
      left: '-9999px',
      top: (
          $window.pageYOffset || $document[0].documentElement.scrollTop
      ) + 'px'
    });
    textarea.attr({readonly: ''});
    angular.element($document[0].body).append(textarea);

    this.copy = function(value, success, failure) {
      try {
        textarea.val(value);
        textarea.select();
        $document[0].execCommand('copy');
        success();
      } catch (error) {
        failure();
      }
    };

    return this;
  }]);

kopf.factory('DebugService', ['$filter', function($filter) {

  var MaxMessages = 1000;

  var messages = [];

  var updatedAt = 0;

  var addMessage = function(message) {
    var date = new Date();
    messages.push($filter('date')(date, '[yyyy-MM-dd HH:mm:ss] ') +  message);
    if (messages.length > MaxMessages) {
      messages.shift();
    }
    updatedAt = date.getTime();
  };

  this.debug = function(message, data) {
    addMessage(message);
    if (data) {
      addMessage(JSON.stringify(data));
    }
  };

  this.getUpdatedAt = function() {
    return updatedAt;
  };

  this.getMessages = function() {
    return messages;
  };

  return this;

}]);

kopf.factory('ElasticService', ['$http', '$q', '$timeout', '$location',
  'ExternalSettingsService', 'DebugService', 'AlertService',
  function($http, $q, $timeout, $location, ExternalSettingsService,
           DebugService, AlertService) {

    var instance = this;

    this.connection = undefined;

    this.connected = false;

    this.cluster = undefined;

    this.autoRefreshStarted = false;

    this.brokenCluster = false;

    this.encodeURIComponent = function(text) {
      return encodeURIComponent(text);
    };

    var encode = function(text) {
      return instance.encodeURIComponent(text);
    };

    /**
     * Resets service state
     */
    this.reset = function() {
      this.connection = undefined;
      this.connected = false;
      this.cluster = undefined;
    };

    this.getIndices = function() {
      return this.cluster ? this.cluster.indices : [];
    };

    this.getNodes = function() {
      return this.cluster ? this.cluster.getNodes() : [];
    };

    this.getOpenIndices = function() {
      return this.cluster ? this.cluster.open_indices() : [];
    };

    this.isConnected = function() {
      return this.connected;
    };

    this.alertClusterChanges = function() {
      if (isDefined(this.cluster)) {
        var changes = this.cluster.changes;
        if (changes.hasChanges()) {
          if (changes.hasJoins()) {
            var joins = changes.nodeJoins.map(function(node) {
              return node.name + '[' + node.transportAddress + ']';
            });
            AlertService.info(joins.length + ' new node(s) joined the cluster',
                joins);
          }
          if (changes.hasLeaves()) {
            var leaves = changes.nodeLeaves.map(function(node) {
              return node.name + '[' + node.transportAddress + ']';
            });
            AlertService.warn(changes.nodeLeaves.length +
            ' node(s) left the cluster', leaves);
          }
          if (changes.hasCreatedIndices()) {
            var created = changes.indicesCreated.map(function(index) {
              return index.name;
            });
            AlertService.info(changes.indicesCreated.length +
            ' indices created: [' + created.join(',') + ']');
          }
          if (changes.hasDeletedIndices()) {
            var deleted = changes.indicesDeleted.map(function(index) {
              return index.name;
            });
            AlertService.info(changes.indicesDeleted.length +
            ' indices deleted: [' + deleted.join(',') + ']');
          }
        }
      }
    };

    /**
     * Connects to Elasticsearch instance and triggers auto polling of cluster
     * state
     *
     * @param {string} host - Elasticsearch url
     */
    this.connect = function(host) {
      this.reset();
      var root = ExternalSettingsService.getElasticsearchRootPath();
      var withCredentials = ExternalSettingsService.withCredentials();
      this.connection = new ESConnection(host + root, withCredentials);
      DebugService.debug('Elasticseach connection:', this.connection);
      this.clusterRequest('GET', '/', {}, {},
          function(data) {
            if (data.OK) { // detected https://github.com/Asquera/elasticsearch-http-basic
              DebugService.debug('elasticsearch-http-basic plugin detected');
              DebugService.debug('Attemping to connect with [' + host + '/]');
              instance.connect(host + '/');
            } else {
              instance.setVersion(data.version.number);
              instance.connected = true;
              if (!instance.autoRefreshStarted) {
                instance.autoRefreshStarted = true;
                instance.autoRefreshCluster();
              } else {
                instance.refresh();
              }
            }
          },
          function(data) {
            if (data.status == 503) {
              DebugService.debug('No active master, switching to basic mode');
              instance.setVersion(data.version.number);
              instance.connected = true;
              instance.setBrokenCluster(true);
              AlertService.error('No active master, switching to basic mode');
              if (!instance.autoRefreshStarted) {
                instance.autoRefreshStarted = true;
                instance.autoRefreshCluster();
              }
            } else {
              AlertService.error(
                  'Error connecting to [' + instance.connection.host + ']',
                  data
              );
            }
          }
      );
    };

    this.setVersion = function(version) {
      this.version = new Version(version);
      if (!this.version.isValid()) {
        DebugService.debug('Invalid Elasticsearch version[' + version + ']');
        throw 'Invalid Elasticsearch version[' + version + ']';
      }
    };

    this.getVersion = function() {
      return this.version;
    };

    this.getHost = function() {
      return this.isConnected() ? this.connection.host : '';
    };

    this.versionCheck = function(version) {
      if (isDefined(this.version.isValid())) {
        return this.version.isGreater(new Version(version));
      } else {
        return true;
      }
    };

    /**
     * Creates an index
     *
     * @param {string} name - new index name
     * @param {Object} settings - index settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createIndex = function(name, settings, success, error) {
      var path = '/' + encode(name);
      this.clusterRequest('POST', path, {}, settings, success, error);
    };

    /**
     * Enables shard allocation
     *
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.enableShardAllocation = function(success, error) {
      var body = {
        transient: {
          'cluster.routing.allocation.enable': 'all'
        }
      };
      this.clusterRequest('PUT', '/_cluster/settings', {}, body, success,
          error);
    };

    /**
     * Disables shard allocation
     *
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.disableShardAllocation = function(success, error) {
      var body = {
        transient: {
          'cluster.routing.allocation.enable': 'none'
        }
      };
      this.clusterRequest('PUT', '/_cluster/settings', {}, body, success,
          error);
    };

    /**
     * Opens index
     *
     * @param {string} index - index name
     */
    this.openIndex = function(index) {
      var path = '/' + encode(index) + '/_open';
      var success = function(response) {
        AlertService.success('Index was successfully opened', response);
        instance.refresh();
      };
      var error = function(response) {
        AlertService.error('Error while opening index', response);
      };
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Optimizes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.optimizeIndex = function(index, success, error) {
      var path = '/' + encode(index) + '/_optimize';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Clears index cache
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.clearCache = function(index, success, error) {
      var path = '/' + encode(index) + '/_cache/clear';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Closes index
     *
     * @param {string} index - index name
     */
    this.closeIndex = function(index) {
      var path = '/' + encode(index) + '/_close';
      var success = function(response) {
        AlertService.success('Index was successfully closed', response);
        instance.refresh();
      };
      var error = function(error) {
        AlertService.error('Error while closing index', error);
      };
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Refreshes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.refreshIndex = function(index, success, error) {
      var path = '/' + encode(index) + '/_refresh';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Deletes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteIndex = function(index, success, error) {
      var path = '/' + encode(index);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Updates index settings
     *
     * @param {string} name - index name
     * @param {Object} settings - index settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateIndexSettings = function(name, settings, success, error) {
      var path = '/' + encode(name) + '/_settings';
      this.clusterRequest('PUT', path, {}, settings, success, error);
    };

    /**
     * Updates the cluster settings
     *
     * @param {Object} settings - new cluster settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateClusterSettings = function(settings, success, error) {
      var path = '/_cluster/settings';
      this.clusterRequest('PUT', path, {}, settings, success, error);
    };

    /**
     * Deletes a warmer
     *
     * @param {Warmer} warmer - warmer to be deleted
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteWarmer = function(warmer, success, error) {
      var path = '/' + encode(warmer.index) + '/_warmer/' + encode(warmer.id);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Deletes a percolator
     *
     * @param {string} index - percolator target index
     * @param {string} id - percolator id
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deletePercolatorQuery = function(index, id, success, error) {
      var path = '/' + encode(index) + '/.percolator/' + encode(id);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Creates a percolator query
     *
     * @param {Percolator} percolator - percolator to be created
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createPercolatorQuery = function(percolator, success, error) {
      var index = percolator.index;
      var id = percolator.id;
      var path = '/' + encode(index) + '/.percolator/' + encode(id);
      this.clusterRequest('PUT', path, {}, percolator.source, success, error);
    };

    /**
     * Creates a repository
     *
     * @param {string} repository - repository name
     * @param {Object} body - repository settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createRepository = function(repository, body, success, error) {
      var path = '/_snapshot/' + encode(repository);
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Deletes a repository
     *
     * @param {string} repository - repository name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteRepository = function(repository, success, error) {
      var path = '/_snapshot/' + encode(repository);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Deletes a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} snapshot - snapshot name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteSnapshot = function(repository, snapshot, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/' + encode(snapshot);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Restores a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} name - snapshot name
     * @param {Object} body - restore settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.restoreSnapshot = function(repository, name, body, success, error) {
      var path = '/_snapshot/' + encode(repository);
      path += '/' + encode(name) + '/_restore';
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Creates a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} snapshot - snapshot name
     * @param {Object} body - snapshot settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createSnapshot = function(repository, snapshot, body, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/' + encode(snapshot);
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Executes a benchmark
     *
     * @param {Object} body - benchmark settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.executeBenchmark = function(body, success, error) {
      var path = '/_bench';
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Registers a warmer query
     *
     * @param {Warmer} warmer - Warmer query
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.registerWarmer = function(warmer, success, error) {
      var path = '/' + encode(warmer.index);
      if (notEmpty(warmer.types)) {
        path += '/' + encode(warmer.types);
      }
      path += '/_warmer/' + encode(warmer.id.trim());
      var body = warmer.source;
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Updates indices aliases
     *
     * @param {Alias[]} add - aliases that should be added
     * @param {Alias[]} remove - aliases that should be removed
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateAliases = function(add, remove, success, error) {
      var data = {actions: []};
      add.forEach(function(a) {
        data.actions.push({add: a.info()});
      });
      remove.forEach(function(a) {
        data.actions.push({remove: a.info()});
      });
      this.clusterRequest('POST', '/_aliases', {}, data, success, error);
    };

    /**
     * Deletes an index template
     *
     * @param {string} name - template name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteIndexTemplate = function(name, success, error) {
      var path = '/_template/' + encode(name);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Creates a new index template
     *
     * @param {IndexTemplate} template - The index template
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createIndexTemplate = function(template, success, error) {
      var path = '/_template/' + encode(template.name);
      var body = template.body;
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Fetches all index templates
     * @callback success
     * @callback error
     */
    this.getIndexTemplates = function(success, error) {
      var path = '/_template';
      var parseTemplates = function(response) {

        var templates = Object.keys(response).map(function(name) {
          return new IndexTemplate(name, response[name]);
        });
        success(templates);
      };
      this.clusterRequest('GET', path, {}, {}, parseTemplates, error);
    };

    /**
     * Relocates a shard to a given node
     * @param {string} shard - The shard to be relocated
     * @param {string} index - The index the shard belongs to
     * @param {string} fromNode - Node where shard is currently located
     * @param {string} toNode - Target node for shard relocation
     * @callback success
     * @callback error
     */
    this.relocateShard = function(shard, index, fromNode, toNode,
                                  success, error) {
      var path = '/_cluster/reroute';
      var body = {
        commands: [
          {
            move: {
              shard: shard,
              index: index,
              from_node: fromNode,
              to_node: toNode
            }
          }
        ]
      };
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Executes cat api request
     * @callback success
     * @callback error
     */
    this.executeCatRequest = function(api, success, error) {
      var path = '/_cat/' + encode(api) + '?v';
      var parseCat = function(response) {
        success(new CatResult(response));
      };
      this.clusterRequest('GET', path, {}, {}, parseCat, error);
    };

    /**
     * Get hot threads
     *
     * @param {string} node - The target node(or empty if all)
     * @param {string} type - the type of threads to be sampled
     * @param {string} threads - The number of threads to be sampled
     * @param {string} interval - The sampling interval in ms
     * @param {boolean} ignoreIdleThreads - Ignores idle threads or not
     * @callback success
     * @callback error
     */
    this.getHotThreads = function(node, type, threads, interval,
                                  ignoreIdleThreads, success, error) {
      var path = '/_nodes' + (node ? '/' + encode(node) : '') + '/hot_threads';
      var params = {
        type: type,
        threads: threads,
        ignore_idle_threads: ignoreIdleThreads,
        interval: interval
      };
      var parseHotThreads = function(response) {
        var threads = new HotThreads(response).nodes_hot_threads;
        success(threads);
      };
      this.clusterRequest('GET', path, params, {}, parseHotThreads, error);
    };

    /**
     * Retrieve comples cluster mapping
     *
     * @callback success
     * @callback error
     */
    this.getClusterMapping = function(success, error) {
      var transformed = function(response) {
        success(new ClusterMapping(response));
      };
      var path = '/_mapping';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    this.getIndexMetadata = function(name, success, error) {
      var transformed = function(response) {
        success(new IndexMetadata(name, response.metadata.indices[name]));
      };
      var path = '/_cluster/state/metadata/' + encode(name) + '?human';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    this.getNodeStats = function(nodeId, success, error) {
      var transformed = function(response) {
        success(new NodeStats(name, response.nodes[nodeId]));
      };
      var path = '/_nodes/' + encode(nodeId) + '/stats?human';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    /**
     * Fetches shard information both from index/_stats and index/_recovery
     * @param {string} shard - shard number
     * @param {string} index - index
     * @param {string} nodeId - node id
     * @callback success
     * @callback error
     */
    this.getShardStats = function(shard, index, nodeId, success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(
            host + '/' + encode(index) + '/_stats?level=shards&human',
            params
        ),
        $http.get(
            host + '/' + encode(index) + '/_recovery?active_only=true&human',
            params
        )
      ]).then(
          function(responses) {
            try {
              var indexStats = responses[0].data;
              var shardsStats = indexStats.indices[index].shards[shard];
              shardsStats = shardsStats ? shardsStats : [];
              var shardStats = shardsStats.filter(
                  function(stats) {
                    return stats.routing.node === nodeId;
                  }
              );
              if (shardStats.length == 1) { // shard is started
                success(new ShardStats(shard, index, shardStats[0]));
              } else { // non started shard
                var indexRecovery = responses[1].data;
                var shardRecoveries = indexRecovery[index].shards.filter(
                    function(recovery) {
                      return recovery.target.id === nodeId &&
                        recovery.id == shard;
                    });
                success(new ShardStats(shard, index, shardRecoveries[0]));
              }
            } catch (exception) {
              DebugService.debug('Error parsing output:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting shard stats data:', response);
            error(response);
          }
      );
    };

    this.fetchAliases = function(success, error) {
      var createAliases = function(response) {
        var indices = Object.keys(response);
        var allAliases = [];
        indices.forEach(function(index) {
          var indexAliases = response[index].aliases;
          if (indexAliases && Object.keys(indexAliases).length > 0) {
            var aliases = Object.keys(indexAliases).map(function(alias) {
              var info = indexAliases[alias];
              return new Alias(alias, index, info.filter, info.index_routing,
                  info.search_routing);
            });
            allAliases.push(new IndexAliases(index, aliases));
          }
        });
        success(allAliases);
      };
      this.clusterRequest('GET', '/_aliases', {}, {}, createAliases, error);
    };

    function analyze(index, body, success, error) {
      var buildTokens = function(response) {
        var tokens = response.tokens.map(function(t) {
          return new Token(t.token, t.start_offset, t.end_offset, t.position);
        });
        success(tokens);
      };
      var path = '/' + encode(index) + '/_analyze';
      instance.clusterRequest('POST', path, {}, body, buildTokens, error);
    }

    this.analyzeByField = function(index, field, text, success, error) {
      analyze(index, {text: text, field: field}, success, error);
    };

    this.analyzeByAnalyzer = function(index, analyzer, text, success, error) {
      analyze(index, {text: text, analyzer: analyzer}, success, error);
    };

    this.getIndexWarmers = function(index, warmer, success, error) {
      var path = '/' + encode(index) + '/_warmer/' + encode(warmer.trim());
      var parseWarmers = function(response) {
        var warmers = [];
        Object.keys(response).forEach(function(i) {
          var index = i;
          var indexWarmers = response[index].warmers;
          Object.keys(indexWarmers).forEach(function(warmerId) {
            warmers.push(new Warmer(warmerId, index, indexWarmers[warmerId]));
          });
        });
        success(warmers);
      };
      this.clusterRequest('GET', path, {}, {}, parseWarmers, error);
    };

    this.fetchPercolateQueries = function(index, query, success, error) {
      var path = '/' + encode(index) + '/.percolator/_search';
      var parsePercolators = function(response) {
        var collection = response.hits.hits.map(function(q) {
          return new PercolateQuery(q);
        });
        var from = query.from;
        var total = response.hits.total;
        var size = query.size;
        var percolators = new PercolatorsPage(from, size, total, collection);
        success(percolators);
      };
      var body = JSON.stringify(query);
      this.clusterRequest('POST', path, {}, body, parsePercolators, error);
    };

    this.getRepositories = function(success, error) {
      var parseRepositories = function(response) {
        var repositories = Object.keys(response).map(function(repository) {
          return new Repository(repository, response[repository]);
        });
        success(repositories);
      };
      var path = '/_snapshot/_all';
      this.clusterRequest('GET', path, {}, {}, parseRepositories, error);
    };

    this.getSnapshots = function(repository, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/_all';
      var parseSnapshots = function(response) {
        var snapshots = response.snapshots.map(function(snapshot) {
          return new Snapshot(snapshot);
        });
        success(snapshots);
      };
      this.clusterRequest('GET', path, {}, {}, parseSnapshots, error);
    };

    this.clusterRequest = function(method, path, params, data, success, error) {
      var url = this.connection.host + path;
      var config = {method: method, url: url, data: data, params: params};
      this.addAuth(config);
      $http(config).
          success(function(data, status, headers, config) {
            try {
              success(data);
            } catch (exception) {
              DebugService.debug('Error parsing REST API data:', exception);
              DebugService.debug('REST API output:', data);
              error(exception);
            }
          }).
          error(function(data, status, headers, config) {
            DebugService.debug('Error executing request:', config);
            DebugService.debug('REST API output:', data);
            error(data);
          });
    };

    this.getClusterDetail = function(success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(host + '/_cluster/state/master_node,routing_table,blocks/',
            params),
        $http.get(host + '/_stats/docs,store', params),
        $http.get(host + '/_nodes/stats/jvm,fs,os,process', params),
        $http.get(host + '/_cluster/settings', params),
        $http.get(host + '/_aliases', params),
        $http.get(host + '/_cluster/health', params),
        $http.get(host + '/_nodes/_all/os,jvm', params),
        $http.get(host, params),
      ]).then(
          function(responses) {
            try {
              var state = responses[0].data;
              var indexStats = responses[1].data;
              var nodesStats = responses[2].data;
              var settings = responses[3].data;
              var aliases = responses[4].data;
              var health = responses[5].data;
              var nodes = responses[6].data;
              var main = responses[7].data;
              var cluster = new Cluster(health, state, indexStats, nodesStats,
                  settings, aliases, nodes, main);
              success(cluster);
            } catch (exception) {
              DebugService.debug('Error parsing cluster data:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting cluster data:', response);
            error(response);
          }
      );
    };

    this.getBrokenClusterDetail = function(success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(host +
            '/_cluster/state/master_node,blocks?local=true',
            params),
        $http.get(host + '/_nodes/stats/jvm,fs,os?local=true', params),
        $http.get(host + '/_cluster/settings?local=true', params),
        $http.get(host + '/_cluster/health?local=true', params),
        $http.get(host + '/_nodes/_all/os,jvm?local=true', params)
      ]).then(
          function(responses) {
            try {
              var state = responses[0].data;
              var nodesStats = responses[1].data;
              var settings = responses[2].data;
              var health = responses[3].data;
              var nodes = responses[4].data;
              var cluster = new BrokenCluster(health, state, nodesStats,
                  settings, nodes);
              success(cluster);
            } catch (exception) {
              DebugService.debug('Error parsing cluster data:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting cluster data:', params);
            DebugService.debug('REST API output:', response);
            AlertService.error('Error requesting cluster data', response);
            instance.cluster = undefined;
          }
      );
    };

    this.getClusterDiagnosis = function(health, state, stats, hotthreads,
                                        success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      var requests = [];
      if (health) {
        requests.push($http.get(host + '/_cluster/health', params));
      }
      if (state) {
        requests.push($http.get(host + '/_cluster/state', params));
      }
      if (stats) {
        requests.push($http.get(host + '/_nodes/stats?all=true', params));
      }
      if (hotthreads) {
        requests.push($http.get(host + '/_nodes/hot_threads', params));
      }
      $q.all(requests).then(
          function(responses) {
            try {
              success(responses.map(function(response) {
                return response.data;
              }));
            } catch (exception) {
              error(exception);
            }
          },
          function(response) {
            error(response);
          }
      );
    };

    this.refresh = function() {
      if (this.isConnected()) {
        var threshold = (ExternalSettingsService.getRefreshRate() * 0.75);
        $timeout(function() {
          var start = new Date().getTime();
          if (instance.brokenCluster) {
            instance.getBrokenClusterDetail(
                function(brokenCluster) {
                  instance.cluster = brokenCluster;
                  if (instance.cluster.status !== 'red') {
                    DebugService.debug('Switching to normal mode');
                    instance.setBrokenCluster(false);
                  }
                },
                function(response) {
                  AlertService.error('Error loading cluster data', response);
                  instance.cluster = undefined;
                }
            );
          } else {
            instance.getClusterDetail(
                function(cluster) {
                  var end = new Date().getTime();
                  var took = end - start;
                  if (took >= threshold) {
                    AlertService.warn('Loading cluster information is taking ' +
                    'too long. Try increasing the refresh interval');
                  }
                  cluster.computeChanges(instance.cluster);
                  instance.cluster = cluster;
                  instance.alertClusterChanges();
                },
                function(response) {
                  if (response.status === 503) {
                    var message = 'No active master, switching to basic mode';
                    DebugService.debug(message);
                    AlertService.error(message);
                    instance.setBrokenCluster(true);
                  } else {
                    AlertService.error('Error loading cluster data', response);
                    instance.cluster = undefined;
                  }
                }
            );
          }

        }, 100);
      } else {
        this.cluster = undefined;
      }
    };

    /**
     * Sets the cluster state as broken and refreshes cluster state.
     * If cluster is broken, redirect view to nodes view
     * @param {Boolean} broken - indicates if cluster is broken
     */
    this.setBrokenCluster = function(broken) {
      instance.brokenCluster = broken;
      if (broken) {
        $location.path('nodes');
      }
      instance.refresh();
    };

    this.autoRefreshCluster = function() {
      this.refresh();
      var nextRefresh = function() {
        instance.autoRefreshCluster();
      };
      $timeout(nextRefresh, ExternalSettingsService.getRefreshRate());
    };

    /**
     * Adds authentication information/cookies to request params
     * @param {Object} config - request config
     */
    this.addAuth = function(config) {
      if (isDefined(this.connection.auth)) {
        config.headers = {Authorization: this.connection.auth};
      }
      if (this.connection.withCredentials) {
        config.withCredentials = true;
      }
    };

    return this;

  }]);

kopf.factory('ExplainService', ['$TreeDnDConvert',
  function($TreeDnDConvert) {
    function containsString(value, searched) {
      return value.indexOf(searched) >= 0;
    }
    this.isExplainPath = function(path) {
      return path &&
           (containsString(path, '_explain') ||
            containsString(path, '?explain') ||
            containsString(path, 'explain=true'));
    };
    /**
     * Normalize Get document by id and Document search responses.
     * Build explanation tree for TreeDnd directive.
     */
    this.normalizeExplainResponse = function(response) {
      var lHits;
      if (response.hits) {
        // Explain query
        lHits = response.hits.hits;
        // Remove hits from main response
        delete response.hits.hits;
      } else {
        // Explain document
        lHits = [response];
      }
      lHits.forEach(function(lHit) {
        // Sometimes ._explanation, .sometimes explanation, let's normalize it
        if (lHit.explanation) {
          var lExplanation = lHit.explanation;
          delete response.explanation;
          response._explanation = lExplanation;
        }
        lHit.documentId = lHit._index + '/' + lHit._type + '/' + lHit._id;
        if (lHit._explanation) {
          if (!lHit._score) {
            lHit._score = lHit._explanation.value;
          }
          lHit.explanationTreeData =
            $TreeDnDConvert.tree2tree([lHit._explanation], 'details');
        }
      });
      return lHits;
    };

    return this;
  }]);

kopf.factory('ExternalSettingsService', ['DebugService',
  function(DebugService) {

    var KEY = 'kopfSettings';

    var ES_ROOT_PATH = 'elasticsearch_root_path';

    var WITH_CREDENTIALS = 'with_credentials';

    var REFRESH_RATE = 'refresh_rate';

    var THEME = 'theme';

    var UPDATABLE_SETTINGS = [REFRESH_RATE, THEME];

    this.settings = null;

    this.getSettings = function() {
      if (!isDefined(this.settings)) {
        this.settings = this.fetchSettings();
        var localSettings = this.loadLocalSettings();
        this.updateSettings(localSettings);
      }
      return this.settings;
    };

    this.fetchSettings = function() {
      var settings = {};
      var params = {
        type: 'GET',
        url: './kopf_external_settings.json',
        dataType: 'json',
        async: false
      };
      var settingsFuture = $.ajax(params);
      settingsFuture.done(function(data) {
        try {
          Object.keys(data).forEach(function(setting) {
            settings[setting] = data[setting];
          });
        } catch (error) {
          throw {
            message: 'Error processing external settings',
            body: data
          };
        }
      });
      settingsFuture.fail(function(error) {
        throw {
          message: 'Error fetching external settings from file',
          body: error
        };
      });
      return settings;
    };

    this.getElasticsearchRootPath = function() {
      return this.getSettings()[ES_ROOT_PATH];
    };

    this.withCredentials = function() {
      return this.getSettings()[WITH_CREDENTIALS];
    };

    this.getRefreshRate = function() {
      return this.getSettings()[REFRESH_RATE];
    };

    this.setRefreshRate = function(rate) {
      this.getSettings()[REFRESH_RATE] = rate;
      this.saveSettings();
    };

    this.getTheme = function() {
      return this.getSettings()[THEME];
    };

    this.setTheme = function(theme) {
      this.getSettings()[THEME] = theme;
      this.saveSettings();
    };

    this.saveSettings = function() {
      var settings = {};
      for (var setting in this.settings) {
        if (UPDATABLE_SETTINGS.indexOf(setting) >= 0) {
          settings[setting] = this.settings[setting];
        }
      }
      localStorage.setItem(KEY, JSON.stringify(settings));
    };

    this.loadLocalSettings = function() {
      var settings = {};
      try {
        var content = localStorage.getItem(KEY);
        if (content) {
          settings = JSON.parse(content);
        }
      } catch (error) {
        DebugService.debug('Error while loading settings from local storage');
      }
      return settings;
    };

    this.updateSettings = function(settings) {
      if (settings) {
        for (var setting in settings) {
          if (UPDATABLE_SETTINGS.indexOf(setting) >= 0) {
            this.settings[setting] = settings[setting];
          }
        }
      }
    };

    return this;

  }]);

kopf.factory('HostHistoryService', function() {

  this.getHostHistory = function() {
    var history = localStorage.getItem('kopfHostHistory');
    history = isDefined(history) ? history : '[]';
    return JSON.parse(history);
  };

  this.addToHistory = function(connection) {
    var host = connection.host.toLowerCase();
    var username = connection.username;
    var password = connection.password;
    if (username && password) {
      host = host.replace(/^(https|http):\/\//gi, function addAuth(prefix) {
        return prefix + username + ':' + password + '@';
      });
    }
    var entry = {host: host};
    var history = this.getHostHistory();
    for (var i = 0; i < history.length; i++) {
      if (history[i].host === host) {
        history.splice(i, 1);
        break;
      }
    }
    history.splice(0, 0, entry);
    if (history.length > 10) {
      history.length = 10;
    }
    localStorage.setItem('kopfHostHistory', JSON.stringify(history));
  };

  this.clearHistory = function() {
    localStorage.removeItem('kopfHostHistory');
  };

  return this;

});

kopf.factory('PageService', ['ElasticService', 'DebugService', '$rootScope',
  '$document', function(ElasticService, DebugService, $rootScope, $document) {

    var instance = this;

    this.clusterStatus = undefined;
    this.clusterName = undefined;

    this.link = $document[0].querySelector('link[rel~=\'icon\']');

    if (this.link) {
      var faviconUrl = this.link.href;
      var img = $document[0].createElement('img');
      img.src = faviconUrl;
    }

    $rootScope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(cluster, oldValue) {
          instance.setFavIconColor(cluster ? cluster.status : undefined);
          instance.setPageTitle(cluster ? cluster.name : undefined);
        }
    );

    /**
     * Updates page title if name is different than clusterName
     *
     * @param {string} name - cluster name
     */
    this.setPageTitle = function(name) {
      if (name !== this.clusterName) {
        if (name) {
          $rootScope.title = 'kopf[' + name + ']';
        } else {
          $rootScope.title = 'kopf - no connection';
        }
        this.clusterName = name;
      }
    };

    this.setFavIconColor = function(status) {
      if (this.link && this.clusterStatus !== status) {
        this.clusterStatus = status;
        try {
          var colors = {green: '#468847', yellow: '#c09853', red: '#B94A48'};
          var color = status ? colors[status] : '#333';
          var canvas = $document[0].createElement('canvas');
          canvas.width = 32;
          canvas.height = 32;
          var context = canvas.getContext('2d');
          context.drawImage(img, 0, 0);
          context.globalCompositeOperation = 'source-in';
          context.fillStyle = color;
          context.fillRect(0, 0, 32, 32);
          context.fill();
          this.link.type = 'image/x-icon';
          this.link.href = canvas.toDataURL();
        } catch (exception) {
          DebugService.debug('Error while changing favicon', exception);
        }
      }
    };

    return this;

  }]);

kopf.factory('AppState', function() {

  this.properties = {};

  this.getProperty = function(controller, property, defaultValue) {
    if (this.properties[controller] === undefined) {
      this.properties[controller] = {};
    }
    if (this.properties[controller][property] === undefined) {
      this.properties[controller][property] = defaultValue;
    }
    return this.properties[controller][property];
  };

  return this;

});

function readablizeBytes(bytes) {
  if (bytes > 0) {
    var s = ['b', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + s[e];
  } else {
    return 0;
  }
}

// Gets the value of a nested property from an object if it exists.
// Otherwise returns the default_value given.
// Example: get the value of object[a][b][c][d]
// where property_path is [a,b,c,d]
function getProperty(object, propertyPath, defaultValue) {
  if (isDefined(object)) {
    if (isDefined(object[propertyPath])) {
      return object[propertyPath];
    }
    var pathParts = propertyPath.split('.'); // path as nested properties
    for (var i = 0; i < pathParts.length && isDefined(object); i++) {
      object = object[pathParts[i]];
    }
  }
  return isDefined(object) ? object : defaultValue;
}

// Checks if value is both non null and undefined
function isDefined(value) {
  return value !== null && typeof value != 'undefined';
}

// Checks if the String representation of value is a non empty string
// string.trim().length is grater than 0
function notEmpty(value) {
  return isDefined(value) && value.toString().trim().length > 0;
}

function isNumber(value) {
  var exp = /\d+/;
  return exp.test(value);
}

// Returns the given date as a String formatted as hh:MM:ss
function getTimeString(date) {
  var hh = ('0' + date.getHours()).slice(-2);
  var mm = ('0' + date.getMinutes()).slice(-2);
  var ss = ('0' + date.getSeconds()).slice(-2);
  return hh + ':' + mm + ':' + ss;
}
