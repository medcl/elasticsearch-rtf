kopf.controller('CreateIndexController', ['$scope', 'AlertService',
  'ElasticService', 'AceEditorService',
  function($scope, AlertService, ElasticService, AceEditorService) {

    $scope.source_index = null;
    $scope.shards = '';
    $scope.replicas = '';
    $scope.name = '';
    $scope.indices = [];

    $scope.initializeController = function() {
      $('#create_index_option a').tab('show');
      $scope.prepareCreateIndex();
    };

    $scope.updateEditor = function() {
      ElasticService.getIndexMetadata($scope.source_index,
          function(meta) {
            var body = {settings: meta.settings, mappings: meta.mappings};
            $scope.editor.setValue(JSON.stringify(body, null, 2));
          },
          function(error) {
            AlertService.error('Error while loading index settings', error);
          }
      );
    };

    $scope.createIndex = function() {
      if ($scope.name.trim().length === 0) {
        AlertService.error('You must specify a valid index name');
      } else {
        var bodyString = $scope.editor.format();
        if (isDefined($scope.editor.error)) {
          AlertService.error('Invalid JSON: ' + $scope.editor.error);
        } else {
          var body = JSON.parse(bodyString);
          if (Object.keys(body).length === 0) {
            body = {settings: {index: {}}};
            if ($scope.shards.trim().length > 0) {
              body.settings.index.number_of_shards = $scope.shards;
            }
            if ($scope.replicas.trim().length > 0) {
              body.settings.index.number_of_replicas = $scope.replicas;
            }
            bodyString = JSON.stringify(body);
          }
          ElasticService.createIndex($scope.name, bodyString,
              function(response) {
                ElasticService.refresh();
              },
              function(error) {
                AlertService.error('Error while creating index', error);
              }
          );
        }
      }
    };

    $scope.prepareCreateIndex = function() {
      if (!isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('index-settings-editor');
      }
      $scope.indices = ElasticService.getIndices();
      $scope.source_index = null;
      $scope.editor.setValue('{}');
      $scope.shards = '';
      $scope.name = '';
      $scope.replicas = '';
    };
  }
]);
