function EditableIndexSettings(settings) {
  // FIXME: 0.90/1.0 check
  this.valid_settings = [
    // blocks
    'index.blocks.read_only',
    'index.blocks.read',
    'index.blocks.write',
    'index.blocks.metadata',
    // cache
    'index.cache.filter.max_size',
    'index.cache.filter.expire',
    // index
    'index.number_of_replicas',
    'index.index_concurrency',
    'index.warmer.enabled',
    'index.refresh_interval',
    'index.term_index_divisor',
    'index.ttl.disable_purge',
    'index.fail_on_merge_failure',
    'index.gc_deletes',
    'index.codec',
    'index.compound_on_flush',
    'index.term_index_interval',
    'index.auto_expand_replicas',
    'index.recovery.initial_shards',
    'index.compound_format',
    // routing
    'index.routing.allocation.disable_allocation',
    'index.routing.allocation.disable_new_allocation',
    'index.routing.allocation.disable_replica_allocation',
    'index.routing.allocation.total_shards_per_node',
    // slowlog
    'index.search.slowlog.threshold.query.warn',
    'index.search.slowlog.threshold.query.info',
    'index.search.slowlog.threshold.query.debug',
    'index.search.slowlog.threshold.query.trace',
    'index.search.slowlog.threshold.fetch.warn',
    'index.search.slowlog.threshold.fetch.info',
    'index.search.slowlog.threshold.fetch.debug',
    'index.search.slowlog.threshold.fetch.trace',
    'index.indexing.slowlog.threshold.index.warn',
    'index.indexing.slowlog.threshold.index.info',
    'index.indexing.slowlog.threshold.index.debug',
    'index.indexing.slowlog.threshold.index.trace',
    // translog
    'index.translog.flush_threshold_ops',
    'index.translog.flush_threshold_size',
    'index.translog.flush_threshold_period',
    'index.translog.disable_flush',
    'index.translog.fs.type'
  ];
  var instance = this;
  this.valid_settings.forEach(function(setting) {
    instance[setting] = getProperty(settings, setting);
  });
}
