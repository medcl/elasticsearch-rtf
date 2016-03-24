'use strict';

describe('RestController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    var mock = {
      isConnected: function() {
        return true;
      },
      getClusterMapping: function(success, failure) {
        success(new ClusterMapping(
            {
              foo: {
                mappings: {
                  bar: {}
                }
              }
            }
        ));
      }
    };
    module(function($provide) {
      $provide.value('ElasticService', mock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    var $timeout = $injector.get('$timeout');
    var $location = $injector.get('$location');
    this.AlertService = $injector.get('AlertService');
    this.AceEditorService = $injector.get('AceEditorService');
    this.ElasticService = $injector.get('ElasticService');
    this.ClipboardService = $injector.get('ClipboardService');
    this.createController = function() {
      return $controller('RestController', {$scope: this.scope}, $location,
          $timeout, this.AlertService, this.AceEditorService,
          this.ElasticService);
    };
    this._controller = this.createController();
  }));

  it('initial values are set', function() {
    expect(this.scope.editor).toEqual(null);
    expect(this.scope.request.path).toEqual("");
    expect(this.scope.request.method).toEqual("GET");
    expect(this.scope.request.body).toEqual("{}");
    expect(this.scope.validation_error).toEqual(null);
    expect(this.scope.history).toEqual([]);
    expect(this.scope.options).toEqual([]);
    expect(this.scope.mapping).toEqual(undefined);
  });

  it('correctly instantiates components when tab is first laoded', function() {
    var mockEditor = {setValue: function(body) {}};
    spyOn(this.scope, 'initEditor').andCallThrough();
    spyOn(this.AceEditorService, 'init').andReturn(mockEditor);
    spyOn(mockEditor, 'setValue').andReturn(true);
    spyOn(this.scope, 'loadHistory').andReturn([ '1', '2']);
    spyOn(this.ElasticService, 'getClusterMapping').andCallThrough();

    this.scope.initializeController();

    expect(this.scope.initEditor).toHaveBeenCalled();
    var editorId = 'rest-client-editor';
    expect(this.AceEditorService.init).toHaveBeenCalledWith(editorId);
    expect(mockEditor.setValue).toHaveBeenCalledWith('{}');
    expect(this.scope.loadHistory).toHaveBeenCalled();
    expect(this.scope.history).toEqual(['1', '2']);
    expect(this.ElasticService.getClusterMapping).toHaveBeenCalled();
    expect(this.scope.mapping.getIndices()).toEqual(['foo']);
    expect(this.scope.mapping.getTypes('foo')).toEqual(['bar']);
    expect(this.scope.options).toEqual(['_msearch', '_search', '_suggest', 'foo']);
  });

  it('updates autocomplete options', function() {
    this.scope.mapping = new ClusterMapping(
        {
          foo: {
            mappings: {
              bar: {}
            }
          }
        }
    );
    this.scope.updateOptions('foo/');
    expect(this.scope.options).toEqual(['foo/_msearch', 'foo/_search', 'foo/_suggest', 'foo/bar']);
  });

  it('load a previous request', function() {
    var mockEditor = {setValue: function(body) {}};
    this.scope.editor = mockEditor;
    spyOn(this.scope.editor, 'setValue').andReturn(true);

    var request = new Request("test_rest/_search", "POST", "{'uno': 'dos'}");
    this.scope.loadFromHistory(request);

    expect(this.scope.request.path).toEqual("test_rest/_search");
    expect(this.scope.request.method).toEqual("POST");
    expect(this.scope.request.body).toEqual("{'uno': 'dos'}");
    expect(this.scope.editor.setValue).toHaveBeenCalledWith("{'uno': 'dos'}");
  });

  it('load valid request history', function() {
    spyOn(localStorage, 'getItem').andReturn('[{ "path": "/_search", "method": "POST", "body": "{}"}]');
    var history = this.scope.loadHistory();
    expect(history.length).toEqual(1);
    expect(history[0].equals(new Request("/_search", "POST", "{}"))).toEqual(true);
  });

  it('load old-format valid request history', function() {
    spyOn(localStorage, 'getItem').andReturn('[{ "url": "http://oldhost:9200/_search", "method": "POST", "body": "{}"}]');
    var history = this.scope.loadHistory();
    expect(history.length).toEqual(1);
    expect(history[0].equals(new Request("/_search", "POST", "{}"))).toEqual(true);
  });

  it('load invalid request history', function() {
    spyOn(localStorage, 'getItem').andReturn('[ "url": "http://oldhost:9200/_search", "method": "POST", "body": "{}"}]');
    spyOn(localStorage, 'setItem').andReturn(true);
    var history = this.scope.loadHistory();
    expect(history.length).toEqual(0);
    expect(localStorage.setItem).toHaveBeenCalledWith('kopf_request_history', null);
  });

  it('add request to history', function() {
    spyOn(localStorage, 'setItem').andReturn(true);
    var request = new Request("/test_rest/_search", "POST", "{'uno': 'dos'}");
    expect(this.scope.history.length).toEqual(0);
    this.scope.addToHistory(request);
    expect(this.scope.history.length).toEqual(1);
    var historyRaw = JSON.stringify(this.scope.history);
    expect(localStorage.setItem).toHaveBeenCalledWith('kopf_request_history', historyRaw);
  });

  it('to not add duplicates to request to history', function() {
    expect(this.scope.history.length).toEqual(0);
    this.scope.addToHistory("/test_rest/_search", "POST", "{'uno': 'dos'}");
    expect(this.scope.history.length).toEqual(1);
    spyOn(localStorage, 'setItem').andReturn(true);
    this.scope.addToHistory("/test_rest/_search", "POST", "{'uno': 'dos'}");
    expect(this.scope.history.length).toEqual(1);
    expect(localStorage.setItem).not.toHaveBeenCalled();
  });

  it('limit history request to 30', function() {
    var history = [];
    for (var i = 0; i < 30; i++) {
      history.push(new Request("/test_rest/_search", "POST", "{'uno': '" + i + " '}"));
    }
    this.scope.history = history;
    expect(this.scope.history.length).toEqual(30);
    this.scope.addToHistory("/test_rest/_search", "POST", "{'uno': 'dos'}");
    expect(this.scope.history.length).toEqual(30);
    expect(this.scope.history[0].path).toEqual("/test_rest/_search");
    expect(this.scope.history[0].method).toEqual("POST");
    expect(this.scope.history[0].body).toEqual("{'uno': 'dos'}");
  });

  it('executes a correct request', function() {
    this.scope.request = new Request("test_rest/_search", "POST", "{'uno': 'dos'}");
    this.ElasticService.clusterRequest = function(m, p, h, b, success, failure) {
      success(new ClusterMapping({}));
    };
    this.scope.editor = { format: function() { return "{'uno': 'dos'}"; } };
    spyOn(this.AlertService, 'warn').andReturn(true);
    spyOn(this.scope.editor, 'format').andCallThrough();
    spyOn(this.ElasticService, 'clusterRequest').andCallThrough();
    spyOn(this.scope, 'addToHistory').andReturn();
    this.scope.sendRequest();
    expect(this.ElasticService.clusterRequest).toHaveBeenCalledWith("POST", "/test_rest/_search", {}, "{'uno': 'dos'}", jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.warn).not.toHaveBeenCalled();
    expect(this.scope.addToHistory).toHaveBeenCalledWith("test_rest/_search", "POST", "{'uno': 'dos'}");
  });

  it('executes a request without path', function() {
    this.scope.request = new Request("", "POST", "{'uno': 'dos'}");
    spyOn(this.AlertService, 'warn').andReturn(true);
    this.scope.sendRequest();
    expect(this.AlertService.warn).toHaveBeenCalledWith('Path is empty');
  });

  it('executes a GET request with non empty body', function() {
    this.scope.request = new Request("test_rest/_search", "GET", "{'uno': 'dos'}");
    this.ElasticService.clusterRequest = function() {};
    this.scope.editor = { format: function() { return "{'uno': 'dos'}"; } };
    spyOn(this.AlertService, 'info').andReturn(true);
    spyOn(this.scope.editor, 'format').andCallThrough();
    spyOn(this.ElasticService, 'clusterRequest').andReturn(true);
    this.scope.sendRequest();
    expect(this.ElasticService.clusterRequest).toHaveBeenCalledWith("GET", "/test_rest/_search", {}, "{'uno': 'dos'}", jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.info).toHaveBeenCalledWith('You are executing a GET request with body ' +
        'content. Maybe you meant to use POST or PUT?');
  });

  it('correctly copies curl request with body to clipboard', function() {
    this.scope.request = new Request("/test_rest/_search", "POST", "whatever");
    this.scope.editor = { getValue: function() { return "{'uno': 'dos'}"; } };
    this.ElasticService.getHost = function() { return 'http://curly_host:9200 '; };
    this.ClipboardService.copy = function(text, success, failure) { success() };
    spyOn(this.AlertService, 'info').andReturn(true);
    spyOn(this.scope.editor, 'getValue').andCallThrough();
    spyOn(this.ElasticService, 'getHost').andCallThrough();
    spyOn(this.ClipboardService, 'copy').andCallThrough();
    this.scope.copyAsCURLCommand();
    expect(this.ElasticService.getHost).toHaveBeenCalled();
    expect(this.ClipboardService.copy).toHaveBeenCalledWith('curl -XPOST \'http://curly_host:9200 /test_rest/_search\' -d \'{\'uno\': \'dos\'}\'', jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.info).toHaveBeenCalledWith('cURL request successfully copied to clipboard');
  });

  it('correctly copies curl request without body to clipboard', function() {
    this.scope.request = new Request("/test_rest/_search", "GET", "whatever");
    this.scope.editor = { getValue: function() { return "{'uno': 'dos'}"; } };
    this.ElasticService.getHost = function() { return 'http://curly_host:9200 '; };
    this.ClipboardService.copy = function(text, success, failure) { success() };
    spyOn(this.AlertService, 'info').andReturn(true);
    spyOn(this.scope.editor, 'getValue').andCallThrough();
    spyOn(this.ElasticService, 'getHost').andCallThrough();
    spyOn(this.ClipboardService, 'copy').andCallThrough();
    this.scope.copyAsCURLCommand();
    expect(this.ElasticService.getHost).toHaveBeenCalled();
    expect(this.ClipboardService.copy).toHaveBeenCalledWith('curl -XGET \'http://curly_host:9200 /test_rest/_search\'', jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.info).toHaveBeenCalledWith('cURL request successfully copied to clipboard');
  });

  it('alerts when copying to clipboard fails', function() {
    this.scope.request = new Request("/test_rest/_search", "GET", "whatever");
    this.scope.editor = { getValue: function() { return "{'uno': 'dos'}"; } };
    this.ElasticService.getHost = function() { return 'http://curly_host:9200 '; };
    this.ClipboardService.copy = function(text, success, failure) { failure() };
    spyOn(this.AlertService, 'error').andReturn(true);
    spyOn(this.scope.editor, 'getValue').andCallThrough();
    spyOn(this.ElasticService, 'getHost').andCallThrough();
    spyOn(this.ClipboardService, 'copy').andCallThrough();
    this.scope.copyAsCURLCommand();
    expect(this.ElasticService.getHost).toHaveBeenCalled();
    expect(this.ClipboardService.copy).toHaveBeenCalledWith('curl -XGET \'http://curly_host:9200 /test_rest/_search\'', jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith('Error while copying request to clipboard');
  });

});


describe('RestController loading params from URL', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    var mock = {
      isConnected: function() {
        return true;
      },
      getClusterMapping: function(success, failure) {
        success(new ClusterMapping(
            {
              foo: {
                mappings: {
                  bar: {}
                }
              }
            }
        ));
      }
    };
    module(function($provide) {
      $provide.value('ElasticService', mock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    var $timeout = $injector.get('$timeout');
    var $location = $injector.get('$location');
    $location.search('method', 'PUT');
    $location.search('path', '_search');
    $location.search('body', '{"query": {"match_all":{}}}');
    this.AlertService = $injector.get('AlertService');
    this.AceEditorService = $injector.get('AceEditorService');
    this.ElasticService = $injector.get('ElasticService');
    this.ClipboardService = $injector.get('ClipboardService');
    this.createController = function() {
      return $controller('RestController', {$scope: this.scope}, $location,
          $timeout, this.AlertService, this.AceEditorService,
          this.ElasticService);
    };
    this._controller = this.createController();
  }));

  it('initial values are set', function() {
    expect(this.scope.editor).toEqual(null);
    expect(this.scope.request.path).toEqual("_search");
    expect(this.scope.request.method).toEqual("PUT");
    expect(this.scope.request.body).toEqual('{"query": {"match_all":{}}}');
    expect(this.scope.validation_error).toEqual(null);
    expect(this.scope.history).toEqual([]);
    expect(this.scope.options).toEqual([]);
    expect(this.scope.mapping).toEqual(undefined);
  });
});