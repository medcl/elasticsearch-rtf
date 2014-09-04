function Cluster(state,status,nodes,settings, aliases) {
	this.created_at = new Date().getTime();

    this.disableAllocation = "false";
    var persistentAllocation = getProperty(settings, 'persistent.cluster.routing.allocation.enable', "all");
    var transientAllocation = getProperty(settings, 'transient.cluster.routing.allocation.enable', "");
    if (transientAllocation !== "") {
        this.disableAllocation = transientAllocation == "all" ? "false" : "true";
    } else {
        if (persistentAllocation != "all") {
            this.disableAllocation = "true";
        }
    }

	this.settings = settings;
	this.master_node = state.master_node;
	var num_nodes = 0;
    var total_size = 0;
    var num_docs = 0;

	this.nodes = Object.keys(state.nodes).map(function(x) {
		var node = new Node(x,state.nodes[x],nodes.nodes[x]);
        total_size += parseInt(node.size_in_bytes);
        num_docs += node.docs;
		num_nodes += 1;
		if (node.id === state.master_node) {
			node.setCurrentMaster();
		}
		return node;
	}).sort(function(a,b) { return a.compare(b); });
	this.number_of_nodes = num_nodes;
	var iRoutingTable = state.routing_table.indices;
	var iStatus = status.indices;

	var special_indices = 0;
	this.indices = Object.keys(iRoutingTable).map(
		function(x) {
			var index = new Index(x, state, iRoutingTable[x], iStatus[x], aliases[x]);
			if (index.special) {
				special_indices++;
			}
			return index;
		}
	);
    if (isDefined(state.blocks.indices)) {
        var indices = this.indices;
        Object.keys(state.blocks.indices).forEach(function(index) {
            indices.push(new Index(index));
        });
    }
    this.indices = this.indices.sort(function(a,b) { return a.compare(b); });

    this.special_indices = special_indices;
	this.num_docs = num_docs;
	this.total_indices = this.indices.length;

    this.shards = status._shards.total;
	this.failed_shards = status._shards.failed;
	this.successful_shards = status._shards.successful;
    this.unassigned_shards = state.routing_nodes.unassigned.length;

    this.total_size = readablizeBytes(total_size);
	this.total_size_in_bytes = total_size;
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