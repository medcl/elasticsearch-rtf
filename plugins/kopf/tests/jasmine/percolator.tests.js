'use strict';

describe('PercolatorController', function() {
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
    this.ElasticService = $injector.get('ElasticService');
    this.AlertService = $injector.get('AlertService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.AceEditorService = $injector.get('AceEditorService');
    this.createController = function() {
      return $controller('PercolatorController', {$scope: this.scope},
          this.AlertService, this.ConfirmDialogService, this.AceEditorService,
          this.ElasticService);
    };
    this._controller = this.createController();
  }));

  //TESTS
  it('init : values are set', function() {
    expect(this.scope.editor).toEqual(undefined);
    expect(this.scope.pagination.from).toEqual(0);
    expect(this.scope.pagination.percolators).toEqual([]);
    expect(this.scope.pagination.total()).toEqual(0);
    expect(this.scope.pagination.size).toEqual(0);
    expect(this.scope.filter).toEqual('');
    expect(this.scope.id).toEqual('');
    expect(this.scope.index).toEqual(null);
    expect(this.scope.indices).toEqual([]);
    expect(new PercolateQuery({}).equals(this.scope.new_query)).toEqual(true);
  });

  it('Initializes data when percolator tab is selected', function() {
    var indices = [
      new Index('a', undefined, {}, {}),
      new Index('b', undefined, {}, {})
    ];
    this.ElasticService.getIndices = function() {
      return indices;
    }
    spyOn(this.scope, 'initEditor').andReturn(true);
    this.scope.initializeController();
    expect(this.scope.initEditor).toHaveBeenCalled();
    expect(this.scope.indices).toEqual(indices);
  });

  it('correctly goes to previous page', function() {
    this.scope.pagination = new PercolatorsPage(40, 10, 50, []);
    spyOn(this.scope, 'loadPercolatorQueries').andReturn(true);
    this.scope.previousPage();
    expect(this.scope.loadPercolatorQueries).toHaveBeenCalledWith(30);
  });

  it('correctly goes to next page', function() {
    this.scope.pagination = new PercolatorsPage(30, 10, 50, []);
    spyOn(this.scope, 'loadPercolatorQueries').andReturn(true);
    this.scope.nextPage();
    expect(this.scope.loadPercolatorQueries).toHaveBeenCalledWith(40);
  });

  it('correctly returns if there is a next page', function() {
    this.scope.pagination = new PercolatorsPage(30, 10, 50, []);
    expect(this.scope.pagination.hasNextPage()).toEqual(true);
    this.scope.pagination = new PercolatorsPage(40, 10, 50, []);
    expect(this.scope.pagination.hasNextPage()).toEqual(false);
  });

  it('correctly returns if there is a previous page', function() {
    this.scope.pagination = new PercolatorsPage(30, 10, 50, []);
    expect(this.scope.pagination.hasPreviousPage()).toEqual(true);
    this.scope.pagination = new PercolatorsPage(0, 10, 50, []);
    expect(this.scope.pagination.hasPreviousPage()).toEqual(false);
  });

  it('correctly returns first and last result', function() {
    this.scope.pagination = new PercolatorsPage(30, 10, 50, []);
    expect(this.scope.pagination.firstResult()).toEqual(31);
    expect(this.scope.pagination.lastResult()).toEqual(40);
    this.scope.pagination = new PercolatorsPage(30, 10, 34, []);
    expect(this.scope.pagination.firstResult()).toEqual(31);
    expect(this.scope.pagination.lastResult()).toEqual(34);
    this.scope.pagination = new PercolatorsPage(0, 10, 7, []);
    expect(this.scope.pagination.firstResult()).toEqual(1);
    expect(this.scope.pagination.lastResult()).toEqual(7);
  });

  it('parses the search params', function() {
    expect(this.scope.parseSearchParams()).toEqual([]);
    this.scope.id = '17';
    expect(this.scope.parseSearchParams()).toEqual([
      { query_string: { default_field: '_id', query: '17' } }
    ]);
    this.scope.filter = '{ "foo": "bar" }';
    expect(this.scope.parseSearchParams()).toEqual([
      { query_string: { default_field: '_id', query: '17' } },
      {"term": { "foo": 'bar' } }
    ]);
  });

  it('alerts error if no index is selected for searching percolator queries',
      function() {
        spyOn(this.AlertService, 'info').andReturn(true);
        this.scope.searchPercolatorQueries();
        expect(this.AlertService.info).toHaveBeenCalledWith("No index is selected");
        this.scope.index = new Index('a', undefined, {}, {});
        spyOn(this.scope, 'loadPercolatorQueries');
        this.scope.searchPercolatorQueries();
        expect(this.scope.loadPercolatorQueries).toHaveBeenCalled();
      });

  it('prevents creating a percolator query if json is mal formed', function() {
    this.ElasticService = {
      createPercolatorQuery: function() {
      }
    }
    var fake_editor = {
      error: 'error',
      format: function() {
        return {};
      }
    };
    this.scope.editor = fake_editor;
    spyOn(this.ElasticService, 'createPercolatorQuery').andReturn(true);
    this.scope.createNewQuery();
    expect(this.ElasticService.createPercolatorQuery).not.toHaveBeenCalled();
  });

  it('prevents creating a percolator query if no id is defined', function() {
    this.ElasticService = {
      createPercolatorQuery: function() {
      }
    }
    var fake_editor = {
      error: undefined,
      format: function() {
        return { "query": {"match_all": {}}};
      }
    };
    this.scope.editor = fake_editor;
    this.scope.new_query = new PercolateQuery({'_index': 'a', 'type': 'foobar', '_id': '', '_source': { "query": { "match_all": {} } }});
    spyOn(this.ElasticService, 'createPercolatorQuery').andReturn(true);
    this.scope.createNewQuery();
    expect(this.ElasticService.createPercolatorQuery).not.toHaveBeenCalled();
  });

  it('attempts creating a percolator query if all data is ok', function() {
    this.ElasticService.createPercolatorQuery = function() {};
    var fake_editor = {
      error: undefined,
      format: function() {
        return { "query": {"match_all": {}}};
      }
    };
    this.scope.editor = fake_editor;
    var query = new PercolateQuery({'_index': 'a', 'type': 'foobar', '_id': '', '_source': { "query": { "match_all": {} } }});
    this.scope.new_query = query;
    this.scope.new_query.id = "foobar";
    spyOn(this.ElasticService, 'createPercolatorQuery').andReturn(true);
    this.scope.createNewQuery();
    expect(this.ElasticService.createPercolatorQuery).toHaveBeenCalledWith(query,
        jasmine.any(Function), jasmine.any(Function));
  });

  it('displays error when loading percolator query if filter is invalid',
      function() {
        this.ElasticService = {
          fetchPercolateQueries: function() {
          }
        }
        spyOn(this.ElasticService, 'fetchPercolateQueries').andReturn(true);
        spyOn(this.AlertService, 'error').andReturn(true);
        this.scope.filter = '{';
        this.scope.loadPercolatorQueries();
        expect(this.ElasticService.fetchPercolateQueries).not.toHaveBeenCalled();
        expect(this.AlertService.error).toHaveBeenCalled();
      });

  it('attempts loading percolator queries', function() {
    this.ElasticService.fetchPercolateQueries = function() {};
    this.scope.page = 1;
    this.scope.id = '';
    this.scope.filter = '';
    this.scope.index = 'a';
    spyOn(this.ElasticService, 'fetchPercolateQueries').andReturn(true);
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.loadPercolatorQueries(0);
    expect(this.ElasticService.fetchPercolateQueries).toHaveBeenCalledWith('a',
        { from: 0, size: 10 }, jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).not.toHaveBeenCalled();
  });

});