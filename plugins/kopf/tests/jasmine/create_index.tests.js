'use strict';

describe('CreateIndexController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    var mock = {isConnected: function() {
      return true;
    }};
    module(function($provide) {
      $provide.value('ElasticService', mock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    this.AlertService = $injector.get('AlertService');
    this.ElasticService = $injector.get('ElasticService');
    this.createController = function() {
      return $controller('CreateIndexController', {$scope: this.scope},
          this.AlertService, this.ElasticService);
    };
    this._controller = this.createController();
  }));

  //TESTS
  it('init : values are set', function() {
    expect(this.scope.source_index).toEqual(null);
    expect(this.scope.shards).toEqual('');
    expect(this.scope.replicas).toEqual('');
    expect(this.scope.name).toEqual('');
    expect(this.scope.indices).toEqual([]);
  });

  it('should correctly load settings from an existing index', function() {
    this.scope.source_index = 'original';
    this.scope.editor = { setValue: {} };
    var metadata = { settings: { any: true }, mappings: { whatever: true }};
    this.ElasticService.getIndexMetadata = function(name, success, error) {
      success(metadata);
    };
    spyOn(this.ElasticService, 'getIndexMetadata').andCallThrough();
    spyOn(this.scope.editor, 'setValue').andReturn();
    this.scope.updateEditor();
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("original",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.scope.editor.setValue).toHaveBeenCalledWith(JSON.stringify(metadata,
        null, 2));
  });

  it('should display error message if there is an error while fetching index data',
      function() {
        this.scope.source_index = 'original';
        this.ElasticService.getIndexMetadata = function(name, success, error) {
          error("kaput");
        };
        spyOn(this.ElasticService, 'getIndexMetadata').andCallThrough();
        spyOn(this.AlertService, 'error').andReturn();
        this.scope.updateEditor();
        expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("original",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.AlertService.error).toHaveBeenCalledWith("Error while loading index settings",
            "kaput");
      });

  it('should prevent attempting creating an index when no name is input',
      function() {
        this.scope.name = '';
        spyOn(this.AlertService, 'error').andReturn();
        this.scope.createIndex();
        expect(this.AlertService.error).toHaveBeenCalledWith("You must specify a valid index name");
      });

  it('should warn of invalid json', function() {
    this.scope.name = 'new_index';
    this.scope.editor = { format: function() {
      return {};
    }, error: "Y U NO PARSE" };
    this.ElasticService.refresh = function() {
    };
    spyOn(this.AlertService, 'error').andReturn();
    this.scope.createIndex();
    expect(this.AlertService.error).toHaveBeenCalledWith("Invalid JSON: Y U NO PARSE");
  });

  it('should correctly create an index with the given settings', function() {
    this.scope.name = 'new_index';
    this.ElasticService.refresh = function() {
    };
    this.scope.editor = { format: function() {
      return JSON.stringify({ settings: { } });
    } };
    this.ElasticService.createIndex = function(name, body, success, error) {
      success();
    };
    spyOn(this.ElasticService, 'createIndex').andCallThrough();
    spyOn(this.ElasticService, 'refresh').andReturn();
    this.scope.createIndex();
    expect(this.ElasticService.createIndex).toHaveBeenCalledWith("new_index",
        JSON.stringify({ settings: { } }), jasmine.any(Function),
        jasmine.any(Function));
    expect(this.ElasticService.refresh).toHaveBeenCalled();
  });

  it('should read shards and replicas settings and settings body is empty',
      function() {
        this.scope.name = 'new_index';
        this.scope.shards = '4';
        this.scope.replicas = '5';
        this.ElasticService.refresh = function() {
        };
        this.scope.editor = { format: function() {
          return JSON.stringify({});
        } };
        this.ElasticService.createIndex = function(name, body, success, error) {
          success();
        };
        spyOn(this.ElasticService, 'createIndex').andCallThrough();
        spyOn(this.ElasticService, 'refresh').andReturn();
        this.scope.createIndex();
        expect(this.ElasticService.createIndex).toHaveBeenCalledWith("new_index",
            '{"settings":{"index":{"number_of_shards":"4","number_of_replicas":"5"}}}',
            jasmine.any(Function), jasmine.any(Function));
        expect(this.ElasticService.refresh).toHaveBeenCalled();
      });

});