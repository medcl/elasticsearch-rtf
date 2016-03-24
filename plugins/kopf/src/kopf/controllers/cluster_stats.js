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
