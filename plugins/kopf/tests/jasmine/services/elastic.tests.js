"use strict";

describe("ElasticService", function() {
  var elasticService, $http, $httpBackend, $timeout, $location;

  beforeEach(module("kopf"));

  beforeEach(function() {
    module('kopf');
    module(function($provide) {
      $provide.value('ExternalSettingsService', {
        getElasticsearchRootPath: function() {
        },
        withCredentials: function() {
        },
        getRefreshRate: function() {
          return 5000;
        },
        setRefreshRate: function() {
        }
      });
    });
  });

  beforeEach(inject(function($injector) {
    elasticService = $injector.get('ElasticService');
    this.AlertService = $injector.get('AlertService');
    this.ExternalSettingsService = $injector.get('ExternalSettingsService');
    $http = $injector.get('$http');
    $timeout = $injector.get('$timeout');
    $httpBackend = $injector.get('$httpBackend');
    $location = $injector.get('$location');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it("should fetch cluster version and set connection info if request is successfull",
      function() {
        spyOn(elasticService, 'reset').andCallThrough();
        expect(elasticService.connected).toEqual(false);
        expect(elasticService.autoRefreshStarted).toEqual(false);
        expect(elasticService.connection).toEqual(undefined);
        spyOn(this.ExternalSettingsService,
            'getElasticsearchRootPath').andReturn('/testing');
        spyOn(this.ExternalSettingsService, 'withCredentials').andReturn(true);
        elasticService.clusterRequest = function(m, p, pr, d, success, f) {
          success({version: {number: '1.9.13'}, name: 'some node name'});
        };
        spyOn(elasticService, 'clusterRequest').andCallThrough();
        spyOn(elasticService, 'setVersion').andCallThrough();
        spyOn(elasticService, 'autoRefreshCluster').andCallThrough();
        elasticService.connect('http://localhost:9200');
        expect(this.ExternalSettingsService.getElasticsearchRootPath).toHaveBeenCalled();
        expect(this.ExternalSettingsService.withCredentials).toHaveBeenCalled();
        expect(elasticService.clusterRequest).toHaveBeenCalledWith('GET', '/', {},
            {}, jasmine.any(Function), jasmine.any(Function));
        expect(elasticService.connection.host).toEqual('http://localhost:9200/testing');
        expect(elasticService.connection.withCredentials).toEqual(true);
        expect(elasticService.setVersion).toHaveBeenCalledWith('1.9.13');
        expect(elasticService.connected).toEqual(true);
        expect(elasticService.autoRefreshStarted).toEqual(true);
        expect(elasticService.autoRefreshCluster).toHaveBeenCalled();
        expect(elasticService.reset).toHaveBeenCalled();
      });

  it("should handle an error while requesting version", function() {
    expect(elasticService.connection).toEqual(null);
    spyOn(this.ExternalSettingsService,
        'getElasticsearchRootPath').andReturn('/testing');
    spyOn(this.ExternalSettingsService, 'withCredentials').andReturn(true);
    elasticService.clusterRequest = function(m, p, pr, d, s, fail) {
      fail("whaaatt");
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(elasticService, 'setVersion').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    elasticService.connect('http://localhost:9200');
    expect(this.ExternalSettingsService.getElasticsearchRootPath).toHaveBeenCalled();
    expect(this.ExternalSettingsService.withCredentials).toHaveBeenCalled();
    expect(elasticService.clusterRequest).toHaveBeenCalledWith('GET', '/', {}, {},
        jasmine.any(Function), jasmine.any(Function));
    expect(elasticService.connection.host).toEqual('http://localhost:9200/testing');
    expect(elasticService.connection.withCredentials).toEqual(true);
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error connecting to [http://localhost:9200/testing]',
        "whaaatt"
    );
    expect(elasticService.setVersion).not.toHaveBeenCalled();
  });

  it("should handle connection with a cluster with no elected master", function() {
    expect(elasticService.connection).toEqual(null);
    spyOn(this.ExternalSettingsService,
        'getElasticsearchRootPath').andReturn('/testing');
    spyOn(this.ExternalSettingsService, 'withCredentials').andReturn(true);
    elasticService.clusterRequest = function(m, p, pr, d, s, fail) {
      fail({status: 503, version: { number: "1.4.1" }});
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(elasticService, 'setVersion').andCallThrough();
    spyOn(elasticService, 'setBrokenCluster').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    elasticService.connect('http://localhost:9200');
    expect(this.ExternalSettingsService.getElasticsearchRootPath).toHaveBeenCalled();
    expect(this.ExternalSettingsService.withCredentials).toHaveBeenCalled();
    expect(elasticService.clusterRequest).toHaveBeenCalledWith('GET', '/', {}, {},
        jasmine.any(Function), jasmine.any(Function));
    expect(elasticService.connection.host).toEqual('http://localhost:9200/testing');
    expect(elasticService.connection.withCredentials).toEqual(true);
    expect(elasticService.setVersion).toHaveBeenCalledWith('1.4.1');
    expect(elasticService.connected).toEqual(true);
    expect(elasticService.setBrokenCluster).toHaveBeenCalledWith(true);
    expect(this.AlertService.error).toHaveBeenCalledWith('No active master, switching to basic mode');
  });

  it("should throw exception and register no connection if response has unexpected format",
      function() {
        $httpBackend.when('GET', 'http://localhost:9200/testing/').respond(200,
            {version: {number: 'ribeye'}});
        elasticService.connected = true;
        expect(elasticService.connection).toEqual(null);
        expect(elasticService.connected).toEqual(true);
        spyOn(this.ExternalSettingsService,
            'getElasticsearchRootPath').andReturn('/testing');
        spyOn(this.ExternalSettingsService, 'withCredentials').andReturn(true);
        elasticService.connect('http://localhost:9200');
        $httpBackend.flush();
        expect(this.ExternalSettingsService.getElasticsearchRootPath).toHaveBeenCalled();
        expect(this.ExternalSettingsService.withCredentials).toHaveBeenCalled();
        expect(elasticService.connected).toEqual(false);
      });

  it("Should set version when setVersion is called", function() {
    elasticService.setVersion('1.2.3');
    expect(elasticService.version.getMajor()).toEqual(1);
    expect(elasticService.version.getMinor()).toEqual(2);
    expect(elasticService.version.getPatch()).toEqual(3);
    expect(elasticService.version.getValue()).toEqual('1.2.3');
  });

  it("Should throw exception if setVersion is called with incorrect format",
      function() {
        expect(elasticService.connected).toEqual(false);
        expect(elasticService.autoRefreshStarted).toEqual(false);
        spyOn(elasticService, 'autoRefreshCluster').andReturn(true);
        expect(function() {
          elasticService.setVersion('this_is_not_correct');
        }).toThrow('Invalid Elasticsearch version[this_is_not_correct]');
        expect(elasticService.connected).toEqual(false);
        expect(elasticService.autoRefreshStarted).toEqual(false);
        expect(elasticService.autoRefreshCluster).not.toHaveBeenCalled();
      });

  it("Should correcty validate version check", function() {
    elasticService.version = new Version('1.2.3');
    expect(elasticService.versionCheck('1.2.2')).toEqual(true);
    expect(elasticService.versionCheck('1.2.3')).toEqual(true);
    expect(elasticService.versionCheck('1.2.4')).toEqual(false);
    expect(elasticService.versionCheck('1.3.1')).toEqual(false);
    expect(elasticService.versionCheck('2.1.1')).toEqual(false);
  });

  it("correctly sets auth information on connection", function() {
    spyOn(this.ExternalSettingsService,
        'getElasticsearchRootPath').andReturn('/');
    spyOn(elasticService, 'clusterRequest').andReturn();
    elasticService.connect('http://leo:pwd@localhost:9876');
    expect(elasticService.connection.host).toEqual('http://localhost:9876/');
    expect(elasticService.connection.auth).toEqual('Basic bGVvOnB3ZA==');
    expect(elasticService.clusterRequest).toHaveBeenCalledWith('GET', '/', {}, {},
        jasmine.any(Function), jasmine.any(Function));
  });

  it("correctly sends request without auth information", function() {
    var connection = new ESConnection("http://localhost:9876/", false);
    elasticService.connection = connection;
    $httpBackend.expectGET('http://localhost:9876//',
        {"Accept": "application/json, text/plain, */*"}).respond(200, {});
    elasticService.clusterRequest('GET', '/', {}, {}, function() {
    }, function() {
    });
    $httpBackend.flush();
  });

  it("correctly sets auth information on connection", function() {
    var connection = new ESConnection("http://leo:pwd@localhost:9876/", false);
    elasticService.connection = connection;
    $httpBackend.expectGET('http://localhost:9876//', {
      "Authorization": "Basic bGVvOnB3ZA==",
      "Accept": "application/json, text/plain, */*"
    }).respond(200, {});
    elasticService.clusterRequest('GET', '/', {}, {}, function() {
    }, function() {
    });
    $httpBackend.flush();
  });

  it("should do nothing if no auth information is present", function() {
    elasticService.connection = {auth: undefined};
    var params = {};
    elasticService.addAuth(params);
    expect(params).toEqual(params);
  });

  it("should add withCredentials to params", function() {
    elasticService.connection = {auth: undefined, withCredentials: true};
    var params = {};
    elasticService.addAuth(params);
    expect(params).toEqual({withCredentials: true});
  });

  it("should add auth header to params", function() {
    elasticService.connection = {auth: "pfff", withCredentials: false};
    var params = {};
    elasticService.addAuth(params);
    expect(params).toEqual({headers: {Authorization: "pfff"}});
  });

  it("should add auth header and withCredentials to params", function() {
    elasticService.connection = {auth: "pfff", withCredentials: true};
    var params = {};
    elasticService.addAuth(params);
    expect(params).toEqual({
      headers: {Authorization: "pfff"},
      withCredentials: true
    });
  });

  it("resets service state", function() {
    elasticService.cluster = "someValue";
    elasticService.connection = "someValue";
    elasticService.connected = true;
    elasticService.reset();
    expect(elasticService.cluster).toEqual(undefined);
    expect(elasticService.connection).toEqual(undefined);
    expect(elasticService.connected).toEqual(false);
  });

  it("auto refreshes cluster state", function() {
    spyOn(elasticService, 'refresh').andReturn();
    elasticService.autoRefreshCluster();
    expect(elasticService.refresh).toHaveBeenCalled();
    spyOn(elasticService, 'autoRefreshCluster');
    $timeout.flush();
    expect(elasticService.autoRefreshCluster).toHaveBeenCalled();
  });

  // TESTS API Methods
  it("creates index", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    var body = {property: 'value'};
    elasticService.createIndex('name', body, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('name');
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', '/name', {}, body, 'success', 'error');
  });

  it("enables shard allocation", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    elasticService.enableShardAllocation('success', 'error');
    var path = '/_cluster/settings';
    var body = {
      transient: {
        'cluster.routing.allocation.enable': 'all'
      }
    };
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, body, 'success', 'error');
  });

  it("disables shard allocation", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    elasticService.disableShardAllocation('success', 'error');
    var path = '/_cluster/settings';
    var body = {
      transient: {
        'cluster.routing.allocation.enable': 'none'
      }
    };
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, body, 'success', 'error');
  });

  it("successfuly opening an index must refresh and alert success", function() {
    elasticService.clusterRequest = function(m, u, pr, b, success, error) {
      success('response');
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(this.AlertService, 'success').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.openIndex('index_name');
    var path = '/index_name/_open';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, jasmine.any(Function),
        jasmine.any(Function));
    expect(this.AlertService.success).toHaveBeenCalledWith(
        'Index was successfully opened', 'response'
    );
    expect(elasticService.refresh).toHaveBeenCalled();
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("failed opening an index must alert error", function() {
    elasticService.clusterRequest = function(m, u, pr, b, success, error) {
      error('response');
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.openIndex('index_name');
    var path = '/index_name/_open';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, jasmine.any(Function),
        jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error while opening index', 'response'
    );
    expect(elasticService.refresh).not.toHaveBeenCalled();
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("optimizes an index", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.optimizeIndex('index_name', 'success', 'error');
    var path = '/index_name/_optimize';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("clears index cache", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.clearCache('index_name', 'success', 'error');
    var path = '/index_name/_cache/clear';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("successfuly closing an index must refresh and alert success", function() {
    elasticService.clusterRequest = function(m, u, pr, b, success, error) {
      success('response');
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(this.AlertService, 'success').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.closeIndex('index_name');
    var path = '/index_name/_close';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, jasmine.any(Function),
        jasmine.any(Function));
    expect(this.AlertService.success).toHaveBeenCalledWith(
        'Index was successfully closed', 'response'
    );
    expect(elasticService.refresh).toHaveBeenCalled();
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("failed closing an index must alert error", function() {
    elasticService.clusterRequest = function(m, u, pr, b, success, error) {
      error('response');
    };
    spyOn(elasticService, 'clusterRequest').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.closeIndex('index_name');
    var path = '/index_name/_close';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, jasmine.any(Function),
        jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error while closing index', 'response'
    );
    expect(elasticService.refresh).not.toHaveBeenCalled();
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("refreshes an index", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.refreshIndex('index_name', 'success', 'error');
    var path = '/index_name/_refresh';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("deletes an index", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.deleteIndex('index_name', 'success', 'error');
    var path = '/index_name';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('DELETE', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("updates an index settings", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.updateIndexSettings('index_name', {setting: 'settingValue'},
        'success', 'error');
    var path = '/index_name/_settings';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {setting: 'settingValue'}, 'success',
        'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('index_name');
  });

  it("updates the cluster settings", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    elasticService.updateClusterSettings({setting: 'settingValue'}, 'success',
        'error');
    var path = '/_cluster/settings';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {setting: 'settingValue'}, 'success',
        'error');
  });

  it("retrieves index metadata", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    elasticService.updateClusterSettings({setting: 'settingValue'}, 'success',
        'error');
    var path = '/_cluster/settings';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {setting: 'settingValue'}, 'success',
        'error');
  });

  it("deletes a warmer", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    var warmer = new Warmer("warmerId", "indexName", {});
    elasticService.deleteWarmer(warmer, 'success', 'error');
    var path = '/' + warmer.index + '/_warmer/' + warmer.id;
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('DELETE', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('indexName');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('warmerId');
  });

  it("deletes a percolator", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.deletePercolatorQuery('indexName', 'percolatorId', 'success',
        'error');
    var path = '/indexName/.percolator/percolatorId';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('DELETE', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('indexName');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('percolatorId');
  });

  it("creates a percolator query", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    var percolator = new PercolateQuery({
      _index: 'indexName',
      _id: 'percolatorId',
      _source: {some: 'data'}
    });
    elasticService.createPercolatorQuery(percolator, 'success', 'error');
    var path = '/indexName/.percolator/percolatorId';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {some: 'data'}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('indexName');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('percolatorId');
  });

  it("creates a repository", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.createRepository('repo', {set: 'tings'}, 'success', 'error');
    var path = '/_snapshot/repo';
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {set: 'tings'}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
  });

  it("deletes a repository", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.deleteRepository('repo', 'success', 'error');
    var path = '/_snapshot/repo'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('DELETE', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
  });

  it("deletes a snapshot", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.deleteSnapshot('repo', 'snap', 'success', 'error');
    var path = '/_snapshot/repo/snap'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('DELETE', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('snap');
  });

  it("restores a snapshot", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.restoreSnapshot('repo', 'snap', {some: 'settings'},
        'success', 'error');
    var path = '/_snapshot/repo/snap/_restore'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {some: 'settings'}, 'success',
        'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('snap');
  });

  it("restores a snapshot", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.restoreSnapshot('repo', 'snap', {some: 'settings'},
        'success', 'error');
    var path = '/_snapshot/repo/snap/_restore'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', path, {}, {some: 'settings'}, 'success',
        'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('snap');
  });

  it("creates a snapshot", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.createSnapshot('repo', 'snap', {some: 'settings'}, 'success',
        'error');
    var path = '/_snapshot/repo/snap'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {some: 'settings'}, 'success',
        'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('repo');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('snap');
  });

  it("executes a benchmark", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    elasticService.executeBenchmark({some: 'settings'}, 'success', 'error');
    var path = '/_bench'
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {some: 'settings'}, 'success',
        'error');
  });

  it("registers a warmer query without types", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    var warmer = new Warmer("wId", "idx", {source: {}});
    elasticService.registerWarmer(warmer, 'success', 'error');
    var path = "/idx/_warmer/wId";
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('idx');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('wId');
  });

  it("registers a warmer query with types", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    var warmer = new Warmer("wId", "idx", {types: 'whatever', source: {}});
    elasticService.registerWarmer(warmer, 'success', 'error');
    var path = "/idx/whatever/_warmer/wId";
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('PUT', path, {}, {}, 'success', 'error');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('idx');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('whatever');
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('wId');
  });

  it("updates aliases", function() {
    spyOn(elasticService, 'clusterRequest').andReturn(true);
    var add = [new Alias('adding_alias', 'idx', '', '', '')];
    var rem = [new Alias('removing_alias', 'idx', '', '', '')];
    var body = {
      actions: [
        {add: {index: 'idx', alias: 'adding_alias', filter: ''}},
        {remove: {index: 'idx', alias: 'removing_alias', filter: ''}}
      ]
    };
    elasticService.updateAliases(add, rem, 'success', 'error');
    expect(elasticService.clusterRequest).
        toHaveBeenCalledWith('POST', '/_aliases', {}, body, 'success', 'error');
  });

  it("setBrokenCluster to true", function() {
    spyOn($location, 'path').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    elasticService.setBrokenCluster(true);
    expect(elasticService.brokenCluster).toEqual(true);
    expect($location.path).toHaveBeenCalledWith('nodes');
    expect(elasticService.refresh).toHaveBeenCalled();
  });

  it("setBrokenCluster to false", function() {
    spyOn($location, 'path').andReturn(true);
    spyOn(elasticService, 'refresh').andReturn(true);
    elasticService.setBrokenCluster(false);
    expect(elasticService.brokenCluster).toEqual(false);
    expect($location.path).not.toHaveBeenCalledWith('nodes');
    expect(elasticService.refresh).toHaveBeenCalled();
  });

  it("handles connecting to cluster with elasticsearch-http-basic plugin", function() {
    $httpBackend.when('GET', 'http://localhost:9200/').respond(200,
        {OK: {}});
    $httpBackend.when('GET', 'http://localhost:9200//').respond(200,
        {version: {number: '1.5.1'}});
    expect(elasticService.connection).toEqual(null);
    expect(elasticService.connected).toEqual(false);
    spyOn(this.ExternalSettingsService, 'getElasticsearchRootPath').andReturn('');
    spyOn(this.ExternalSettingsService, 'withCredentials').andReturn(false);
    elasticService.connect('http://localhost:9200');
    $httpBackend.flush();
    expect(this.ExternalSettingsService.getElasticsearchRootPath).toHaveBeenCalled();
    expect(this.ExternalSettingsService.withCredentials).toHaveBeenCalled();
    expect(elasticService.connection.host).toEqual('http://localhost:9200/');
    expect(elasticService.version.getValue()).toEqual('1.5.1');
    expect(elasticService.connected).toEqual(true);
  });

  it("fetches shard stats for initialized shard", function() {
    $httpBackend.when('GET', 'http://localhost:9200/foo/_stats?level=shards&human').respond(200,
        {indices: { foo: { shards: { 0: [{ routing: { node: 'nodeId'}}]}}}});
    $httpBackend.when('GET', 'http://localhost:9200/foo/_recovery?active_only=true&human').respond(200,
        {});
    elasticService.connection = new ESConnection('http://localhost:9200', false);
    var callbacks = { success: function(content) {} };
    spyOn(callbacks, 'success');
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.getShardStats('0', 'foo', 'nodeId', callbacks.success);
    $httpBackend.flush();
    expect(callbacks.success).toHaveBeenCalledWith(
        new ShardStats('0', 'foo', { routing : { node : 'nodeId' } })
    );
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('foo');
  });

  it("fetches shard stats for initializing shard", function() {
    $httpBackend.when('GET', 'http://localhost:9200/foo/_stats?level=shards&human').respond(200,
        {indices: { foo: { shards: { }}}});
    $httpBackend.when('GET', 'http://localhost:9200/foo/_recovery?active_only=true&human').respond(200,
        { foo: { shards: [ { target: { id: 'nodeId' }, id: '0' } ]}});
    elasticService.connection = new ESConnection('http://localhost:9200', false);
    var callbacks = { success: function(content) {} };
    spyOn(callbacks, 'success');
    spyOn(elasticService, 'encodeURIComponent').andCallThrough();
    elasticService.getShardStats('0', 'foo', 'nodeId', callbacks.success);
    $httpBackend.flush();
    expect(callbacks.success).toHaveBeenCalledWith(
        new ShardStats('0', 'foo', { target : { id : 'nodeId' }, id : '0' })
    );
    expect(elasticService.encodeURIComponent).toHaveBeenCalledWith('foo');
  });

  it("relocates a shard and executes success callback", function() {
    $httpBackend.when('POST', 'http://localhost:9200/_cluster/reroute').respond(200,
        {notreallyusingtheresponse:{}});
    elasticService.connection = new ESConnection('http://localhost:9200', false);
    var callbacks = { success: function(content) {} };
    spyOn(callbacks, 'success');
    elasticService.relocateShard('1', 'some_index', 'from_nd', 'to_nd', callbacks.success);
    $httpBackend.flush();
    expect(callbacks.success).toHaveBeenCalledWith({notreallyusingtheresponse:{}});
  });

  it("attempts relocating a shard and executes error callback", function() {
    $httpBackend.when('POST', 'http://localhost:9200/_cluster/reroute').respond(400,
        {notreallyusingtheresponse:{}});
    elasticService.connection = new ESConnection('http://localhost:9200', false);
    var callbacks = { error: function(content) {} };
    spyOn(callbacks, 'error');
    elasticService.relocateShard('1', 'some_index', 'from_nd', 'to_nd', undefined, callbacks.error);
    $httpBackend.flush();
    expect(callbacks.error).toHaveBeenCalledWith({notreallyusingtheresponse:{}});
  });

  it("should return the correct versiom", function() {
    elasticService.setVersion('1.2.0');
    expect(elasticService.getVersion().getValue()).toEqual('1.2.0');
  });

});
