function ClusterOverviewController($scope, $location, $timeout, IndexSettingsService, ConfirmDialogService, AlertService, SettingsService) {
	$scope.settings_service = SettingsService;
	$scope.idxSettingsSrv = IndexSettingsService;
	$scope.dialog_service = ConfirmDialogService;
	$scope.pagination = new ClusterNavigation();
	$scope.previous_pagination = null;
	
	
	$scope.getNodes=function() {
		if (isDefined($scope.cluster)) {
			return $scope.cluster.getNodes($scope.pagination.node_name, $scope.pagination.data,$scope.pagination.master,$scope.pagination.client);	
		}
	};
	
	$scope.closeModal=function(forced_refresh){
		if (forced_refresh) {
			$scope.refreshClusterState();
		}
	};
	
	$scope.shutdown_node=function(node_id, node_name) {
		$scope.dialog_service.open(
			"are you sure you want to shutdown node " + node_name + "?",
			"Shutting down a node will make all data stored in this node inaccessible, unless this data is replicated across other nodes." +
			"Replicated shards will be promoted to primary if the primary shard is no longer reachable.",
			"Shutdown",
			function() {
				var response = $scope.client.shutdownNode(node_id,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Node [" + node_id + "] successfully shutdown", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while shutting down node",error);
						});
					}
				);
			}
		);
	};

	$scope.optimizeIndex=function(index){
		$scope.dialog_service.open(
			"are you sure you want to optimize index " + index + "?",
			"Optimizing an index is a resource intensive operation and should be done with caution."+
			"Usually, you will only want to optimize an index when it will no longer receive updates",
			"Optimize",
			function() {
				$scope.client.optimizeIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully optimized", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while optimizing index", error);
						});
					}				
				);
			}
		);
	};
	
	$scope.deleteIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to delete index " + index + "?",
			"Deleting an index cannot be undone and all data for this index will be lost",
			"Delete",
			function() {
				$scope.client.deleteIndex(index, 
					function(response) {
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting index", error);
						});
					}	
				);
			}
		);
	};
	
	$scope.clearCache=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to clear the cache for index " + index + "?",
			"This will clear all caches for this index.",
			"Clear",
			function() {
				$scope.client.clearCache(index,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index cache was successfully cleared", response);
						});
						$scope.refreshClusterState();						
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while clearing index cache", error);
						});
					}
				);
			}
		);
	};

	$scope.refreshIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to refresh index " + index + "?",
			"Refreshing an index makes all operations performed since the last refresh available for search.",
			"Refresh",
			function() {
				$scope.client.refreshIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully refreshed", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while refreshing index", error);	
						});
					}
				);
			}
		);
	};
	
	$scope.enableAllocation=function() {
		var response = $scope.client.enableShardAllocation(
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Shard allocation was successfully enabled", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while enabling shard allocation", error);	
				});
			}
		);
	};
	
	$scope.disableAllocation=function(current_state) {
		var response = $scope.client.disableShardAllocation(
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Shard allocation was successfully disabled", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while disabling shard allocation", error);	
				});
			}
		);
	};
	
	$scope.closeIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to close index " + index + "?",
			"Closing an index will remove all it's allocated shards from the cluster. " +
			"Both searches and updates will no longer be accepted for the index." +
			"A closed index can be reopened at any time",
			"Close index",
			function() {
				$scope.client.closeIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully closed", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while closing index", error);	
						});
					}
				);
			}
		);
	};
	
	$scope.openIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to open index " + index + "?",
			"Opening an index will trigger the recovery process for the index. " +
			"This process could take sometime depending on the index size.",
			"Open index",
			function() {
				$scope.client.openIndex(index,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully opened", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while opening index", error);
						});
					}
				);
			}
		);
	};
	
	$scope.loadIndexSettings=function(index) {
		$('#index_settings_option a').tab('show');
		var indices = $scope.cluster.indices.filter(function(i) {
			return i.name == index;
		});
		$scope.idxSettingsSrv.index = indices[0];
		$('#idx_settings_tabs a:first').tab('show');
		$(".setting-info").popover();		
	};
	
	
	$scope.firstResult=function() {
		if ($scope.getResults().length > 0) {
			return (($scope.current_page() - 1) * $scope.pagination.page_size) + 1;
		} else {
			return 0;
		}
	};
	
	$scope.lastResult=function() {
		if ($scope.current_page() * $scope.pagination.page_size > $scope.getResults().length) {
			return $scope.getResults().length;
		} else {
			return $scope.current_page() * $scope.pagination.page_size;
		}
	};

	$scope.hasNextPage=function() {
		return $scope.pagination.page_size * $scope.current_page() < $scope.getResults().length;
	};
	
	$scope.hasPreviousPage=function() {
		return $scope.current_page() > 1;
	};
	
	$scope.nextPage=function() {
		$scope.pagination.page += 1;
	};
	
	$scope.previousPage=function() {
		$scope.pagination.page -= 1;
	};
	
	$scope.total=function() {
		return $scope.getResults().length;
	};
	
	$scope.current_page=function() {
		if ($scope.pagination.query != $scope.pagination.previous_query) {
			$scope.pagination.previous_query = $scope.pagination.query;
			$scope.pagination.page = 1;
		}
		return $scope.pagination.page;
	};
	
	$scope.getPage=function() {
		var count = 1;
		var first_result = $scope.firstResult();
		var last_result = $scope.lastResult();
		var page = $.map($scope.getResults(),function(i) {
			if (count < first_result || count > last_result) {
				count += 1;
				return null;
			}
			count += 1;
			return i;
		});
		return page;
	};
	
	$scope.index=function(index) {
		var page = $scope.getPage();
		if (isDefined(page[index])) {
			return page[index];
		} else {
			return null;
		}
	};
	
	$scope.getResults=function() {
		if ($scope.cluster !== null && ($scope.pagination.cluster_timestamp === null || $scope.pagination.cluster_timestamp != $scope.cluster.created_at|| !$scope.pagination.equals($scope.previous_pagination))) {
			var indices = isDefined($scope.cluster) ? $scope.cluster.indices : [];
			var query = $scope.pagination.query;
			var state = $scope.pagination.state;
			var hide_special = $scope.pagination.hide_special;
			$scope.pagination.cached_result = $.map(indices,function(i) {
				if (hide_special && i.isSpecial()) {
					return null;
				}
				
				if (notEmpty(query)) {
					if (i.name.toLowerCase().indexOf(query.trim().toLowerCase()) == -1) {
						return null;
					} 
				}
				
				if (state.length > 0) {
					if (state == "unhealthy") {
						if (!i.unhealthy) {
							return null;							
						}
					} else if ((state == "open" || state == "close") && state != i.state) {
						return null;						
					}
				} 
				return i;
			});
			$scope.previous_pagination = $scope.pagination.clone();
			$scope.pagination.cluster_timestamp = $scope.cluster.created_at;
		}
		return $scope.pagination.cached_result;
	};
	
}