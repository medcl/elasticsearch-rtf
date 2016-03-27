function ClusterSettings(settings) {
	// FIXME: 0.90/1.0 check
	var valid = [
	// cluster
	'cluster.blocks.read_only',
	'indices.ttl.interval',
	'indices.cache.filter.size',
	'discovery.zen.minimum_master_nodes',
	// recovery
	'indices.recovery.concurrent_streams',
	'indices.recovery.compress',
	'indices.recovery.file_chunk_size',
	'indices.recovery.translog_ops',
	'indices.recovery.translog_size',
	'indices.recovery.max_bytes_per_sec',
	// routing
	'cluster.routing.allocation.node_initial_primaries_recoveries',
	'cluster.routing.allocation.cluster_concurrent_rebalance',
	'cluster.routing.allocation.awareness.attributes',
	'cluster.routing.allocation.node_concurrent_recoveries',
	'cluster.routing.allocation.disable_allocation',
	'cluster.routing.allocation.disable_replica_allocation'
	];
	var instance = this;
	['persistent','transient'].forEach(function(type) {
		instance[type] = {};
		var current_settings = settings[type];
		valid.forEach(function(setting) {
			instance[type][setting] = getProperty(current_settings, setting);
		});		
	});
}