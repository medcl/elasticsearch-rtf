'use strict';

describe('CatController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    this.AlertService = $injector.get('AlertService');
    this.ElasticService = $injector.get('ElasticService');
    this.createController = function() {
      return $controller('CatController', {$scope: this.scope},
          this.ElasticService, this.AlertService);
    };
    this._controller = this.createController();
  }));

  it('initial values are set', function() {
    expect(this.scope.api).toEqual('');
    expect(this.scope.result).toEqual(undefined);
    expect(this.scope.apis).toEqual([
      'aliases',
      //'allocation',
      'count',
      //'fielddata',
      //'health',
      //'indices',
      'master',
      //'nodes',
      //'pending_tasks',
      'plugins',
      'recovery',
      //'thread_pool',
      //'shards',
      //'segments'
    ]);
  });

  it('validates api is selected', function() {
    this.scope.api = '';
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.execute();
    expect(this.AlertService.error).toHaveBeenCalledWith('You must select an API');
  });

  it('execute a successful cat request', function() {
    this.scope.api = 'shards';
    this.ElasticService.executeCatRequest = function(api, success, error) {
      success(new CatResult('header\nvalue\n'));
    };
    spyOn(this.ElasticService, 'executeCatRequest').andCallThrough();
    this.scope.execute();
    expect(this.ElasticService.executeCatRequest).toHaveBeenCalledWith(
        'shards',
        jasmine.any(Function),
        jasmine.any(Function)
    );
    expect(this.scope.result.columns).toEqual(['header']);
    expect(this.scope.result.lines).toEqual([["value"]]);
  });

  it('alerts error while executing request', function() {
    this.scope.api = 'shards';
    this.ElasticService.executeCatRequest = function(api, success, error) {
      error('some weird unknown reason');
    };
    spyOn(this.ElasticService, 'executeCatRequest').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.execute();
    expect(this.ElasticService.executeCatRequest).toHaveBeenCalledWith(
        'shards',
        jasmine.any(Function),
        jasmine.any(Function)
    );
    expect(this.scope.result).toEqual(undefined);
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error while fetching data',
        'some weird unknown reason'
    );
  });

});
