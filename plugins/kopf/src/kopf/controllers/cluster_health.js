kopf.controller('ClusterHealthController', ['$scope', '$location', '$timeout',
  '$sce', '$http', 'AlertService', 'ConfirmDialogService', 'ElasticService',
  function($scope, $location, $timeout, $sce, $http, AlertService,
           ConfirmDialogService, ElasticService) {

    var defaultDescription = 'Cluster information delivered by kopf';
    $scope.shared_url = '';
    $scope.results = null;

    $scope.initializeController = function() {
      $('#cluster_health_option a').tab('show');
      $scope.results = null;
      // selects which info should be retrieved
      $scope.retrieveHealth = true;
      $scope.retrieveState = true;
      $scope.retrieveStats = true;
      $scope.retrieveHotThreads = true;
      $scope.gist_title = '';
    };

    $scope.checkPublishClusterHealth = function() {
      ConfirmDialogService.open(
          'Are you share you want to share your cluster information?',
              'By sharing information through a public Gist you might be ' +
              'exposing sensitive information about your cluster, such as ' +
              'host name, indices names and etc.',
          'Agree',
          function() {
            $scope.confirm_share = true;
            $scope.publishClusterHealth();
          }
      );
    };

    $scope.loadClusterHealth = function() {
      var results = {};
      $scope.results = null;
      var infoId = AlertService.info('Loading cluster health state. ' +
          'This could take a few moments.', {}, 30000);
      ElasticService.getClusterDiagnosis($scope.retrieveHealth,
          $scope.retrieveState, $scope.retrieveStats, $scope.retrieveHotThreads,
          function(responses) {
            $scope.state = '';
            if (!(responses instanceof Array)) {
              // so logic bellow remains the same in case result is not an array
              responses = [responses];
            }
            var idx = 0;
            if ($scope.retrieveHealth) {
              results.health_raw = responses[idx++];
              var htmlHealth = JSONTree.create(results.health_raw);
              results.health = $sce.trustAsHtml(htmlHealth);
            }
            if ($scope.retrieveState) {
              results.state_raw = responses[idx++];
              var htmlState = JSONTree.create(results.state_raw);
              results.state = $sce.trustAsHtml(htmlState);
            }
            if ($scope.retrieveStats) {
              results.stats_raw = responses[idx++];
              var htmlStats = JSONTree.create(results.stats_raw);
              results.stats = $sce.trustAsHtml(htmlStats);
            }
            if ($scope.retrieveHotThreads) {
              results.hot_threads = responses[idx];
            }
            $scope.results = results;
            $scope.state = '';
            AlertService.remove(infoId);
          },
          function(failedRequest) {
            AlertService.remove(infoId);
            AlertService.error('Error while retrieving cluster health ' +
                'information', failedRequest.data);
          }
      );
    };

    $scope.publishClusterHealth = function() {
      var gist = {description: defaultDescription, public: true};
      if (notEmpty($scope.gist_title)) {
        gist.description = $scope.gist_title;
      }
      var files = {};
      if (isDefined($scope.results)) {
        if (isDefined($scope.results.health_raw)) {
          var health = JSON.stringify($scope.results.health_raw, undefined, 4);
          files.health = {'content': health, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.state_raw)) {
          var state = JSON.stringify($scope.results.state_raw, undefined, 4);
          files.state = {'content': state, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.stats_raw)) {
          var stats = JSON.stringify($scope.results.stats_raw, undefined, 4);
          files.stats = {'content': stats, 'indent': '2', 'language': 'JSON'};
        }
        if (isDefined($scope.results.hot_threads)) {
          var ht = $scope.results.hot_threads;
          files.hot_threads = {'content': ht,
            'indent': '2', 'language': 'JSON'
          };
        }
      }
      gist.files = files;
      var data = JSON.stringify(gist, undefined, 4);

      $http({method: 'POST', url: 'https://api.github.com/gists', data: data}).
          success(function(data, status, headers, config) {
            $scope.addToHistory(new Gist(gist.description, data.html_url));
            AlertService.success('Cluster health information successfully ' +
                    'shared at: ' + data.html_url,
                null, 60000);
          }).
          error(function(data, status, headers, config) {
            AlertService.error('Error while publishing Gist', data);
          });
    };

    $scope.addToHistory = function(gist) {
      $scope.gist_history.unshift(gist);
      if ($scope.gist_history.length > 30) {
        $scope.gist_history.length = 30;
      }
      localStorage.kopf_gist_history = JSON.stringify($scope.gist_history);
    };

    $scope.loadHistory = function() {
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

  }
]);
