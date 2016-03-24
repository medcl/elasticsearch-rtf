function NavbarController($scope, $location, $timeout, AlertService, SettingsService, ThemeService) {
	$scope.settings_service = SettingsService;
	$scope.new_refresh = $scope.settings_service.getRefreshInterval();
	$scope.theme = ThemeService.getTheme();
	
    $scope.connectToHost=function(event) {
		if (event.keyCode == 13) {
			if (isDefined($scope.new_host) && $scope.new_host.length > 0) {
				$scope.setHost($scope.new_host);
				$scope.refreshClusterState();
			}			
		}
	};
	
	$scope.changeRefresh=function() {
		$scope.settings_service.setRefreshInterval($scope.new_refresh);
	};
	
	$scope.changeTheme=function() {
		ThemeService.setTheme($scope.theme);
	};

}
