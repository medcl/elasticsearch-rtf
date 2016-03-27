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
