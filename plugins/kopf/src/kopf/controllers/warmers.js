kopf.controller('WarmersController', [
  '$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService',
  'ElasticService',
  function($scope, ConfirmDialogService, AlertService, AceEditorService,
           ElasticService) {
    $scope.editor = undefined;
    $scope.indices = [];
    $scope.index = null;
    $scope.paginator = new Paginator(1, 10, [], new WarmerFilter(''));
    $scope.page = $scope.paginator.getPage();

    $scope.warmer = new Warmer('', '', {types: [], source: {}});

    $scope.warmers = [];

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getIndices();
        },
        true
    );

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('warmer-editor');
      }
    };

    $scope.createWarmer = function() {
      if ($scope.editor.hasContent()) {
        $scope.editor.format();
        if (!isDefined($scope.editor.error)) {
          $scope.warmer.source = $scope.editor.getValue();
          ElasticService.registerWarmer($scope.warmer,
              function(response) {
                $scope.loadIndexWarmers();
                AlertService.success('Warmer successfully created', response);
              },
              function(error) {
                AlertService.error('Request returned invalid JSON', error);
              }
          );
        }
      } else {
        AlertService.error('Warmer query can\'t be empty');
      }
    };

    $scope.deleteWarmer = function(warmer) {
      ConfirmDialogService.open(
          'are you sure you want to delete warmer ' + warmer.id + '?',
          warmer.source,
          'Delete',
          function() {
            ElasticService.deleteWarmer(warmer, // FIXME: better send name + id
                function(response) {
                  AlertService.success('Warmer successfully deleted', response);
                  $scope.loadIndexWarmers();
                },
                function(error) {
                  AlertService.error('Error while deleting warmer', error);
                }
            );
          }
      );
    };

    $scope.loadIndexWarmers = function() {
      if (isDefined($scope.index)) {
        ElasticService.getIndexWarmers($scope.index, '',
            function(warmers) {
              $scope.paginator.setCollection(warmers);
              $scope.page = $scope.paginator.getPage();
            },
            function(error) {
              $scope.paginator.setCollection([]);
              $scope.page = $scope.paginator.getPage();
              AlertService.error('Error while fetching warmers', error);
            }
        );
      } else {
        $scope.paginator.setCollection([]);
        $scope.page = $scope.paginator.getPage();
      }
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
      $scope.initEditor();
    };

  }
]);
