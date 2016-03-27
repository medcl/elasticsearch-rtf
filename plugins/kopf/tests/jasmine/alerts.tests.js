'use strict';

describe('AlertsController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    this.AlertService = $injector.get('AlertService');
    this.createController = function() {
      return $controller('AlertsController', {$scope: this.scope},
          this.AlertService);
    };
    this._controller = this.createController();
  }));

  it('init : values are set', function() {
    expect(this.scope.alerts).toEqual([]);
  });

  it('updates alerts when alert service changes', function() {
    expect(this.scope.alerts.length).toEqual(0);
    this.AlertService.info("test");
    this.scope.$digest();
    expect(this.scope.alerts.length).toEqual(1);
  });

  it('removes an alert when remove method is called', function() {
    spyOn(this.AlertService, 'remove').andReturn(true);
    this.scope.remove('hello');
    expect(this.AlertService.remove).toHaveBeenCalledWith('hello');
  });

});

