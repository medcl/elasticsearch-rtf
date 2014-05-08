function ClusterSettingsController($scope, $location, $timeout, AlertService) {

	$scope.$on('loadClusterSettingsEvent', function() {
		$('#cluster_settings_option a').tab('show');
		$('#cluster_settings_tabs a:first').tab('show');
		$(".setting-info").popover();
		$scope.active_settings = "transient"; // remember last active?
		$scope.settings = new ClusterSettings($scope.cluster.settings);
	});

	$scope.save=function() {
		var response = $scope.client.updateClusterSettings(JSON.stringify($scope.settings, undefined, ""),
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Cluster settings were successfully updated",response);
				});
				$scope.refreshClusterState();
			}, 
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating cluster settings",error);
				});
			}
		);
	};
}