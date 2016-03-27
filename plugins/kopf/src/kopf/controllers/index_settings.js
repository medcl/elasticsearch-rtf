kopf.controller('IndexSettingsController', ['$scope', '$location',
  'AlertService', 'ElasticService',
  function($scope, $location, AlertService, ElasticService) {

    $scope.index = null;
    $scope.settings = null;
    $scope.editable_settings = null;

    $scope.save = function() {
      var index = $scope.index;
      var settings = $scope.settings;
      var newSettings = {};
      var editableSettings = $scope.editable_settings;
      // TODO: could move that to editable_index_settings model
      editableSettings.valid_settings.forEach(function(setting) {
        if (notEmpty(editableSettings[setting])) {
          newSettings[setting] = editableSettings[setting];
        }
      });
      ElasticService.updateIndexSettings(index,
          JSON.stringify(newSettings, undefined, ''),
          function(response) {
            AlertService.success('Index settings were successfully updated',
                response);
            ElasticService.refresh();
          },
          function(error) {
            AlertService.error('Error while updating index settings', error);
          }
      );
    };

    $scope.initializeController = function() {
      var index = $location.search().index;
      ElasticService.getIndexMetadata(index,
          function(metadata) {
            $scope.index = index;
            $scope.settings = metadata.settings;
            $scope.editable_settings = new EditableIndexSettings(
                $scope.settings
            );
          },
          function(error) {
            AlertService.error('Error while loading index settings for [' +
                    index + ']',
                error);
          }
      );
    };

  }
]);
