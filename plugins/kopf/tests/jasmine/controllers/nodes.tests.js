'use strict';

describe('NodesController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    module(function($provide) {
      $provide.value('ElasticService', {
        isConnected: function() {
          return true;
        },
        getNodes: function() {
          return [];
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    this.ElasticService = $injector.get('ElasticService');
    this.AlertService = $injector.get('AlertService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.AppState = $injector.get('AppState');
    this.createController = function() {
      return $controller('NodesController',
          {$scope: this.scope}, this.ConfirmDialogService,
          this.AlertService, this.AppSate);
    };
    this._controller = this.createController();
  }));

  it('has correct data when initialized',
      function() {
        expect(this.scope.cluster).toEqual(undefined);
        expect(this.scope.nodes).toEqual([]);
        // node filter
        expect(this.scope.filter.name).toEqual('');
        expect(this.scope.filter.master).toEqual(true);
        expect(this.scope.filter.data).toEqual(true);
        expect(this.scope.filter.client).toEqual(true);
      });

  it('should detect when cluster changes and update nodes list',
      function() {
        this.ElasticService.getNodes = function() {
            return "new nodes list";
        };
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
      });

  it('should detect when cluster is not reachable and clean data',
      function() {
        this.ElasticService.cluster = undefined;
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
        expect(this.scope.cluster).toEqual(undefined);
      });

  it('should detect when name filter changes and update nodes list',
      function() {
        this.ElasticService.getNodes = function() {
          return "new nodes list";
        };
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.filter.name = 'b';
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
      });

  it('should detect when data node filter changes and update nodes list',
      function() {
        this.ElasticService.getNodes = function() {
          return "new nodes list";
        };
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.filter.data = true;
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
      });

  it('should detect when client node filter changes and update nodes list',
      function() {
        this.ElasticService.getNodes = function() {
          return "new nodes list";
        };
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.filter.client = true;
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
      });

  it('should detect when master node filter changes and update nodes list',
      function() {
        this.ElasticService.getNodes = function() {
          return "new nodes list";
        };
        spyOn(this.scope, 'refresh').andReturn(true);
        this.scope.filter.master = true;
        this.scope.$digest();
        expect(this.scope.refresh).toHaveBeenCalled();
      });

  it('should detect when master node filter changes and update nodes list',
      function() {
        var nodes = [
          {name: 'a', master: true, data: true, client: false},
          {name: 'b', master: false, data: true, client: false},
          {name: 'c', master: false, data: false, client: true},
        ];
        this.ElasticService.getNodes = function() {
          return nodes;
        };
        // empty filter
        this.scope.refresh();
        expect(this.scope.nodes).toEqual(nodes);
        // filter by name
        this.scope.filter.name = 'a';
        this.scope.refresh(nodes);
        expect(this.scope.nodes).toEqual([nodes[0]]);
        this.scope.filter.name = '';
        // filter out client nodes
        this.scope.filter.client = false;
        this.scope.refresh(nodes);
        expect(this.scope.nodes).toEqual([
              nodes[0],
              nodes[1]
            ]
        );
        // filter out client nodes and data nodes
        this.scope.filter.client = false;
        this.scope.filter.data = false;
        this.scope.refresh(nodes);
        expect(this.scope.nodes).toEqual([nodes[0]]);
      });

});
