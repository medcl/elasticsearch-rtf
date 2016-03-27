function Cluster(health, state, stats, nodesStats, settings, aliases, nodes,
                 main) {
  this.created_at = new Date().getTime();

  // main -> GET /
  this.clientName = main.name;

  // Cluster Health(/_cluster/health)
  this.status = health.status;
  this.initializing_shards = health.initializing_shards;
  this.active_primary_shards = health.active_primary_shards;
  this.active_shards = health.active_shards;
  this.relocating_shards = health.relocating_shards;
  this.unassigned_shards = health.unassigned_shards;
  this.number_of_nodes = health.number_of_nodes;
  this.number_of_data_nodes = health.number_of_data_nodes;
  this.timed_out = health.timed_out;
  this.shards = (this.active_shards + this.relocating_shards +
  this.unassigned_shards + this.initializing_shards);

  this.fetched_at = getTimeString(new Date());

  this.name = state.cluster_name;
  this.master_node = state.master_node;

  this.closedIndices = 0;

  this.disableAllocation = 'false';
  var persistentAllocation = getProperty(settings,
      'persistent.cluster.routing.allocation.enable', 'all');

  var transientAllocation = getProperty(settings,
      'transient.cluster.routing.allocation.enable', '');

  if (transientAllocation !== '') {
    this.disableAllocation = transientAllocation == 'all' ? 'false' : 'true';
  } else {
    if (persistentAllocation != 'all') {
      this.disableAllocation = 'true';
    }
  }

  this.settings = settings;

  this.nodes = Object.keys(nodes.nodes).map(function(nodeId) {
    var nodeStats = nodesStats.nodes[nodeId];
    var nodeInfo = nodes.nodes[nodeId];
    var node = new Node(nodeId, nodeStats, nodeInfo);
    if (nodeId === state.master_node) {
      node.setCurrentMaster();
    }
    return node;
  });

  this.getNodes = function() {
    return this.nodes;
  };

  this.number_of_nodes = this.nodes.length;

  var indicesNames = Object.keys(state.routing_table.indices);
  var specialIndices = 0;
  var closedIndices = 0;
  this.indices = indicesNames.map(function(indexName) {
    var indexStats = stats.indices[indexName];
    var indexAliases = aliases[indexName];
    var index = new Index(indexName, state, indexStats, indexAliases);
    if (index.special) {
      specialIndices++;
    }
    return index;
  });

  if (isDefined(state.blocks.indices)) {
    var indices = this.indices;
    Object.keys(state.blocks.indices).forEach(function(indexName) {
      // INDEX_CLOSED_BLOCK = new ClusterBlock(4, "index closed", ...
      if (state.blocks.indices[indexName]['4']) {
        indices.push(new Index(indexName));
        closedIndices++;
      }
    });
  }
  this.special_indices = specialIndices;
  this.closedIndices = closedIndices;
  var hasData = Object.keys(stats._all.primaries).length > 0;
  this.num_docs = hasData ? stats._all.primaries.docs.count : 0;
  this.total_size_in_bytes = hasData ? stats._all.total.store.size_in_bytes : 0;
  this.total_indices = this.indices.length;

  this.changes = null;

  this.computeChanges = function(oldCluster) {
    var nodes = this.nodes;
    var indices = this.indices;
    var changes = new ClusterChanges();
    if (isDefined(oldCluster) && this.name === oldCluster.name) {
      // checks for node differences
      oldCluster.nodes.forEach(function(node) {
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].equals(node)) {
            node = null;
            break;
          }
        }
        if (isDefined(node)) {
          changes.addLeavingNode(node);
        }
      });

      if (oldCluster.nodes.length != nodes.length || !changes.hasJoins()) {
        nodes.forEach(function(node) {
          for (var i = 0; i < oldCluster.nodes.length; i++) {
            if (oldCluster.nodes[i].equals(node)) {
              node = null;
              break;
            }
          }
          if (isDefined(node)) {
            changes.addJoiningNode(node);
          }
        });
      }

      // checks for indices differences
      oldCluster.indices.forEach(function(index) {
        for (var i = 0; i < indices.length; i++) {
          if (indices[i].equals(index)) {
            index = null;
            break;
          }
        }
        if (isDefined(index)) {
          changes.addDeletedIndex(index);
        }
      });

      var equalNumberOfIndices = oldCluster.indices.length != indices.length;
      if (equalNumberOfIndices || !changes.hasCreatedIndices()) {
        indices.forEach(function(index) {
          for (var i = 0; i < oldCluster.indices.length; i++) {
            if (oldCluster.indices[i].equals(index)) {
              index = null;
              break;
            }
          }
          if (isDefined(index)) {
            changes.addCreatedIndex(index);
          }
        });
      }
      var docDelta = this.num_docs - oldCluster.num_docs;
      // var docRate = docDelta / ((this.created_at - old_cluster.created_at) / 1000);
      changes.setDocDelta(docDelta);
      var dataDelta = this.total_size_in_bytes - oldCluster.total_size_in_bytes;
      changes.setDataDelta(dataDelta);
    }
    this.changes = changes;
  };

  this.open_indices = function() {
    return this.indices.filter(function(index) {
      return index.state === 'open';
    });
  };

  var shards = {};
  var unassignedShards = {};

  var indicesRouting = state.routing_table.indices;
  indicesNames.forEach(function(indexName) {
    var totalShards = Object.keys(indicesRouting[indexName].shards);

    totalShards.forEach(function(shardNum) {
      indicesRouting[indexName].shards[shardNum].forEach(function(shardData) {
        if (shardData.state === 'UNASSIGNED') {
          if (!isDefined(unassignedShards[shardData.index])) {
            unassignedShards[shardData.index] = [];
          }
          unassignedShards[shardData.index].push(new Shard(shardData));
        } else {
          var shard = new Shard(shardData);
          var key = shard.node + '_' + shard.index;
          if (!isDefined(shards[key])) {
            shards[key] = [];
          }
          shards[key].push(shard);
        }
      });
    });
  });

  this.getShards = function(nodeId, indexName) {
    var allocated = shards[nodeId + '_' + indexName];
    return isDefined(allocated) ? allocated : [];
  };

  this.getUnassignedShards = function(indexName) {
    var unassigned = unassignedShards[indexName];
    return isDefined(unassigned) ? unassigned : [];
  };

}
