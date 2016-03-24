function ClusterHealth(health) {
  this.status = health.status;
  this.cluster_name = health.cluster_name;
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
}
