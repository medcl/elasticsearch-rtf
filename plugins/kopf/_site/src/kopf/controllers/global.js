function GlobalController($scope, $location, $timeout, $sce, ConfirmDialogService, AlertService, SettingsService, ThemeService) {
	$scope.dialog = ConfirmDialogService;
	$scope.version = "0.5.8";
	$scope.username = null;
	$scope.password = null;
	$scope.alert_service = AlertService;
	
	$scope.home_screen=function() {
		$('#cluster_option a').tab('show');
	};
	
	$scope.getTheme=function() {
		return ThemeService.getTheme();
	};
	
	$scope.setConnected=function(status) {
		if (!status) {
			$scope.cluster = null;
			$scope.cluster_health = null;
		}
		$scope.is_connected = status;
	};

	$scope.broadcastMessage=function(message,args) {
		$scope.$broadcast(message,args);
	};
	
	$scope.readParameter=function(name){
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		return isDefined(results) ? results[1] : null;
	};
	
	$scope.setHost=function(url) {
		if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
			url = "http://" + url;
		}
		$scope.connection = new ESConnection(url);
		$scope.setConnected(false);
		try {
			$scope.client = new ElasticClient($scope.connection);
			$scope.home_screen();
		} catch (error) {
			$scope.client = null;
			AlertService.error(error.message, error.body);
		}
	};
	
	$scope.connect=function() {
		// when opening from filesystem, just try default ES location
		if ($location.host() === "") {
			$scope.setHost("http://localhost:9200");
		} else {
			var location = $scope.readParameter('location');
			// reads ES location from url parameter
			if (isDefined(location)) {
				$scope.setHost(location);
			} else { // uses current location as ES location
				var absUrl = $location.absUrl();
				var cutIndex = absUrl.indexOf("/_plugin/kopf");
				$scope.setHost(absUrl.substring(0,cutIndex));
			}
		}		
	};
	
	$scope.connect();

	$scope.modal = new ModalControls();
	$scope.alert = null;
	$scope.is_connected = false;

	$scope.alertClusterChanges=function() {
		if (isDefined($scope.cluster)) {
			var changes = $scope.cluster.changes;
			if (changes.hasChanges()) {
				if (changes.hasJoins()) {
					var joins = changes.nodeJoins.map(function(node) { return node.name + "[" + node.transport_address + "]"; });
					AlertService.info(joins.length + " new node(s) joined the cluster", joins);
				}
				if (changes.hasLeaves()) {
					var leaves = changes.nodeLeaves.map(function(node) { return node.name + "[" + node.transport_address + "]"; });
					AlertService.warn(changes.nodeLeaves.length + " node(s) left the cluster", leaves);
				}
				if (changes.hasCreatedIndices()) {
					var created = changes.indicesCreated.map(function(index) { return index.name; });
					AlertService.info(changes.indicesCreated.length + " indices created: [" + created.join(",") + "]");
				}
				if (changes.hasDeletedIndices()) {
					var deleted = changes.indicesDeleted.map(function(index) { return index.name; });
					AlertService.info(changes.indicesDeleted.length + " indices deleted: [" + deleted.join(",") + "]");
				}
			}
		}
	};
		
	$scope.refreshClusterState=function() {
		if (isDefined($scope.client)) {
			$timeout(function() { 
				$scope.client.getClusterDetail(
					function(cluster) {
						$scope.updateModel(function() { 
							cluster.computeChanges($scope.cluster);
							$scope.cluster = cluster;
							$scope.alertClusterChanges();
						});
					},
					function(error) {
						$scope.updateModel(function() { 
							AlertService.error("Error while retrieving cluster information", error);
							$scope.cluster = null; 
						});
					}
				);
			
				$scope.client.getClusterHealth( 
					function(cluster) {
						$scope.updateModel(function() { 
							$scope.cluster_health = cluster;
							$scope.setConnected(true);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							$scope.cluster_health = null;
							$scope.setConnected(false);
							AlertService.error("Error connecting to [" + $scope.host + "]",error);						
						});
					}
				);
			}, 100);			
		}
	};

	$scope.autoRefreshCluster=function() {
		$scope.refreshClusterState();
		$timeout(function() { $scope.autoRefreshCluster(); }, SettingsService.getRefreshInterval());	
	};
	
	$scope.autoRefreshCluster();

	$scope.hasConnection=function() {
		return $scope.is_connected;
	};
	
	$scope.isActive=function(tab) {
		return $('#' + tab).hasClass('active');
	};
	
	$scope.displayInfo=function(title,info) {
		$scope.modal.title = title;
		$scope.modal.info = $sce.trustAsHtml(JSONTree.create(info));
		$('#modal_info').modal({show:true,backdrop:true});
	};
	
	$scope.getCurrentTime=function() {
		return getTimeString(new Date());
	};
	
	$scope.selectTab=function(event) {
		AlertService.clear();
		if (isDefined(event)) {
			$scope.broadcastMessage(event, {});
		}
	};
	
	$scope.updateModel=function(action) {
		$scope.$apply(action);
	};

}