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
