"use strict";

describe("PageService", function() {

  var PageService, ElasticService, $scope;

  beforeEach(module("kopf"));

  beforeEach(function() {
    module('kopf');

    module(function($provide) {
      $provide.value('ElasticService', {
        cluster: {}
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $injector) {
    ElasticService = $injector.get('ElasticService');
    PageService = $injector.get('PageService');
    PageService.link = '';
    $scope = $rootScope;
  }));

  it("should watch for cluster changes and update title and favicon",
      function() {
        spyOn(PageService, 'setFavIconColor').andReturn(true);
        spyOn(PageService, 'setPageTitle').andReturn(true);
        ElasticService.cluster = {name: 'super cluster', status: 'green'};
        $scope.$digest();
        expect(PageService.setFavIconColor).toHaveBeenCalledWith('green');
        expect(PageService.setPageTitle).toHaveBeenCalledWith('super cluster');
      });

  it("should watch for disconnect with cluster and update title and favicon",
      function() {
        spyOn(PageService, 'setFavIconColor').andReturn(true);
        spyOn(PageService, 'setPageTitle').andReturn(true);
        ElasticService.cluster = undefined;
        $scope.$digest();
        expect(PageService.setFavIconColor).toHaveBeenCalledWith(undefined);
        expect(PageService.setPageTitle).toHaveBeenCalledWith(undefined);
      });

  it("should change title and favicon if changed",
      function() {
        spyOn(PageService, 'setFavIconColor').andCallThrough(true);
        spyOn(PageService, 'setPageTitle').andCallThrough(true);
        PageService.link = {};
        ElasticService.cluster = {name: 'name1', status: 'status1'};
        $scope.$digest();
        expect(PageService.clusterName).toEqual('name1');
        expect(PageService.clusterStatus).toEqual('status1');
        ElasticService.cluster = {name: 'name2', status: 'status2'};
        $scope.$digest();
        expect(PageService.clusterName).toEqual('name2');
        expect(PageService.clusterStatus).toEqual('status2');
        ElasticService.cluster = {name: 'name2', status: 'status2', other: {}};
        $scope.$digest();
        expect(PageService.clusterName).toEqual('name2');
        expect(PageService.clusterStatus).toEqual('status2');
      });

  it("should preserver title and favicon if not changed",
      function() {
        spyOn(PageService, 'setFavIconColor').andCallThrough(true);
        spyOn(PageService, 'setPageTitle').andCallThrough(true);
        PageService.link = {};
        ElasticService.cluster = {name: 'name1', status: 'status1'};
        $scope.$digest();
        expect(PageService.clusterName).toEqual('name1');
        expect(PageService.clusterStatus).toEqual('status1');
        ElasticService.cluster = {name: 'name1', status: 'status1'};
        $scope.$digest();
        expect(PageService.clusterName).toEqual('name1');
        expect(PageService.clusterStatus).toEqual('status1');
      });

});
