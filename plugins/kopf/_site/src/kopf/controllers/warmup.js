function WarmupController($scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {
	$scope.editor = undefined;
	$scope.indices = [];
	$scope.index = null;
	$scope.pagination = new WarmersPagination(1, []);
	
	// holds data for new warmer. maybe create a model for that
	$scope.new_warmer_id = '';
	$scope.new_index = '';
	$scope.new_source = '';
	$scope.new_types = '';
	
	$scope.$on('loadWarmupEvent', function() {
		$scope.loadIndices();
		$scope.initEditor();
	});
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('warmup-query-editor');
		}
	};

	$scope.totalWarmers=function() {
		return $scope.pagination.total();
	};
	
	$scope.loadIndices=function() {
		$scope.indices = $scope.cluster.indices;
	};
	
	$scope.createWarmerQuery=function() {
		if ($scope.editor.hasContent()) {
			$scope.editor.format();
			if (!isDefined($scope.editor.error)) {
				$scope.client.registerWarmupQuery($scope.new_index.name, $scope.new_types, $scope.new_warmer_id, $scope.editor.getValue(),
					function(response) {
						$scope.updateModel(function() {
							$scope.loadIndexWarmers();
							AlertService.success("Warmup query successfully registered", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Request did not return a valid JSON", error);
						});
					}
				);
			}
		} else {
			AlertService.error("Warmup query body can't be empty");
		}
	};
	
	$scope.deleteWarmupQuery=function(warmer_id, source) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + warmer_id + "?",
			source,
			"Delete",
			function() {
				$scope.client.deleteWarmupQuery($scope.index.name, warmer_id,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Warmup query successfully deleted", response);
							$scope.loadIndexWarmers();
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting warmup query", error);
						});
					}
				);
			}
		);
	};
	
	$scope.loadIndexWarmers=function() {
		if (isDefined($scope.index)) {
			$scope.client.getIndexWarmers($scope.index.name, $scope.pagination.warmer_id,
				function(response) {
					$scope.updateModel(function() {
						if (isDefined(response[$scope.index.name])) {
							$scope.pagination.setResults(response[$scope.index.name].warmers);
						} else {
							$scope.pagination.setResults([]);
						}
					});
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while fetching warmup queries", error);
					});
				}
			);
		} else {
			$scope.pagination.setResults([]);
		}
	};
	
}