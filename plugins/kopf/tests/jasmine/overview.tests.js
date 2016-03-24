'use strict';

describe('ClusterOverviewController', function() {
  var scope, createController;

  var $window;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');

    module(function($provide) {
      $provide.value('$window', {innerWidth: 1400});
      $provide.value('ElasticService', {
        isConnected: function() {
          return true;
        },
        getIndices: function() {
          return [];
        },
        getNodes: function() {
          return [];
        }
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector,
                                          $httpBackend) {
    $httpBackend.whenGET('./kopf_external_settings.json').respond(200, {});
    this.scope = $rootScope.$new();
    $window = $injector.get('$window');
    this.ElasticService = $injector.get('ElasticService');
    this.AlertService = $injector.get('AlertService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.AppState = $injector.get('AppState');
    this.createController = function() {
      return $controller('ClusterOverviewController',
          {$scope: this.scope, $window: $window}, this.ConfirmDialogService,
          this.AlertService, this.AppState);
    };
    this._controller = this.createController();
  }));

  //TESTS
  it('has an empty paginator with page size 5 and empty index and node filters when initialized',
      function() {
        // paginator
        expect(this.scope.index_paginator.getCollection()).toEqual([]);
        expect(this.scope.index_paginator.getCurrentPage()).toEqual(1);
        expect(this.scope.index_paginator.getPageSize()).toEqual(5);
        expect(this.scope.index_paginator.filter.name).toEqual("");
        expect(this.scope.index_paginator.filter.closed).toEqual(true);
        expect(this.scope.index_paginator.filter.special).toEqual(false);
        expect(this.scope.index_paginator.filter.timestamp).toEqual(0);
        // page
        expect(this.scope.page.elements.length).toEqual(5);
        expect(this.scope.page.first).toEqual(0);
        expect(this.scope.page.last).toEqual(0);
        expect(this.scope.page.next).toEqual(false);
        expect(this.scope.page.previous).toEqual(false);
        // node filter
        expect(this.scope.node_filter.name).toEqual("");
        expect(this.scope.node_filter.master).toEqual(false);
        expect(this.scope.node_filter.data).toEqual(true);
        expect(this.scope.node_filter.client).toEqual(false);
        // node list
        expect(this.scope.nodes).toEqual([]);
      });

  it('should detect when nodes filter name changes and updates nodes',
      function() {
        // paginator
        this.ElasticService.getNodes = function() {
          return [3, 2, 1]
        };
        this.scope.$digest();
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.node_filter.name = "a";
        this.scope.$digest();
        expect(this.scope.setNodes).toHaveBeenCalledWith([3, 2, 1]);
      });


  it('should detect when cluster changes and update indices and nodes',
      function() {
        // paginator
        this.ElasticService.getIndices = function() {
          return [1, 2, 3];
        };
        this.ElasticService.getNodes = function(considerType) {
          return [3, 2, 1]
        };
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.$digest();
        expect(this.scope.setIndices).toHaveBeenCalledWith([1, 2, 3]);
        expect(this.scope.setNodes).toHaveBeenCalledWith([3, 2, 1]);
      });

  it('should detect when indices filter name changes and update indices',
      function() {
        // paginator
        this.scope.cluster = {indices: [], nodes: []};
        this.scope.$digest();
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.index_paginator.filter.name = 'b';
        this.scope.$digest();
        expect(this.scope.setIndices).toHaveBeenCalledWith([]);
        expect(this.scope.setNodes).not.toHaveBeenCalled();
      });

  it('should detect when indices filter state changes and update indices',
      function() {
        // paginator
        this.scope.cluster = {indices: [], nodes: []};
        this.scope.$digest();
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.index_paginator.filter.state = 'b';
        this.scope.$digest();
        expect(this.scope.setIndices).toHaveBeenCalledWith([]);
        expect(this.scope.setNodes).not.toHaveBeenCalled();
      });

  it('should detect when indices filter hide_special changes and update indices',
      function() {
        // paginator
        this.scope.cluster = {indices: [], nodes: []};
        this.scope.$digest();
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.index_paginator.filter.hide_special = false;
        this.scope.$digest();
        expect(this.scope.setIndices).toHaveBeenCalledWith([]);
        expect(this.scope.setNodes).not.toHaveBeenCalled();
      });

  it('should correctly set nodes', function() {
    var nodes = [
      {name: 'a', master: true, data: true, client: false},
      {name: 'b', master: true, data: false, client: false},
      {name: 'c', master: false, data: false, client: true}
    ];
    this.scope.setNodes(nodes);
    expect(this.scope.nodes).toEqual([
        {name: 'a', master: true, data: true, client: false}
    ]);
  });

  it('should correctly set indices', function() {
    this.scope.index_paginator.filter.hide_special = false;
    this.scope.setIndices([{name: '1'}, {name: '2'}, {name: '3'}]);
    expect(this.scope.page.elements).toEqual(
        [{ name : '1' }, { name : '2' }, { name : '3' }, null, null]
    );
    expect(this.scope.page.first).toEqual(1);
    expect(this.scope.page.last).toEqual(3);
    expect(this.scope.page.next).toEqual(false);
    expect(this.scope.page.previous).toEqual(false);
  });

  // optimizeIndex
  it('optimizeIndex must invoke client method, display alert and refresh model',
      function() {
        this.ElasticService.optimizeIndex = function(index, success, failed) {
          return success();
        };
        spyOn(this.ElasticService, "optimizeIndex").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.optimizeIndex("index_id");
        expect(this.ElasticService.optimizeIndex).toHaveBeenCalledWith("index_id",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.AlertService.success).toHaveBeenCalled();
      });

  it('optimizeIndex must display error message if operation fails', function() {
    this.ElasticService.optimizeIndex = function(index, success, failed) {
      return failed();
    };
    spyOn(this.ElasticService, "optimizeIndex").andCallThrough();
    spyOn(this.AlertService, "error").andReturn(true);
    this.scope.optimizeIndex("index_id");
    expect(this.ElasticService.optimizeIndex).toHaveBeenCalledWith("index_id",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalled();
  });

  // delete index
  it('deleteIndex must invoke client method and refresh cluster state',
      function() {
        this.ElasticService.deleteIndex = function(index, success, failed) {
          return success();
        };
        this.ElasticService.refresh = function() {
        };
        spyOn(this.ElasticService, "refresh").andReturn(true);
        spyOn(this.ElasticService, "deleteIndex").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.deleteIndex("index_id");
        expect(this.ElasticService.deleteIndex).toHaveBeenCalledWith("index_id",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.ElasticService.refresh).toHaveBeenCalled();
      });

  it('deleteIndex must display message if operation fails', function() {
    this.ElasticService.deleteIndex = function(index, success, failed) {
      return failed();
    };
    spyOn(this.ElasticService, "deleteIndex").andCallThrough();
    spyOn(this.AlertService, "error").andReturn(true);
    this.scope.deleteIndex("index_id");
    expect(this.ElasticService.deleteIndex).toHaveBeenCalledWith("index_id",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalled();
  });

  // clear cache
  it('clearCache must invoke client method, display alert and refresh model',
      function() {
        this.ElasticService.clearCache = function(index_id, success, failed) {
          return success();
        };
        this.ElasticService.refresh = function() {
        };
        spyOn(this.ElasticService, "refresh").andReturn(true);
        spyOn(this.ElasticService, "clearCache").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.clearCache("index_id");
        expect(this.ElasticService.clearCache).toHaveBeenCalledWith("index_id",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.ElasticService.refresh).toHaveBeenCalled();
        expect(this.AlertService.success).toHaveBeenCalled();
      });

  it('clearCache must display message if operation fails', function() {
    this.ElasticService.clearCache = function(index_id, success, failed) {
      return failed();
    };
    spyOn(this.ElasticService, "clearCache").andCallThrough();
    spyOn(this.AlertService, "error").andReturn(true);
    this.scope.clearCache("index_id");
    expect(this.ElasticService.clearCache).toHaveBeenCalledWith("index_id",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalled();
  });

  // refresh index
  it('refreshIndex must invoke client method, display alert and refresh model',
      function() {
        this.ElasticService.refreshIndex = function(index_id, success, failed) {
          return success();
        };
        this.ElasticService.refresh = function() {
        };
        spyOn(this.ElasticService, "refreshIndex").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.refreshIndex("index_id");
        expect(this.ElasticService.refreshIndex).toHaveBeenCalledWith("index_id",
            jasmine.any(Function), jasmine.any(Function));
        expect(this.AlertService.success).toHaveBeenCalled();
      });

  it('refreshIndex must display message if operation fails', function() {
    this.ElasticService.refreshIndex = function(index_id, success, failed) {
      return failed();
    };
    spyOn(this.ElasticService, "refreshIndex").andCallThrough();
    spyOn(this.AlertService, "error").andReturn(true);
    this.scope.refreshIndex("index_id");
    expect(this.ElasticService.refreshIndex).toHaveBeenCalledWith("index_id",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalled();
  });

  // enable allocation
  it('enableAllocation must invoke client method, display alert and refresh model',
      function() {
        this.ElasticService.enableShardAllocation = function(success, failed) {
          return success();
        };
        this.ElasticService.refresh = function() {
        };
        spyOn(this.ElasticService, "refresh").andReturn(true);
        spyOn(this.ElasticService, "enableShardAllocation").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.enableAllocation("node_id");
        expect(this.ElasticService.enableShardAllocation).toHaveBeenCalledWith(jasmine.any(Function),
            jasmine.any(Function));
        expect(this.ElasticService.refresh).toHaveBeenCalled();
        expect(this.AlertService.success).toHaveBeenCalled();
      });

  it('enableAllocation must display an error message if operations fails',
      function() {
        this.ElasticService.enableShardAllocation = function(success, failed) {
          return failed();
        };
        spyOn(this.ElasticService, "enableShardAllocation").andCallThrough();
        spyOn(this.AlertService, "error").andReturn(true);
        this.scope.enableAllocation("node_id");
        expect(this.ElasticService.enableShardAllocation).toHaveBeenCalledWith(jasmine.any(Function),
            jasmine.any(Function));
        expect(this.AlertService.error).toHaveBeenCalled();
      });

  // disable allocation
  it('disableAllocation must invoke client method, display alert and refresh model',
      function() {
        this.ElasticService.disableShardAllocation = function(success, failed) {
          return success();
        };
        this.ElasticService.refresh = function() {
        };
        spyOn(this.ElasticService, "refresh").andReturn(true);
        spyOn(this.ElasticService, "disableShardAllocation").andCallThrough();
        spyOn(this.AlertService, "success").andReturn(true);
        this.scope.disableAllocation("node_id");
        expect(this.ElasticService.disableShardAllocation).toHaveBeenCalledWith(jasmine.any(Function),
            jasmine.any(Function));
        expect(this.ElasticService.refresh).toHaveBeenCalled();
        expect(this.AlertService.success).toHaveBeenCalled();
      });

  it('disableAllocation must display an error message if operations fails',
      function() {
        this.ElasticService.disableShardAllocation = function(success, failed) {
          return failed();
        };
        spyOn(this.ElasticService, "disableShardAllocation").andCallThrough();
        spyOn(this.AlertService, "error").andReturn(true);
        this.scope.disableAllocation("node_id");
        expect(this.ElasticService.disableShardAllocation).toHaveBeenCalledWith(jasmine.any(Function),
            jasmine.any(Function));
        expect(this.AlertService.error).toHaveBeenCalled();
      });

  // show index settings
  it('show index settings', function() {
    this.ElasticService.getIndexMetadata = function(index, success, failed) {
      return success(new IndexMetadata(index, {settings: {}}));
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
    spyOn(this.scope, "displayInfo").andReturn();
    this.scope.showIndexSettings("index_name");
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("index_name",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.scope.displayInfo).toHaveBeenCalledWith("settings for index_name",
        {});
  });

  it('fail loading index settings', function() {
    this.ElasticService.getIndexMetadata = function(index, success, failed) {
      return failed("buu");
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
    spyOn(this.AlertService, "error").andReturn();
    this.scope.showIndexSettings("index_name");
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("index_name",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith("Error while loading index settings",
        "buu");
  });

  // show index mappings
  it('show index mappings', function() {
    this.ElasticService.getIndexMetadata = function(index, success, failed) {
      return success(new IndexMetadata(index, {mappings: {}}));
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
    spyOn(this.scope, "displayInfo").andReturn();
    this.scope.showIndexMappings("index_name");
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("index_name",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.scope.displayInfo).toHaveBeenCalledWith("mappings for index_name",
        {});
  });

  it('show index mappings', function() {
    this.ElasticService.getIndexMetadata = function(index, success, failed) {
      return failed("buuuu");
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getIndexMetadata").andCallThrough();
    spyOn(this.AlertService, "error").andReturn();
    this.scope.showIndexMappings("index_name");
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith("index_name",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith("Error while loading index mappings",
        "buuuu");
  });

  it('Should return the page size according to the viewport size',
      function() {
        $window.innerWidth = 2800;
        expect(this.scope.getPageSize()).toEqual(10);
        $window.innerWidth = 1400;
        expect(this.scope.getPageSize()).toEqual(5);
        $window.innerWidth = 400;
        expect(this.scope.getPageSize()).toEqual(1);
      });

  it('Should change the page size when viewport size changes', function() {
    spyOn(this.scope.index_paginator, "setPageSize").andReturn(true);
    $($window).triggerHandler('resize');
    expect(this.scope.index_paginator.setPageSize).toHaveBeenCalled();
  });

  it('show node stats', function() {
    var stats = {nodes: {}};
    stats.nodes['nodeId'] = {name: 'nodeName'};
    this.ElasticService.getNodeStats = function(nodeId, success, failed) {
      return success(new NodeStats(nodeId, stats.nodes[nodeId]));
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getNodeStats").andCallThrough();
    spyOn(this.scope, "displayInfo").andReturn();
    this.scope.showNodeStats("nodeId");
    expect(this.ElasticService.getNodeStats).toHaveBeenCalledWith("nodeId",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.scope.displayInfo).toHaveBeenCalledWith("stats for nodeName",
        stats.nodes['nodeId']);
  });

  it('show node stats if request fails', function() {
    this.ElasticService.getNodeStats = function(nodeId, success, failed) {
      return failed("buuuu");
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getNodeStats").andCallThrough();
    spyOn(this.AlertService, "error").andReturn();
    this.scope.showNodeStats("nodeId");
    expect(this.ElasticService.getNodeStats).toHaveBeenCalledWith("nodeId",
        jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith("Error while loading node stats",
        "buuuu");
  });

  it('should reset healthy indices filter when cluster is healthy',
      function() {
        // paginator
        this.scope.index_filter.healthy = false;
        this.ElasticService.cluster = {
          unassigned_shards: 0,
          relocating_shards: 0,
          initializing_shards: 0
        };
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.$digest();
        expect(this.scope.index_filter.healthy).toEqual(true);
      });

  it('should keep healthy indices filter when cluster is unhealthy',
      function() {
        // paginator
        this.scope.index_filter.healthy = false;
        this.ElasticService.cluster = {status: 'yellow'};
        spyOn(this.scope, 'setIndices').andReturn(true);
        spyOn(this.scope, 'setNodes').andReturn(true);
        this.scope.$digest();
        expect(this.scope.index_filter.healthy).toEqual(false);
      });

  it('show shard stats', function() {
    var stats = {"stats": "value"};
    this.ElasticService.getShardStats = function(shard, index, node, success, failed) {
      return success(new ShardStats(shard, index, stats));
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getShardStats").andCallThrough();
    spyOn(this.scope, "displayInfo").andReturn();
    this.scope.showShardStats("0", "index_name", "node_id");
    expect(this.ElasticService.getShardStats).toHaveBeenCalledWith("0",
        "index_name", "node_id", jasmine.any(Function), jasmine.any(Function));
    expect(this.scope.displayInfo).toHaveBeenCalledWith("stats for shard 0",
        stats);
  });

  it('show node stats if request fails', function() {
    this.ElasticService.getShardStats = function(shard, index, node, success, failed) {
      return failed("buuuu");
    };
    this.scope.displayInfo = function(header, body) {
    };
    spyOn(this.ElasticService, "getShardStats").andCallThrough();
    spyOn(this.AlertService, "error").andReturn();
    this.scope.showShardStats("0", "index_name", "node_id");
    expect(this.ElasticService.getShardStats).toHaveBeenCalledWith("0",
        "index_name", "node_id", jasmine.any(Function), jasmine.any(Function));
    expect(this.AlertService.error).toHaveBeenCalledWith("Error while loading shard stats",
        "buuuu");
  });

  it('successfully relocate shard', function() {
    this.scope.relocatingShard = 'someShard';
    this.ElasticService.relocateShard = function(shard, index, fromNode, toNode, success, error) {
      return success({ok:{}});
    };
    this.ElasticService.refresh = function() {};
    spyOn(this.ElasticService, 'relocateShard').andCallThrough();
    spyOn(this.ElasticService, 'refresh').andCallThrough();
    spyOn(this.AlertService, "success").andReturn();
    this.scope.relocateShard('0', 'index_name', 'node_id', 'node_id2');
    expect(this.ElasticService.relocateShard).toHaveBeenCalledWith("0",
        'index_name', 'node_id', 'node_id2', jasmine.any(Function), jasmine.any(Function));
    expect(this.ElasticService.refresh).toHaveBeenCalled();
    expect(this.scope.relocatingShard).toEqual(undefined);
    expect(this.AlertService.success).toHaveBeenCalledWith('Relocation successfully executed', { ok : {  } });
  });

  it('handle shard relocation failure', function() {
    this.scope.relocatingShard = 'someShard';
    this.ElasticService.relocateShard = function(shard, index, fromNode, toNode, success, error) {
      return error({ok:{}});
    };
    this.ElasticService.refresh = function() {};
    spyOn(this.AlertService, "error").andReturn();
    spyOn(this.ElasticService, 'relocateShard').andCallThrough();
    spyOn(this.ElasticService, 'refresh').andCallThrough();
    this.scope.relocateShard('0', 'index_name', 'node_id', 'node_id2');
    expect(this.ElasticService.relocateShard).toHaveBeenCalledWith("0",
        'index_name', 'node_id', 'node_id2', jasmine.any(Function), jasmine.any(Function));
    expect(this.ElasticService.refresh).not.toHaveBeenCalled();
    expect(this.scope.relocatingShard).toEqual(undefined);
    expect(this.AlertService.error).toHaveBeenCalledWith('Error while moving shard', { ok : {  } });
  });

  it('evaluate to false if not same index', function() {
    this.scope.relocatingShard = new Shard({
      primary: true,
      state: 'STARTED',
      node: 'someid',
      index: 'someidx',
      shard: '1'
    });
    var idx = {name: 'someidx2'};
    var node = {id: 'someid'};
    expect(this.scope.canReceiveShard(idx, node)).toEqual(false);
  });

  it('evaluate to false if same node', function() {
    this.scope.relocatingShard = new Shard({
      primary: true,
      state: 'STARTED',
      node: 'someid',
      index: 'someidx',
      shard: '1'
    });
    var idx = {name: 'someidx'};
    var node = {id: 'someid'};
    expect(this.scope.canReceiveShard(idx, node)).toEqual(false);
  });

  it('not fail if index is undefined', function() {
    this.scope.relocatingShard = new Shard({
      primary: true,
      state: 'STARTED',
      node: 'someid',
      index: 'someidx',
      shard: '1'
    });
    var node = {id: 'someid'};
    expect(this.scope.canReceiveShard(undefined, node)).toEqual(false);
  });

  it('evaluate to false if same index different node but contains shard', function() {
    this.scope.relocatingShard = new Shard({
      primary: true,
      state: 'STARTED',
      node: 'someid',
      index: 'someidx',
      shard: '1'
    });
    var idx = {name: 'someidx'};
    var node = {id: 'someid2'};
    this.scope.cluster = { getShards: function(node, index) {
      return [{shard: 1}];
    }};
    expect(this.scope.canReceiveShard(idx, node)).toEqual(true);
  });

  it('evaluate to true if same index different node and not contains shard', function() {
    this.scope.relocatingShard = new Shard({
      primary: true, state: 'STARTED', node: 'someid', index: 'someidx'
    });
    var idx = {name: 'someidx'};
    var node = {id: 'someid2'};
    this.scope.cluster = { getShards: function(node, index) {
      return [{shard: 2}];
    }};
    expect(this.scope.canReceiveShard(idx, node)).toEqual(true);
  });

});
