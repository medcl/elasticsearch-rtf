function IndexSettingsController($scope, $location, $timeout, IndexSettingsService, AlertService) {
	$scope.service = IndexSettingsService;

	$scope.save=function() {
		var index = $scope.service.index;
		var new_settings = {};
		// TODO: could move that to editable_index_settings model
		index.editable_settings.valid_settings.forEach(function(setting) {
			if (notEmpty(index.editable_settings[setting])) {
				new_settings[setting] = index.editable_settings[setting];
			}
		});
		$scope.client.updateIndexSettings(index.name, JSON.stringify(new_settings, undefined, ""),
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Index settings were successfully updated", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating index settings", error);
				});
			}
		);
	};
 }