'use strict';

describe('AnalysisController', function() {
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

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector,
                                          $httpBackend) {
    $httpBackend.whenGET('./kopf_external_settings.json').respond(200, {});
    this.scope = $rootScope.$new();
    this.ElasticService = $injector.get('ElasticService');
    var $timeout = $injector.get('$timeout');
    var $location = $injector.get('$location');
    this.AlertService = $injector.get('AlertService');

    this.createController = function() {
      return $controller('AnalysisController', {$scope: this.scope}, $location,
          $timeout, this.AlertService);
    };
    this._controller = this.createController();
  }));

  //TESTS
  it('init : values are set', function() {
    expect(this.scope.indices).toEqual(null);
    expect(this.scope.field_index).toEqual(null);
    expect(this.scope.field_type).toEqual('');
    expect(this.scope.field_text).toEqual('');
    expect(this.scope.field_tokens).toEqual([]);
    expect(this.scope.analyzer_index).toEqual('');
    expect(this.scope.analyzer_analyzer).toEqual('');
    expect(this.scope.analyzer_text).toEqual('');
    expect(this.scope.analyzer_tokens).toEqual([]);
  });

  it('makes necessary calls when loading page', function() {
    var indices = [
      new Index('a', undefined, {}, {}),
      new Index('b', undefined, {}, {})
    ];
    this.ElasticService.getOpenIndices = function() {
      return indices;
    };
    this.scope.initializeController('loadAnalysisEvent');
    expect(this.scope.indices).toEqual(indices);
  });

  it('doesnt execute field analysis if no field is selected', function() {
    this.ElasticService.analyzeByField = function() {
    };
    spyOn(this.ElasticService, "analyzeByField").andReturn(true);
    this.scope.analyzeByField();
    expect(this.ElasticService.analyzeByField).not.toHaveBeenCalled();
  });

  it('doesnt execute field analysis if text to analyze is empty', function() {
    this.ElasticService.analyzeByField = function() {
    };
    this.scope.field_index = new Index('a', undefined, {}, {});
    this.scope.field_field = 'field';
    this.scope.field_text = '';
    spyOn(this.ElasticService, "analyzeByField").andReturn(true);
    this.scope.analyzeByField();
    expect(this.ElasticService.analyzeByField).not.toHaveBeenCalled();
  });

  it('executes field analysis if all is set', function() {
    this.ElasticService.analyzeByField = function() {
    };
    this.scope.field_index = new Index('a', undefined, {}, {});
    this.scope.field_type = 'type';
    this.scope.field_field = 'field';
    this.scope.field_text = 'blah blah';
    spyOn(this.ElasticService, "analyzeByField").andReturn(true);
    this.scope.analyzeByField();
    expect(this.ElasticService.analyzeByField).toHaveBeenCalledWith('a',
        'field', 'blah blah', jasmine.any(Function), jasmine.any(Function));
  });


  it('doesnt execute analyzer analysis if no analyzer is selected', function() {
    this.ElasticService.analyzeByAnalyzer = function() {
    };
    spyOn(this.ElasticService, "analyzeByAnalyzer").andReturn(true);
    this.scope.analyzeByAnalyzer();
    expect(this.ElasticService.analyzeByAnalyzer).not.toHaveBeenCalled();
  });

  it('doesnt execute analyzer analysis if text to analyze is empty',
      function() {
        this.ElasticService.analyzeByAnalyzer = function() {
        };
        this.scope.analyzer_index = new Index('a', undefined, {}, {});
        this.scope.analyzer_analyzer = 'analyzer';
        this.scope.analyzer_text = '';
        spyOn(this.ElasticService, "analyzeByAnalyzer").andReturn(true);
        this.scope.analyzeByAnalyzer();
        expect(this.ElasticService.analyzeByAnalyzer).not.toHaveBeenCalled();
      });

  it('executes analyzer analysis if all is set', function() {
    this.ElasticService.analyzeByAnalyzer = function() {
    };
    this.scope.analyzer_index = new Index('a', undefined, {}, {});
    this.scope.analyzer_analyzer = 'analyzer';
    this.scope.analyzer_text = 'blah blah';
    spyOn(this.ElasticService, "analyzeByAnalyzer").andReturn(true);
    this.scope.analyzeByAnalyzer();
    expect(this.ElasticService.analyzeByAnalyzer).toHaveBeenCalledWith('a',
        'analyzer', 'blah blah', jasmine.any(Function), jasmine.any(Function));
  });

  it('load index metadata whenever an index is selected on analysis by field',
      function() {
        this.scope.field_index = new Index('heyhey');
        this.ElasticService.getOpenIndices = function() {
          return [];
        };
        this.ElasticService.getIndexMetadata = function(name, success,
                                                        failure) {
          success(new IndexMetadata(name, {mappings: { wat: "wat"}}));
        };
        spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
        this.scope.field_index = new Index('heyhey');
        spyOn(this.scope, "loadIndexTypes").andCallThrough();
        spyOn(this.ElasticService, 'getOpenIndices');
        this.scope.$digest();
        expect(this.scope.loadIndexTypes).toHaveBeenCalledWith("heyhey");
        expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("heyhey",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.scope.field_index_metadata.mappings).toEqual({ wat: "wat"});
        expect(this.ElasticService.getOpenIndices).toHaveBeenCalled();
      });

  it('load index metadata whenever an index is selected on analysis by analyzer',
      function() {
        this.ElasticService.getIndexMetadata = function(name, success,
                                                        failure) {
          success(new IndexMetadata(name, {mappings: { wat: "wat"}}));
        };
        this.ElasticService.getOpenIndices = function() {
          return [];
        };
        spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
        this.scope.field_index = new Index('heyhey');
        this.scope.analyzer_index = new Index('heyhey');
        spyOn(this.scope, "loadIndexAnalyzers").andCallThrough();
        spyOn(this.ElasticService, 'getOpenIndices');
        this.scope.$digest();
        expect(this.scope.loadIndexAnalyzers).toHaveBeenCalledWith("heyhey");
        expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("heyhey",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.scope.analyzer_index_metadata.mappings).toEqual({ wat: "wat"});
        expect(this.ElasticService.getOpenIndices).toHaveBeenCalled();
      });

});