function Index(index_name, cluster_state, index_info, index_status, aliases) {
	this.name = index_name;
	this.shards = null;
	this.metadata = {};
	this.state = "close";
    this.num_of_shards = 0;
    this.num_of_replicas = 0;
    this.aliases = [];
    if (isDefined(aliases)) {
        var index_aliases = aliases.aliases;
        if (isDefined(index_aliases)) {
            this.aliases = Object.keys(aliases.aliases);
        }
    }

    this.visibleAliases=function() { return this.aliases.length > 5 ? this.aliases.slice(0,5) : this.aliases; };

    if (isDefined(cluster_state)) {
        var routing = getProperty(cluster_state, "routing_table.indices");
        this.state = "open";
        if (isDefined(routing)) {
            var shards = Object.keys(cluster_state.routing_table.indices[index_name].shards);
            this.num_of_shards = shards.length;
            var shardMap = cluster_state.routing_table.indices[index_name].shards;
            this.num_of_replicas = shardMap[0].length - 1;
        }
    }
    this.num_docs = getProperty(index_status, 'docs.num_docs', 0);
	this.max_doc = getProperty(index_status, 'docs.max_doc', 0);
	this.deleted_docs = getProperty(index_status, 'docs.deleted_docs', 0);
	this.size = getProperty(index_status, 'index.primary_size_in_bytes', 0);
	this.total_size = getProperty(index_status, 'index.size_in_bytes', 0);
	this.size_in_bytes = readablizeBytes(this.size);
	this.total_size_in_bytes = readablizeBytes(this.total_size);
	
	this.unassigned = [];
    this.unhealthy = false;

    this.getShards=function(node_id) {
        if (isDefined(index_info)) {
            if (this.shards === null) {
                var index_shards = {};
                var unassigned = [];
                this.unassigned = unassigned;
                $.map(index_info.shards, function(shards, shard_num) {
                    $.map(shards, function(shard_routing, shard_copy) {
                        if (shard_routing.node === null) {
                            unassigned.push(new UnassignedShard(shard_routing));
                        } else {
                            if (!isDefined(index_shards[shard_routing.node])) {
                                index_shards[shard_routing.node] = [];
                            }
                            var shard_status = null;
                            if (isDefined(index_status) && isDefined(index_status.shards[shard_routing.shard])) {
                                index_status.shards[shard_routing.shard].forEach(function(status) {
                                    if (status.routing.node == shard_routing.node && status.routing.shard == shard_routing.shard) {
                                        shard_status = status;
                                    }
                                });
                            }
                            var new_shard = new Shard(shard_routing, shard_status);
                            index_shards[shard_routing.node].push(new_shard);
                        }
                    });
                });
                this.shards = index_shards;
            }
        } else {
            this.shards = {};
        }
        return this.shards[node_id];
    };

    if (isDefined(cluster_state) && isDefined(cluster_state.routing_table)) {
        var instance = this;
        var shards_map = cluster_state.routing_table.indices[this.name].shards;
        Object.keys(shards_map).forEach(function(shard_num) {
            shards_map[shard_num].forEach(function(shard) {
               if (shard.state != "STARTED") {
                   instance.unhealthy = true;
               }
            });
        });
    }

    this.special = this.name.indexOf(".") === 0 || this.name.indexOf("_") === 0;

	this.compare=function(b) { // TODO: take into account index properties?
		return this.name.localeCompare(b.name);
	};
	
	this.equals=function(index) { return index !== null && index.name == this.name; };
	
	this.closed=function() { return this.state === "close";	};
	
	this.open=function() { return this.state === "open"; };
}

