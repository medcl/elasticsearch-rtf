kopf.controller('RestController', ['$scope', '$location', '$timeout',
  'ExplainService', 'AlertService', 'AceEditorService', 'ElasticService',
  'ClipboardService',
  function($scope, $location, $timeout, ExplainService, AlertService,
           AceEditorService, ElasticService, ClipboardService) {
    $scope.request = new Request(
        decodeURIComponent($location.search().path || ''),
        decodeURIComponent($location.search().method || 'GET'),
        decodeURIComponent($location.search().body || '{}')
    );

    $scope.validation_error = null;

    $scope.history = [];

    $scope.editor = null;
    $scope.response = '';
    $scope.explanationResults = [];

    $scope.mapping = undefined;
    $scope.options = [];

    $scope.updateOptions = function(text) {
      if ($scope.mapping) {
        var autocomplete = new URLAutocomplete($scope.mapping);
        $scope.options = autocomplete.getAlternatives(text);
      }
    };

    $scope.copyAsCURLCommand = function() {
      var method = $scope.request.method;
      var host = ElasticService.getHost();
      var path = encodeURI($scope.request.path);
      var body = $scope.editor.getValue();
      var curl = 'curl -X' + method + ' \'' + host + path + '\'';
      if (['POST', 'PUT'].indexOf(method) >= 0) {
        curl += ' -d \'' + body + '\'';
      }
      ClipboardService.copy(
          curl,
          function() {
            AlertService.info('cURL request successfully copied to clipboard');
          },
          function() {
            AlertService.error('Error while copying request to clipboard');
          }
      );
    };

    $scope.loadHistory = function() {
      var history = [];
      var rawHistory = localStorage.getItem('kopf_request_history');
      if (isDefined(rawHistory)) {
        try {
          JSON.parse(rawHistory).forEach(function(h) {
            history.push(new Request().loadFromJSON(h));
          });
        } catch (error) {
          localStorage.setItem('kopf_request_history', null);
        }
      }
      return history;
    };

    $scope.loadFromHistory = function(request) {
      $scope.request.path = encodeURI(request.path);
      $scope.request.body = request.body;
      $scope.request.method = request.method;
      $scope.editor.setValue(request.body);
    };

    $scope.addToHistory = function(path, method, body) {
      var request = new Request(path, method, body);
      var exists = false;
      for (var i = 0; i < $scope.history.length; i++) {
        if ($scope.history[i].equals(request)) {
          exists = true;
          break;
        }
      }
      if (!exists) {
        $scope.history.unshift(request);
        if ($scope.history.length > 30) {
          $scope.history.length = 30;
        }
        var historyRaw = JSON.stringify($scope.history);
        localStorage.setItem('kopf_request_history', historyRaw);
      }
    };

    function _handleResponse(data) {
      $scope.response = data;
    }

    function doSendRequest(successCallback) {
      if (notEmpty($scope.request.path)) {
        var path = encodeURI('/' + $scope.request.path);
        $scope.request.body = $scope.editor.format();
        $scope.response = '';
        $scope.explanationResults = [];
        if ($scope.request.method == 'GET' && '{}' !== $scope.request.body) {
          AlertService.info('You are executing a GET request with body ' +
              'content. Maybe you meant to use POST or PUT?');
        }
        ElasticService.clusterRequest($scope.request.method,
            path, {}, $scope.request.body,
            function(response) {
              successCallback(response);
              $scope.addToHistory($scope.request.path,
                  $scope.request.method, $scope.request.body);
            },
            function(error, status) {
              if (status !== 0) {
                AlertService.error('Request was not successful');
                _handleResponse(error);
              } else {
                var url = ElasticService.connection.host + path;
                AlertService.error(url + ' is unreachable');
              }
            }
        );
      } else {
        AlertService.warn('Path is empty');
      }
    }

    $scope.sendRequest = function() {
      doSendRequest(function(response) {
        _handleResponse(response);
      });
    };
    $scope.isExplain = function() {
      var isSearch = $scope.request.path.indexOf('_search') >= 0;
      var isExplain = $scope.request.path.indexOf('_explain') >= 0;
      return ($scope.request.method === 'GET' && (isExplain || isSearch)) ||
        ($scope.request.method === 'POST' && isSearch);
    };
    $scope.explainRequest = function() {
      if (!ExplainService.isExplainPath($scope.request.path)) {
        AlertService.info('You are executing a request ' +
          'without _explain nor ?explain=true');
      }
      doSendRequest(function(response) {
        $scope.explanationResults =
          ExplainService.normalizeExplainResponse(response);
        $scope.response = response;
      });
    };

    $scope.exportAsCSV = function() {
      var csv = doCSV($scope.response);
      var blob = new Blob([csv], {type:'data:text/csv;charset=utf-8;'});
      var downloadLink = angular.element('<a></a>');
      downloadLink.attr('href', window.URL.createObjectURL(blob));
      downloadLink.attr('download', 'data.csv');
      downloadLink[0].click();
    };

    $scope.initEditor = function() {
      if (!isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('rest-client-editor');
        $scope.editor.setValue($scope.request.body);
      }
    };

    $scope.initializeController = function() {
      $scope.initEditor();
      $scope.history = $scope.loadHistory();
      ElasticService.getClusterMapping(
          function(mapping) {
            $scope.mapping = mapping;
            $scope.updateOptions($scope.request.path);
          },
          function(error) {
            AlertService.error('Error while loading cluster mappings', error);
          }
      );
    };

    $scope.explanationTreeConfig = {
      expandOn: {
        field: 'description',
        titleClass: 'explanation-result-description'
      },
      columnDefs: [
        {
          field: 'value',
          titleClass: 'explanation-result-header',
          cellClass: 'text-right'
        }
      ]
    };
  }

]);
