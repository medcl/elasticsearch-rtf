kopf.controller('IndexSettingsController', ['$scope', '$location', '$timeout', 'IndexSettingsService', 'AlertService', 'ElasticService', function($scope, $location, $timeout, IndexSettingsService, AlertService, ElasticService) {
	$scope.service = IndexSettingsService;

	$scope.save=function() {
        var index = $scope.service.index;
		var settings = $scope.service.settings;
		var new_settings = {};
        var editable_settings = $scope.service.editable_settings;
		// TODO: could move that to editable_index_settings model
		editable_settings.valid_settings.forEach(function(setting) {
			if (notEmpty(editable_settings[setting])) {
				new_settings[setting] = editable_settings[setting];
			}
		});
		ElasticService.client.updateIndexSettings(index, JSON.stringify(new_settings, undefined, ""),
			function(response) {
                AlertService.success("Index settings were successfully updated", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while updating index settings", error);
			}
		);
	};
 }]);