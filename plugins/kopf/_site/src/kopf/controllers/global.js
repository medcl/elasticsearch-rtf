kopf.controller('GlobalController', ['$scope', '$location', '$timeout', '$http', '$q', '$sce', '$window', 'ConfirmDialogService', 'AlertService', 'SettingsService', 'ThemeService', 'ElasticService', function($scope, $location, $timeout, $http, $q, $sce, $window, ConfirmDialogService, AlertService, SettingsService, ThemeService, ElasticService) {
	$scope.version = "1.3.0-SNAPSHOT";
	$scope.alert_service = AlertService;
    $scope.modal = new ModalControls();

	$scope.home_screen=function() {
		$('#cluster_option a').tab('show');
	};
	
	$scope.getTheme=function() {
		return ThemeService.getTheme();
	};

	$scope.broadcastMessage=function(message,args) {
		$scope.$broadcast(message,args);
	};
	
	$scope.readParameter=function(name){
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec($window.location.href);
		return isDefined(results) ? results[1] : null;
	};

    $scope.connect=function() {
        try {
            var host = "http://localhost:9200"; // default
            if ($location.host() !== "") { // not opening from fs
                var location = $scope.readParameter('location');
                if (isDefined(location)) {
                    host = location;
                } else {
                    var url = $location.absUrl();
                    host = url.substring(0, url.indexOf("/_plugin/kopf"));
                }
            }
            ElasticService.connect(host);
            this.home_screen(); // FIXME: not even sure why this is here
        } catch(error) {
            AlertService.error(error.message, error.body);
        }
    };

	$scope.connect();

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
		if (ElasticService.isConnected()) {
			$timeout(function() {
				ElasticService.client.getClusterDetail(
					function(cluster) {
                        cluster.computeChanges($scope.cluster);
                        $scope.cluster = cluster;
                        $scope.alertClusterChanges();
					},
					function(error) {
                        AlertService.error("Error while retrieving cluster information", error);
                        $scope.cluster = null;
					}
				);

				ElasticService.client.getClusterHealth(
					function(cluster) {
                        $scope.cluster_health = cluster;
					},
					function(error) {
                        $scope.cluster_health = null;
                        AlertService.error("Error connecting to [" + $scope.host + "]",error);
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
		return isDefined($scope.cluster_health);
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

}]);
