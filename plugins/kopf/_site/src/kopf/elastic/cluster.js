function Cluster(state,status,nodes,settings) {
	this.created_at = new Date().getTime();
	if (isDefined(state) && isDefined(status) && isDefined(nodes) && isDefined(settings)) {
		this.disableAllocation = false;
		if (isDefined(settings.persistent) && isDefined(settings.persistent.disable_allocation)) {
			this.disableAllocation = settings.persistent.disable_allocation;
		}
		// FIXME: 0.90/1.0 check
		if (isDefined(settings.transient) && isDefined(settings.transient['cluster.routing.allocation.disable_allocation'])) {
			this.disableAllocation = settings.transient['cluster.routing.allocation.disable_allocation'];
		} else {
			this.disableAllocation = getProperty(settings,'transient.cluster.routing.allocation.disable_allocation', "false");
		}
		this.settings = settings;
		this.master_node = state.master_node;
		var num_nodes = 0;
		this.nodes = Object.keys(state.nodes).map(function(x) { 
			var node = new Node(x,state.nodes[x],nodes.nodes[x]);
			num_nodes += 1;
			if (node.id === state.master_node) {
				node.setCurrentMaster();
			}
			return node;
		}).sort(function(a,b) { return a.compare(b); });
		this.number_of_nodes = num_nodes;
		var iMetadata = state.metadata.indices;
		var iRoutingTable = state.routing_table.indices;
		var iStatus = status.indices;
		var count = 0;
		var unassigned_shards = 0;
		var total_size = 0;
		var num_docs = 0;
		var special_indices = 0;
		this.indices = Object.keys(iMetadata).map(
			function(x) { 
				var index = new Index(x,iRoutingTable[x], iMetadata[x], iStatus[x]);
				if (index.isSpecial()) {
					special_indices++;
				}
				unassigned_shards += index.unassigned.length;
				total_size += parseInt(index.total_size);
				num_docs += index.num_docs;
				return index;
			}
		).sort(function(a,b) { return a.compare(b); });
		this.special_indices = special_indices;
		this.num_docs = num_docs;
		this.unassigned_shards = unassigned_shards;
		this.total_indices = this.indices.length;
		this.shards = status._shards.total;
		this.failed_shards = status._shards.failed;
		this.successful_shards = status._shards.successful;
		this.total_size = readablizeBytes(total_size);
		this.total_size_in_bytes = total_size;
		this.getNodes=function(name, data, master, client) { 
			return $.map(this.nodes,function(node) {
				return node.matches(name, data, master, client) ? node : null;
			});
		};
		
		this.changes = null;

		this.computeChanges=function(old_cluster) {
			var nodes = this.nodes;
			var indices = this.indices;
			var changes = new ClusterChanges();
			if (isDefined(old_cluster)) {
				// checks for node differences
				old_cluster.nodes.forEach(function(node) {
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
				
				if (old_cluster.nodes.length != nodes.length || !changes.hasJoins()) {
						nodes.forEach(function(node) {
							for (var i = 0; i < old_cluster.nodes.length; i++) {
								if (old_cluster.nodes[i].equals(node)) {
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
				old_cluster.indices.forEach(function(index) {
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
				
				if (old_cluster.indices.length != indices.length || !changes.hasCreatedIndices()) {
						indices.forEach(function(index) {
							for (var i = 0; i < old_cluster.indices.length; i++) {
								if (old_cluster.indices[i].equals(index)) {
									index = null;
									break;
								}
							}	
						if (isDefined(index)) {
							changes.addCreatedIndex(index);	
						}
					});
				}
				
				var docDelta = this.num_docs - old_cluster.num_docs;
				// var docRate = docDelta / ((this.created_at - old_cluster.created_at) / 1000);
				changes.setDocDelta(docDelta);
				
				var dataDelta = this.total_size_in_bytes - old_cluster.total_size_in_bytes;
				changes.setDataDelta(dataDelta);
			
			}
			this.changes = changes;
		};
		
		this.open_indices=function() {
			return $.map(this.indices, function(index) {
				if (index.state == 'open') {
					return index;
				} else {
					return null;
				}
			});
		};
	}
}