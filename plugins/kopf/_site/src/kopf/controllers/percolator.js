kopf.controller('PercolatorController', ['$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, ConfirmDialogService, AlertService, AceEditorService, ElasticService) {
	$scope.editor = undefined;
	$scope.pagination = new PercolatorsPage(0, 0, 0, []);

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
		$scope.loadPercolatorQueries(this.pagination.previousOffset());
	};
	
	$scope.nextPage=function() {
		$scope.loadPercolatorQueries(this.pagination.nextOffset());
	};

	$scope.parseSearchParams=function() {
		var queries = [];
		if ($scope.id.trim().length > 0) {
			queries.push({"query_string":{ default_field: '_id', query: $scope.id}});
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
				ElasticService.client.deletePercolatorQuery(query.index, query.id,
					function(response) {
						var refreshIndex = query.index;
						ElasticService.client.refreshIndex(refreshIndex,
							function(response) {
                                AlertService.success("Query successfully deleted", response);
                                $scope.loadPercolatorQueries();
							},
							function(error) {
                                AlertService.error("Error while reloading queries", error);
							}
						);
					},
					function(error) {
                        AlertService.error("Error while deleting query", error);
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
		ElasticService.client.createPercolatorQuery($scope.new_query,
			function(response) {
				var refreshIndex = $scope.new_query.index;
				ElasticService.client.refreshIndex(refreshIndex,
					function(response) {
                        AlertService.success("Percolator Query successfully created", response);
                        $scope.index = $scope.new_query.index;
                        $scope.loadPercolatorQueries(0);
					},
					function(error) {
                        AlertService.success("Error while reloading queries", error);
					}
				);
			},
			function(error) {
                AlertService.error("Error while creating percolator query", error);
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
	
	$scope.loadPercolatorQueries=function(from) {
		try {
            from = isDefined(from) ? from : 0;
			var queries = $scope.parseSearchParams();
            var body = { from: from, size: 10 };
			if (queries.length > 0) {
				body.query = { bool: { must: queries } };
			}
			ElasticService.client.fetchPercolateQueries($scope.index, body,
				function(percolators) {
                    $scope.pagination = percolators;
				},
				function(error) {
                    AlertService.error("Error while reading loading percolate queries", error);
				}
			);
		} catch (error) {
			AlertService.error("Filter is not a valid JSON");
		}
	};
	
}]);
