function PercolatorController($scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {
	$scope.editor = undefined;
	$scope.total = 0;
	$scope.queries = [];
	$scope.page = 1;
	$scope.filter = "";
	$scope.id = "";
	
	$scope.index = null;
	$scope.indices = [];
	$scope.new_query = new PercolateQuery({});
	
	$scope.$on('loadPercolatorEvent', function() {
		$scope.indices = $scope.cluster.indices;
		$scope.initEditor();
    });
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('percolator-query-editor');
		}
	};

	$scope.previousPage=function() {
		$scope.page -= 1;
		$scope.loadPercolatorQueries();
	};
	
	$scope.nextPage=function() {
		$scope.page += 1;
		$scope.loadPercolatorQueries();
	};
	
	$scope.hasNextPage=function() {
		return $scope.page * 10 < $scope.total;
	};
	
	$scope.hasPreviousPage=function() {
		return $scope.page > 1;
	};
	
	$scope.firstResult=function() {
		return $scope.total > 0 ? ($scope.page - 1) * 10  + 1 : 0;
	};
	
	$scope.lastResult=function() {
		return $scope.hasNextPage() ? $scope.page * 10 : $scope.total;
	};
	
	$scope.parseSearchParams=function() {
		var queries = [];
		if ($scope.id.trim().length > 0) {
			queries.push({"term":{"_id":$scope.id}});
		}
		if ($scope.filter.trim().length > 0) {
			var filter = JSON.parse($scope.filter);
			Object.keys(filter).forEach(function(field) {
				var q = {};
				q[field] = filter[field];
				queries.push({"term": q});
			});
		}
		return queries;
	};
	
	$scope.deletePercolatorQuery=function(query) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + query.id + " for index " + query.index + "?",
			query.sourceAsJSON(),
			"Delete",
			function() {
				$scope.client.deletePercolatorQuery(query.index, query.id,
					function(response) {
						var refreshIndex = $scope.client.is1() ? query.index : '_percolator';
						$scope.client.refreshIndex(refreshIndex,
							function(response) {
								$scope.updateModel(function() {
									AlertService.success("Query successfully deleted", response);
									$scope.loadPercolatorQueries();
								});
							},
							function(error) {
								$scope.updateModel(function() {
									AlertService.error("Error while reloading queries", error);
								});
							}
						);
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting query", error);
						});
					}
				);
			}
		);
	};
	
	$scope.createNewQuery=function() {
		if (!notEmpty($scope.new_query.index) || !notEmpty($scope.new_query.id)) {
			AlertService.error("Both index and query id must be specified");
			return;
		}
		
		$scope.new_query.source = $scope.editor.format();
		if (isDefined($scope.editor.error)) {
			AlertService.error("Invalid percolator query");
			return;
		}
		
		if (!notEmpty($scope.new_query.source)) {
			AlertService.error("Query must be defined");
			return;
		}
		$scope.client.createPercolatorQuery($scope.new_query.index, $scope.new_query.id, $scope.new_query.source,
			function(response) {
				var refreshIndex = $scope.client.is1() ? $scope.new_query.index : '_percolator';
				$scope.client.refreshIndex(refreshIndex,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Percolator Query successfully created", response);
							$scope.index = $scope.new_query.index;
							$scope.loadPercolatorQueries();
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.success("Error while reloading queries", error);
						});
					}
				);
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while creating percolator query", error);
				});
			}
		);
	};
	
	$scope.searchPercolatorQueries=function() {
		if (isDefined($scope.index)) {
			$scope.loadPercolatorQueries();
		} else {
			AlertService.info("No index is selected");
		}
	};
	
	$scope.loadPercolatorQueries=function() {
		var params = {};
		try {
			var queries = $scope.parseSearchParams();
			if (queries.length > 0) {
				params.query = {"bool": {"must": queries}};
			}
			params.from = (($scope.page - 1) * 10);
			$scope.client.fetchPercolateQueries($scope.index, JSON.stringify(params),
				function(response) {
					$scope.updateModel(function() {
						$scope.total = response.hits.total;
						$scope.queries = response.hits.hits.map(function(q) { return new PercolateQuery(q); });
					});
				},
				function(error) {
					if (!(isDefined(error.responseJSON) && error.responseJSON.error == "IndexMissingException[[_percolator] missing]")) {
						$scope.updateModel(function() {
							AlertService.error("Error while reading loading percolate queries", error);
						});
					}
				}
			);
		} catch (error) {
			AlertService.error("Filter is not a valid JSON");
			return;
		}
	};
	
}

function PercolateQuery(query_info) {
	// FIXME: 0.90/1.0 check
	if (query_info._index == '_percolator') {
		this.index = query_info._type;
	} else {
		this.index = query_info._index;
	}
	this.id = query_info._id;
	this.source = query_info._source;
	
	this.sourceAsJSON=function() {
		try {
			return JSON.stringify(this.source,undefined, 2);
		} catch (error) {

		}
	};
	
	this.equals=function(other) {
		return (other instanceof PercolateQuery &&
			this.index == other.index &&
			this.id == other.id && 
			this.source == other.source);
	};
}