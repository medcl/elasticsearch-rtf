kopf.controller('AnalysisController', ['$scope', '$location', '$timeout', 'AlertService', 'ElasticService', function($scope, $location, $timeout, AlertService, ElasticService) {

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

    $scope.$watch('field_index', function(current, previous) {
        if (isDefined(current)) {
            $scope.loadIndexTypes(current.name);
        }
    });

    $scope.loadIndexTypes=function(index) {
        $scope.field_type = '';
        $scope.field_field = '';
        if (notEmpty(index)) {
            ElasticService.client.getIndexMetadata(index,
                function(metadata) {
                    $scope.field_index_metadata = metadata;
                },
                function(error) {
                    $scope.field_index = '';
                    AlertService.error("Error while loading index metadata", error);
                }
            );
        }
    };

    $scope.$watch('analyzer_index', function(current, previous) {
        if (isDefined(current)) {
            $scope.loadIndexAnalyzers(current.name);
        }
    });

    $scope.loadIndexAnalyzers=function(index) {
        $scope.analyzer_analyzer = '';
        if (notEmpty(index)) {
            ElasticService.client.getIndexMetadata(index,
                function(metadata) {
                    $scope.analyzer_index_metadata = metadata;
                },
                function(error) {
                    $scope.analyzer_index = '';
                    AlertService.error("Error while loading index metadata", error);
                }
            );
        }
    };


	$scope.analyzeByField=function() {
		if ($scope.field_field.length > 0 && $scope.field_text.length > 0) {
			$scope.field_tokens = null;
			ElasticService.client.analyzeByField($scope.field_index.name,$scope.field_type,$scope.field_field,$scope.field_text, 
				function(response) {
                    $scope.field_tokens = response;
				},
				function(error) {
                    $scope.field_tokens = null;
                    AlertService.error("Error while analyzing text", error);
				}
			);
		}
	};
	
	$scope.analyzeByAnalyzer=function() {
		if ($scope.analyzer_analyzer.length > 0 && $scope.analyzer_text.length > 0) {
			$scope.analyzer_tokens = null;
			ElasticService.client.analyzeByAnalyzer($scope.analyzer_index.name,$scope.analyzer_analyzer,$scope.analyzer_text,
				function(response) {
					$scope.analyzer_tokens = response;
				},
				function(error) {
                    $scope.analyzer_tokens = null;
                    AlertService.error("Error while analyzing text", error);
				}
			);
		}
	};
	
	$scope.$on('loadAnalysisEvent', function() {
		$scope.indices = $scope.cluster.open_indices();
	});
	
}]);