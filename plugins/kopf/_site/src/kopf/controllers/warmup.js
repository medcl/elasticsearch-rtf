kopf.controller('WarmupController', ['$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, ConfirmDialogService, AlertService, AceEditorService, ElasticService) {
	$scope.editor = undefined;
	$scope.indices = [];
	$scope.index = null;
	$scope.paginator = new Paginator(1, 10, [], new WarmerFilter(""));
    $scope.page = $scope.paginator.getPage();
	
	$scope.warmer = new Warmer('', '', { types: [], source: {} });

    $scope.warmers = [];

    $scope.$watch('paginator', function(filter, previous) {
        $scope.page = $scope.paginator.getPage();
    }, true);

	$scope.$on('loadWarmupEvent', function() {
		$scope.loadIndices();
		$scope.initEditor();
	});
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('warmup-query-editor');
		}
	};

	$scope.loadIndices=function() {
		$scope.indices = $scope.cluster.indices;
	};
	
	$scope.createWarmerQuery=function() {
		if ($scope.editor.hasContent()) {
			$scope.editor.format();
			if (!isDefined($scope.editor.error)) {
                $scope.warmer.source = $scope.editor.getValue();
				ElasticService.client.registerWarmupQuery($scope.warmer,
					function(response) {
                        $scope.loadIndexWarmers();
                        AlertService.success("Warmup query successfully registered", response);
					},
					function(error) {
                        AlertService.error("Request did not return a valid JSON", error);
					}
				);
			}
		} else {
			AlertService.error("Warmup query body can't be empty");
		}
	};
	
	$scope.deleteWarmupQuery=function(warmer) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + warmer.id + "?",
			warmer.source,
			"Delete",
			function() {
				ElasticService.client.deleteWarmupQuery(warmer,
					function(response) {
                        AlertService.success("Warmup query successfully deleted", response);
                        $scope.loadIndexWarmers();
					},
					function(error) {
                        AlertService.error("Error while deleting warmup query", error);
					}
				);
			}
		);
	};
	
	$scope.loadIndexWarmers=function() {
		if (isDefined($scope.index)) {
			ElasticService.client.getIndexWarmers($scope.index, "",
				function(warmers) {
                    $scope.paginator.setCollection(warmers);
                    $scope.page = $scope.paginator.getPage();
				},
				function(error) {
                    $scope.paginator.setCollection([]);
                    $scope.page = $scope.paginator.getPage();
                    AlertService.error("Error while fetching warmup queries", error);
				}
			);
		} else {
			$scope.paginator.setCollection([]);
            $scope.page = $scope.paginator.getPage();
		}
	};
	
}]);