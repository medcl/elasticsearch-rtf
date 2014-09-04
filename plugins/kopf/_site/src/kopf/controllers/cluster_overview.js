kopf.controller('ClusterOverviewController', ['$scope', 'IndexSettingsService', 'ConfirmDialogService', 'AlertService', 'ElasticService', function($scope, IndexSettingsService, ConfirmDialogService, AlertService, ElasticService) {

    $scope.index_paginator = new Paginator(1, 5, [], new IndexFilter("","", true, 0));

    $scope.page = $scope.index_paginator.getPage();

    $scope.node_filter = new NodeFilter("", true, true, true, 0);

    $scope.nodes = [];

    $scope.$watch('cluster', function(cluster, previous) {
        if (isDefined(cluster)) {
            $scope.setIndices(cluster.indices);
            $scope.setNodes($scope.cluster.nodes);
        } else {
            $scope.setIndices([]);
            $scope.setNodes([]);
        }
    });

    $scope.$watch('index_paginator', function(filter, previous) {
        if (isDefined($scope.cluster)) {
            $scope.setIndices($scope.cluster.indices);
        } else {
            $scope.setIndices([]); // could it even happen?
        }
    }, true);

    $scope.$watch('node_filter', function(filter, previous) {
        if (isDefined($scope.cluster)) {
            $scope.setNodes($scope.cluster.nodes);
        } else {
            $scope.setNodes([]);
        }
    }, true);

    $scope.setNodes=function(nodes) {
        $scope.nodes = nodes.filter(function(node) { return $scope.node_filter.matches(node); });
    };

    $scope.setIndices=function(indices) {
        $scope.index_paginator.setCollection(indices);
        $scope.page = $scope.index_paginator.getPage();
    };

	$scope.closeModal=function(forced_refresh){
		if (forced_refresh) {
			$scope.refreshClusterState();
		}
	};
	
	$scope.shutdownNode=function(node_id) {
        ElasticService.client.shutdownNode(node_id,
            function(response) {
                AlertService.success("Node [" + node_id + "] successfully shutdown", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while shutting down node",error);
            }
        );
    };

    $scope.promptShutdownNode=function(node_id, node_name) {
        ConfirmDialogService.open(
			"are you sure you want to shutdown node " + node_name + "?",
			"Shutting down a node will make all data stored in this node inaccessible, unless this data is replicated across other nodes." +
			"Replicated shards will be promoted to primary if the primary shard is no longer reachable.",
			"Shutdown",
			function() { $scope.shutdownNode(node_id); }
		);
	};

	$scope.optimizeIndex=function(index) {
        ElasticService.client.optimizeIndex(index,
            function(response) {
                AlertService.success("Index was successfully optimized", response);
            },
            function(error) {
                AlertService.error("Error while optimizing index", error);
            }
        );
    };

    $scope.promptOptimizeIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to optimize index " + index + "?",
			"Optimizing an index is a resource intensive operation and should be done with caution."+
			"Usually, you will only want to optimize an index when it will no longer receive updates",
			"Optimize",
			function() { $scope.optimizeIndex(index); }
		);
	};
	
	$scope.deleteIndex=function(index) {
        ElasticService.client.deleteIndex(index,
            function(response) {
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while deleting index", error);
            }
        );
    };

    $scope.promptDeleteIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to delete index " + index + "?",
			"Deleting an index cannot be undone and all data for this index will be lost",
			"Delete",
			function() { $scope.deleteIndex(index); }
		);
	};
	
	$scope.clearCache=function(index) {
        ElasticService.client.clearCache(index,
            function(response) {
                AlertService.success("Index cache was successfully cleared", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while clearing index cache", error);
            }
        );
    };

    $scope.promptClearCache=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to clear the cache for index " + index + "?",
			"This will clear all caches for this index.",
			"Clear",
			function() { $scope.clearCache(index); }
		);
	};

	$scope.refreshIndex=function(index) {
        ElasticService.client.refreshIndex(index,
            function(response) {
                AlertService.success("Index was successfully refreshed", response);
            },
            function(error) {
                AlertService.error("Error while refreshing index", error);
            }
        );
    };

    $scope.promptRefreshIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to refresh index " + index + "?",
			"Refreshing an index makes all operations performed since the last refresh available for search.",
			"Refresh",
			function() { $scope.refreshIndex(index); }
		);
	};
	
	$scope.enableAllocation=function() {
		ElasticService.client.enableShardAllocation(
			function(response) {
                AlertService.success("Shard allocation was successfully enabled", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while enabling shard allocation", error);
			}
		);
	};
	
	$scope.disableAllocation=function() {
		ElasticService.client.disableShardAllocation(
			function(response) {
                AlertService.success("Shard allocation was successfully disabled", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while disabling shard allocation", error);
			}
		);
	};
	
	$scope.closeIndex=function(index) {
        ElasticService.client.closeIndex(index,
            function(response) {
                AlertService.success("Index was successfully closed", response);
                $scope.refreshClusterState();
            },
            function(error) { AlertService.error("Error while closing index", error); }
        );
    };

    $scope.promptCloseIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to close index " + index + "?",
			"Closing an index will remove all it's allocated shards from the cluster. " +
			"Both searches and updates will no longer be accepted for the index." +
			"A closed index can be reopened at any time",
			"Close index",
            function() { $scope.closeIndex(index); }
		);
	};

    $scope.openIndex=function(index) {
        ElasticService.client.openIndex(index,
            function(response) {
                AlertService.success("Index was successfully opened", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while opening index", error);
            }
        );
    };

    $scope.promptOpenIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to open index " + index + "?",
			"Opening an index will trigger the recovery process for the index. " +
			"This process could take sometime depending on the index size.",
			"Open index",
			function() { $scope.openIndex(index); }
		);
	};
	
	$scope.loadIndexSettings=function(index) {
		$('#index_settings_option a').tab('show');
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                IndexSettingsService.loadSettings(index, metadata.settings);
                $('#idx_settings_tabs a:first').tab('show');
                $(".setting-info").popover();
            },
            function(error) {
                AlertService.error("Error while loading index settings", error);
            }
        );
	};

    $scope.showIndexSettings=function(index) {
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                $scope.displayInfo('settings for index ' + index, metadata.settings);
            },
            function(error) {
                AlertService.error("Error while loading index settings", error);
            }
        );
    };

    $scope.showIndexMappings=function(index) {
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                $scope.displayInfo('mappings for index ' + index, metadata.mappings);
            },
            function(error) {
                AlertService.error("Error while loading index mappings", error);
            }
        );
    };

}]);