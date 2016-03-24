'use strict';

describe('HotThreadsController', function() {
  var scope, ElasticService, AlertService;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    scope = $rootScope.$new();
    AlertService = $injector.get('AlertService');
    ElasticService = $injector.get('ElasticService');
    this._controller = $controller(
        'HotThreadsController',
        {$scope: scope},
        ElasticService,
        AlertService
    );
  }));

  it('initial values are set', function() {
    expect(scope.node).toEqual(undefined);
    expect(scope.nodes).toEqual([]);
    expect(scope.type).toEqual('cpu');
    expect(scope.types).toEqual(['cpu', 'wait', 'block']);
    expect(scope.interval).toEqual("500ms");
    expect(scope.threads).toEqual(3);
    expect(scope.ignoreIdleThreads).toEqual(true);
    expect(scope.nodesHotThreads).toEqual(undefined);
  });

  it('initializes controller', function() {
    scope.api = '';
    var nodes = ['a', 'b', 'c'];
    spyOn(ElasticService, 'getNodes').andReturn(nodes);
    scope.initializeController();
    expect(ElasticService.getNodes).toHaveBeenCalled();
    expect(scope.nodes).toEqual(nodes);
  });

  it('should detect when cluster changes and update indices and nodes',
      function() {
        var nodes = [3, 2, 1];
        ElasticService.getNodes = function() {
          return nodes;
        };
        expect(scope.nodes).toEqual([]);
        scope.$digest();
        expect(scope.nodes).toEqual(nodes);
      });

  it('execute a successful hot threads request', function() {
    scope.node = 'hotNode';
    scope.type = 'wait';
    scope.interval = 750;
    scope.threads = 3;
    scope.ignoreIdleThreads = false;

    var result = ['result'];
    ElasticService.getHotThreads = function(node, type, threads, interval,
                                            ignoreIdleThreads, success, error) {
      success(result);
    };
    spyOn(ElasticService, 'getHotThreads').andCallThrough();
    expect(scope.nodesHotThreads).toEqual(undefined);
    scope.execute();
    expect(ElasticService.getHotThreads).toHaveBeenCalledWith(
        'hotNode', 'wait', 3, 750, false,
        jasmine.any(Function),
        jasmine.any(Function)
    );
    expect(scope.nodesHotThreads).toEqual(result);
  });

  it('alerts error when failing a hot threads request', function() {
    scope.node = 'hotNode';
    scope.type = 'wait';
    scope.interval = 750;
    scope.threads = 3;
    scope.ignoreIdleThreads = false;

    ElasticService.getHotThreads = function(node, type, threads, interval,
                                            ignoreIdleThreads, success, error) {
      error('unkown failure');
    };
    scope.nodesHotThreads = ['mocked result'];
    spyOn(ElasticService, 'getHotThreads').andCallThrough();
    spyOn(AlertService, 'error').andReturn(true);
    expect(scope.nodesHotThreads).toEqual(['mocked result']);
    scope.execute();
    expect(ElasticService.getHotThreads).toHaveBeenCalledWith(
        'hotNode', 'wait', 3, 750, false,
        jasmine.any(Function),
        jasmine.any(Function)
    );
    expect(scope.nodesHotThreads).toEqual(undefined);
    expect(AlertService.error).toHaveBeenCalledWith(
        'Error while fetching hot threads',
        'unkown failure'
    );

  });

});
