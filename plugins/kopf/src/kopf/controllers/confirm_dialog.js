kopf.controller('ConfirmDialogController', ['$scope', 'ConfirmDialogService',
  function($scope, ConfirmDialogService) {

    $scope.dialog_service = ConfirmDialogService;

    $scope.close = function() {
      $scope.dialog_service.close();
    };

    $scope.confirm = function() {
      $scope.dialog_service.confirm();
    };

  }
]);
