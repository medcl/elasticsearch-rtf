function BrokenCluster(health, state, nodesStats, settings, nodes) {

  this.status = health.status;
  this.initializing_shards = health.initializing_shards;
  this.active_primary_shards = health.active_primary_shards;
  this.active_shards = health.active_shards;
  this.relocating_shards = health.relocating_shards;
  this.unassigned_shards = health.unassigned_shards;
  this.number_of_nodes = health.number_of_nodes;
  this.number_of_data_nodes = health.number_of_data_nodes;
  this.timed_out = health.timed_out;
  this.shards = this.active_shards + this.relocating_shards +
  this.unassigned_shards + this.initializing_shards;
  this.fetched_at = getTimeString(new Date());

  this.name = state.cluster_name;
  this.master_node = state.master_node;

  this.settings = settings;

  var totalSize = 0;

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

  this.total_size = readablizeBytes(totalSize);
  this.total_size_in_bytes = totalSize;
  this.indices = [];
}
