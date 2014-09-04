kopf.controller('ClusterHealthController', ['$scope', '$location', '$timeout', '$sce', 'AlertService', 'ConfirmDialogService', 'ElasticService', function($scope,$location,$timeout,$sce, AlertService, ConfirmDialogService, ElasticService) {
	$scope.shared_url = '';
	$scope.results = null;
	
  $scope.$on('loadClusterHealth', function() {
		$('#cluster_health_option a').tab('show');
		$scope.results = null;
		// selects which info should be retrieved
		$scope.retrieveHealth = true;
		$scope.retrieveState = true;
		$scope.retrieveStats = true;
		$scope.retrieveHotThreads = true;
		
		$scope.gist_title = '';
  });
	
	$scope.checkPublishClusterHealth=function() {
		ConfirmDialogService.open(
			"Are you share you want to share your cluster information through a Gist?",
			"By sharing information through a public Gist you might be exposing sensitive information about your cluster, such as " +
			"host name, indices names and etc.",
			"Agree",
			function() {
				$scope.confirm_share = true;
				$scope.publishClusterHealth();
			}
		);
	};
	
	$scope.loadClusterHealth=function() {
		var results = {};
		$scope.results = null;
		var info_id = AlertService.info("Loading cluster health state. This could take a few moments.",{},30000);
		ElasticService.client.getClusterDiagnosis($scope.retrieveHealth, $scope.retrieveState, $scope.retrieveStats, $scope.retrieveHotThreads,
			function(responses) {
				$scope.state = '';
				if (!(responses[0] instanceof Array)) {
					responses = [responses]; // so logic bellow remains the same in case result is not an array
				}
				var idx = 0;
				if ($scope.retrieveHealth) {
					results.health_raw = responses[idx++][0];
					results.health = $sce.trustAsHtml(JSONTree.create(results.health_raw));
				}
				if ($scope.retrieveState) {
					results.state_raw = responses[idx++][0];
					results.state =  $sce.trustAsHtml(JSONTree.create(results.state_raw));
				}
				if ($scope.retrieveStats) {
					results.stats_raw = responses[idx++][0];
					results.stats = $sce.trustAsHtml(JSONTree.create(results.stats_raw));
				}
				if ($scope.retrieveHotThreads) {
					results.hot_threads = responses[idx][0];
				}
				$scope.updateModel(function() {
					$scope.results = results;
					$scope.state = '';
					AlertService.remove(info_id);
				});
			},
			function(failed_request) {
				$scope.updateModel(function() {
					AlertService.remove(info_id);
					AlertService.error("Error while retrieving cluster health information", failed_request.responseText);
				});
			}
		);
	};

	$scope.publishClusterHealth=function() {
		var gist = {};
		gist.description = isDefined($scope.gist_title) ? $scope.gist_title : 'Cluster information delivered by kopf';
		gist.public = true;
		gist.files = {};
		if (isDefined($scope.results)) {
			if (isDefined($scope.results.health_raw)) {
				gist.files.health = {'content': JSON.stringify($scope.results.health_raw, undefined, 4),'indent':'2', 'language':'JSON'};
			}
			if (isDefined($scope.results.state_raw)) {
				gist.files.state = {'content': JSON.stringify($scope.results.state_raw, undefined, 4),'indent':'2', 'language':'JSON'};	
			}
			if (isDefined($scope.results.stats_raw)) {
				gist.files.stats = {'content': JSON.stringify($scope.results.stats_raw, undefined, 4),'indent':'2', 'language':'JSON'} ;
			}
			if (isDefined($scope.results.hot_threads)) {
				gist.files.hot_threads = {'content':$scope.results.hot_threads,'indent':'2', 'language':'JSON'};
			}
		}
		var data = JSON.stringify(gist, undefined, 4);
		$.ajax({ type: 'POST', url: "https://api.github.com/gists", dataType: 'json', data: data})
			.done(function(response) { 
				$scope.updateModel(function() {
					$scope.addToHistory(new Gist(gist.description, response.html_url));
					AlertService.success("Cluster health information successfully shared at: " + response.html_url, null, 60000);
				});
			})
			.fail(function(response) {
				$scope.updateModel(function() {
					AlertService.error("Error while publishing Gist", responseText);
				});
			}
		);
	};
	
	$scope.addToHistory=function(gist) {
		$scope.gist_history.unshift(gist);
		if ($scope.gist_history.length > 30) {
			$scope.gist_history.length = 30;
		}
		localStorage.kopf_gist_history = JSON.stringify($scope.gist_history);
	};
	
	$scope.loadHistory=function() {
		var history = [];
		if (isDefined(localStorage.kopf_gist_history)) {
			try {
				history = JSON.parse(localStorage.kopf_gist_history).map(function(h) {
					return new Gist().loadFromJSON(h);
				});
			} catch (error) {
				localStorage.kopf_gist_history = null;
			}
		} 
		return history;
	};
	
	$scope.gist_history = $scope.loadHistory();

}]);