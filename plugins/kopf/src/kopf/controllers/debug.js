kopf.controller('DebugController', ['$scope', 'DebugService',
  function($scope, DebugService) {

    $scope.messages = [];

    $scope.visible = false;

    $scope.$watch(
        function() {
          return $scope.visible ? DebugService.getUpdatedAt() : 0;
        },
        function(newValue, oldValue) {
          $scope.messages = $scope.visible ? DebugService.getMessages() : [];
        }
    );

  }

]);
