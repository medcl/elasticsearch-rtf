'use strict';

describe('WarmersController', function() {
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
    var $timeout = $injector.get('$timeout');
    var $location = $injector.get('$location');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.AlertService = $injector.get('AlertService');
    this.AceEditorService = $injector.get('AceEditorService');

    this.createController = function() {
      return $controller('WarmersController', {$scope: this.scope}, $location,
          $timeout, this.ConfirmDialogService, this.AlertService,
          this.AceEditorService);
    };

    this._controller = this.createController();
  }));

  /* TESTS */

  it('Initial values are correct', function() {
    expect(this.scope.index).toEqual(null);
    expect(this.scope.paginator.filter.id).toEqual("");
    expect(this.scope.paginator.getCollection()).toEqual([]);
    expect(this.scope.indices).toEqual([]);
    expect(this.scope.editor).toEqual(undefined);
    expect(this.scope.warmer.id).toEqual("");
    expect(this.scope.warmer.index).toEqual("");
    expect(this.scope.warmer.source).toEqual({});
    expect(this.scope.warmer.types).toEqual([]);
  });

  it('Initializes data when warmer tab is selected', function() {
    this.ElasticService.getIndices = function() {};
    spyOn(this.ElasticService, 'getIndices').andReturn(true);
    spyOn(this.scope, 'initEditor').andReturn(true);
    this.scope.initializeController();
    expect(this.ElasticService.getIndices).toHaveBeenCalled();
    expect(this.scope.initEditor).toHaveBeenCalled();
  });

  it('Returns total number of warmers', function() {
    this.scope.paginator.setCollection([new Warmer("warmer_id", "index",
        { types: [], source: {}}),
      new Warmer("warmer_id2", "index", { types: [], source: {}})]);
    expect(this.scope.paginator.getPage().total).toEqual(2);
  });

  it('Prevent warmer with empty body to be created', function() {
    var editor = {
      error: undefined,
      format: function() {
        return '';
      },
      hasContent: function() {
        return false;
      }
    };
    spyOn(this.AlertService, "error");
    this.scope.editor = editor;
    this.scope.createWarmer();
    expect(this.AlertService.error).toHaveBeenCalled();
  });

  it('Prevent warmer with invalid body to be created', function() {
    var editor = {
      error: 'Invalid JSON',
      format: function() {
        return '{ "whatever" }';
      },
      getValue: function() {
        return '{ "whatever" }';
      },
      hasContent: function() {
        return true;
      }
    };
    this.scope.editor = editor;
    this.scope.createWarmer();
  });

  it('Attempts creating a valid Warmer', function() {
    var editor = {
      error: undefined,
      format: function() {
        return '{ "query": { "match_all": {} } }';
      },
      getValue: function() {
        return '{ "query": { "match_all": {} } }';
      },
      hasContent: function() {
        return true;
      }
    };
    var warmer = new Warmer("warmer_id", "index_name",
        { types: "type", source: {} });
    this.scope.warmer = warmer;
    this.scope.editor = editor;
    this.ElasticService.registerWarmer = function() {
    };
    spyOn(this.ElasticService, "registerWarmer").andReturn(true);
    this.scope.createWarmer();
    expect(this.scope.warmer.source).toEqual(editor.getValue());
    expect(this.ElasticService.registerWarmer).toHaveBeenCalledWith(warmer,
        jasmine.any(Function),
        jasmine.any(Function));
  });

  it('Loads index warmers for index and all types', function() {
    this.scope.index = "index_name";
    this.ElasticService.getIndexWarmers = function() {
    };
    spyOn(this.ElasticService, "getIndexWarmers").andReturn(true);
    this.scope.warmer = new Warmer('', 'index_name', {});
    this.scope.loadIndexWarmers();
    expect(this.ElasticService.getIndexWarmers).toHaveBeenCalledWith("index_name",
        '', jasmine.any(Function), jasmine.any(Function));
  });

  it('Loads index warmers for index and specific type', function() {
    this.scope.index = "index_name";
    this.scope.paginator.filter.id = "warmer_id";
    this.ElasticService.getIndexWarmers = function() {
    };
    spyOn(this.ElasticService, "getIndexWarmers").andReturn(true);
    this.scope.warmer = new Warmer('', 'index_name', {});
    this.scope.loadIndexWarmers();
    expect(this.ElasticService.getIndexWarmers).toHaveBeenCalledWith("index_name",
        '', jasmine.any(Function), jasmine.any(Function));
  });

  // TODO: how to make this work with the call that happens once user confirms?
  it('Deletes an existing Warmer', function() {
    this.scope.index = { 'name': "index_name" };
    this.ElasticService.deleteWarmer = function() {
    };
    spyOn(this.ElasticService, "deleteWarmer").andReturn(true);
    spyOn(this.ConfirmDialogService, "open").andReturn(true);
    this.scope.deleteWarmer(new Warmer("warmer_id", "index",
        { types: [], source: {}}));
    expect(this.ConfirmDialogService.open).toHaveBeenCalledWith("are you sure you want to delete warmer warmer_id?",
        {}, "Delete", jasmine.any(Function));
  });

});