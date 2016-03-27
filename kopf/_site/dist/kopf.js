function Alias(alias, index, filter, index_routing, search_routing) {
	this.alias = isDefined(alias) ? alias.toLowerCase() : "";
	this.index = isDefined(index) ? index.toLowerCase() : "";
	this.filter = filter;
	this.index_routing = index_routing;
	this.search_routing = search_routing;

	this.validate=function() {
		if (!notEmpty(this.alias)) {
			throw "Alias must have a non empty name";
		}
		if (!notEmpty(this.index)) {
			throw "Alias must have a valid index name";
		}
	};

	this.equals=function(other_alias) {
		var equal = 
		(this.alias === other_alias.alias) &&
		(this.index === other_alias.index) &&
		(this.filter === other_alias.filter) &&
		(this.index_routing === other_alias.index_routing) &&
		(this.search_routing === other_alias.search_routing);
		return equal;
	};

	this.info=function() {
		var info = {};
		info.index = this.index;
		info.alias = this.alias;
	
		if (isDefined(this.filter)) {
			if (typeof this.filter == 'string' && notEmpty(this.filter)) {
				info.filter = JSON.parse(this.filter);
			} else {
				info.filter = this.filter;
			}
		}
		if (notEmpty(this.index_routing)) {
			info.index_routing = this.index_routing;
		}
		if (notEmpty(this.search_routing)) {
			info.search_routing = this.search_routing;
		}
		return info; 
	};
}
function Aliases(aliases_info) {
	var indices  = [];
	var aliases_map = {};
	Object.keys(aliases_info).forEach(function(index) {
		indices.push(index); // fills list of available indices
		var indexAliases = aliases_info[index].aliases;
		Object.keys(indexAliases).forEach(function(alias) { // group aliases per alias name
			if (!isDefined(aliases_map[alias])) {
				aliases_map[alias] = [];
			}
			var alias_instance = new Alias(alias, index, indexAliases[alias].filter, indexAliases[alias].index_routing,indexAliases[alias].search_routing);
			aliases_map[alias].push(alias_instance);
		});
	});
	this.indices = indices.sort(function(a,b) { return a.localeCompare(b); });
	this.info = aliases_map;
}

function ClusterChanges() {

	this.nodeJoins = null;
	this.nodeLeaves = null;
	this.indicesCreated = null;
	this.indicesDeleted = null;

	this.docDelta = 0;
	this.dataDelta = 0;
	
	this.setDocDelta=function(delta) {
		this.docDelta = delta;
	};
	
	this.getDocDelta=function() {
		return this.docDelta;
	};
	
	this.absDocDelta=function() {
		return Math.abs(this.docDelta);
	};
	
	this.absDataDelta=function() {
		return readablizeBytes(Math.abs(this.dataDelta));
	};
	
	this.getDataDelta=function() {
		return this.dataDelta;
	};
	
	this.setDataDelta=function(delta) {
		this.dataDelta = delta;
	};

	this.hasChanges=function() {
		return (
			isDefined(this.nodeJoins) ||
			isDefined(this.nodeLeaves) ||
			isDefined(this.indicesCreated) ||
			isDefined(this.indicesDeleted)
		);
	};

	this.addJoiningNode=function(node) {
		this.changes = true;
		if (!isDefined(this.nodeJoins)) {
			this.nodeJoins = [];
		}
		this.nodeJoins.push(node);
	};

	this.addLeavingNode=function(node) {
		this.changes = true;
		if (!isDefined(this.nodeLeaves)) {
			this.nodeLeaves = [];
		}
		this.nodeLeaves.push(node);
	};

	this.hasJoins=function() {
		return isDefined(this.nodeJoins);
	};

	this.hasLeaves=function() {
		return isDefined(this.nodeLeaves);
	};
	
	this.hasCreatedIndices=function() {
		return isDefined(this.indicesCreated);
	};
	
	this.hasDeletedIndices=function() {
		return isDefined(this.indicesDeleted);
	};
	
	this.addCreatedIndex=function(index) {
		if (!isDefined(this.indicesCreated)) {
			this.indicesCreated = [];
		}
		this.indicesCreated.push(index);
	};
	
	this.addDeletedIndex=function(index) {
		if (!isDefined(this.indicesDeleted)) {
			this.indicesDeleted = [];
		}
		this.indicesDeleted.push(index);
	};

}
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
	this.shards = this.active_shards + this.relocating_shards + this.unassigned_shards + this.initializing_shards;
	this.fetched_at = getTimeString(new Date());
}
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
function ElasticClient(connection) {
	this.host = connection.host;
	this.username = connection.username;
	this.password = connection.password;
	
	this.createAuthToken=function(username,password) {
		var auth = null;
		if (isDefined(username) && isDefined(password)) {
			auth = "Basic " + window.btoa(username + ":" + password);
		}
		return auth;
	};
	
	var auth = this.createAuthToken(connection.username, connection.password);
	var fetch_version = $.ajax({
		type: 'GET',
		url: connection.host + "/",
		beforeSend: function(xhr) { 
			if (isDefined(auth)) {
				xhr.setRequestHeader("Authorization", auth);
			} 
		},
		data: {},
		async: false
	});
	
	var client = this;
	fetch_version.done(function(response) {
		try {
			client.version = response.version.number;	
		} catch (error) {
			throw { message: "Version property could not bet read. Are you sure there is an ElasticSearch runnning at [" + connection.host + "]?", body: response };
		}
	});
	
	fetch_version.fail(function(error) {
		throw error.statusText;
	});

	this.is1=function() {
		return (this.version.substring(0, 2) == "1.");
	};

	this.createIndex=function(name, settings, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + name, settings, callback_success, callback_error);
	};

	this.enableShardAllocation=function(callback_success, callback_error) {
		var new_settings = {"transient":{ "cluster.routing.allocation.disable_allocation":false }};
		this.executeElasticRequest('PUT', "/_cluster/settings",JSON.stringify(new_settings, undefined, ""), callback_success, callback_error);
	};

	this.disableShardAllocation=function(callback_success, callback_error) {
		var new_settings = {"transient":{ "cluster.routing.allocation.disable_allocation":true }};
		this.executeElasticRequest('PUT', "/_cluster/settings",JSON.stringify(new_settings, undefined, ""), callback_success, callback_error);
	};

	this.getClusterState=function(callback_success, callback_error) {
		this.executeElasticRequest('GET', "/_cluster/state",{}, callback_success, callback_error);
	};

	this.shutdownNode=function(node_id, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/_cluster/nodes/" + node_id + "/_shutdown", {}, callback_success, callback_error);
	};

	this.openIndex=function(index, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + index + "/_open", {}, callback_success, callback_error);
	};

	this.optimizeIndex=function(index, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + index + "/_optimize", {}, callback_success, callback_error);
	};

	this.clearCache=function(index, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + index + "/_cache/clear", {}, callback_success, callback_error);
	};

	this.closeIndex=function(index, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + index + "/_close", {}, callback_success, callback_error);
	};

	this.refreshIndex=function(index, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/" + index + "/_refresh", {}, callback_success, callback_error);
	};

	this.deleteIndex=function(name, callback_success, callback_error) {
		this.executeElasticRequest('DELETE', "/" + name, {}, callback_success, callback_error);
	};

	this.updateIndexSettings=function(name, settings, callback_success, callback_error) {
		this.executeElasticRequest('PUT', "/" + name + "/_settings", settings, callback_success, callback_error);
	};

	this.updateClusterSettings=function(settings, callback_success, callback_error) {
		this.executeElasticRequest('PUT', "/_cluster/settings", settings, callback_success, callback_error);
	};

	this.getNodes=function(callback_success, callback_error) {
		var nodes = [];
		var createNodes = function(response) {
			Object.keys(response.response.nodes).forEach(function(node_id) {
				nodes.push(new Node(node_id,response.response.nodes[node_id]));
			});
			callback_success(nodes);
		};
		this.executeElasticRequest('GET', "/_cluster/state", {}, createNodes, callback_error);
	};

	this.fetchAliases=function(callback_success, callback_error) {
		var createAliases=function(response) {
			callback_success(new Aliases(response));
		};
		this.executeElasticRequest('GET', "/_aliases",{},createAliases, callback_error);
	};

	this.analyzeByField=function(index, type, field, text, callback_success, callback_error) {
		var buildTokens=function(response) {
			var tokens = response.tokens.map(function (token) {
				return new Token(token.token,token.start_offset,token.end_offset,token.position);
			});
			callback_success(tokens);
		};
		this.executeElasticRequest('GET', "/" + index + "/_analyze?field=" + type +"."+field,{'text':text}, buildTokens, callback_error);
	};

	this.analyzeByAnalyzer=function(index, analyzer, text, callback_success, callback_error) {
		var buildTokens=function(response) {
			var tokens = response.tokens.map(function (token) {
				return new Token(token.token,token.start_offset,token.end_offset,token.position);
			});
			callback_success(tokens);
		};
		this.executeElasticRequest('GET', "/" + index + "/_analyze?analyzer=" + analyzer,{'text':text}, buildTokens, callback_error);
	};

	this.updateAliases=function(add_aliases,remove_aliases, callback_success, callback_error) {
		var data = {};
		if (add_aliases.length === 0 && remove_aliases.length === 0) {
			throw "No changes were made: nothing to save";
		}
		data.actions = [];
		remove_aliases.forEach(function(alias) {
			data.actions.push({'remove':alias.info()});
		});
		add_aliases.forEach(function(alias) {
			data.actions.push({'add':alias.info()});
		});
		this.executeElasticRequest('POST', "/_aliases",JSON.stringify(data, undefined, ""), callback_success, callback_error);
	};

	this.getNodesStats=function(callback_success, callback_error) {
		this.executeElasticRequest('GET', "/_nodes/stats?all=true",{},callback_success, callback_error);
	};
	
	this.getIndexWarmers=function(index, warmer, callback_success, callback_error) {
		var path = "/" + index + "/_warmer/" + warmer.trim();
		this.executeElasticRequest('GET', path ,{},callback_success, callback_error);
	};
	
	this.deleteWarmupQuery=function(index, warmer, callback_success, callback_error) {
		var path = "/" + index + "/_warmer/" + warmer;
		this.executeElasticRequest('DELETE', path, {},callback_success, callback_error);
	};
	
	this.registerWarmupQuery=function(index, types, warmer_id, source, callback_success, callback_error) {
		var path = "/" + index + "/";
		if (notEmpty(types)) {
			path += types + "/";
		}
		path += "/_warmer/" + warmer_id.trim();
		this.executeElasticRequest('PUT', path ,source,callback_success, callback_error);
	};
	
	this.fetchPercolateQueries=function(index, body, callback_success, callback_error) {
		// FIXME: 0.90/1.0 check
		var path = isDefined(index) ? "/_percolator/" + index + "/_search" : "/_percolator/_search";
		if (this.is1()) {
			path = "/" + index + "/.percolator/_search";	
		} 
		this.executeElasticRequest('POST', path , body,callback_success, callback_error);
	};
	
	this.deletePercolatorQuery=function(index, id, callback_success, callback_error) {
		// FIXME: 0.90/1.0 check
		var path = "/_percolator/" + index + "/" + id;
		if (this.is1()) {
			path = "/" + index + "/.percolator/" + id;
		}
		this.executeElasticRequest('DELETE', path, {}, callback_success, callback_error);
	};
	
	this.createPercolatorQuery=function(index, id, body, callback_success, callback_error) {
		// FIXME: 0.90/1.0 check
		var path = "/_percolator/" + index + "/" + id;
		if (this.is1()) {
			path = "/" + index + "/.percolator/" + id;
		}
		this.executeElasticRequest('PUT', path, body, callback_success, callback_error);
	};
	
	this.getRepositories=function(callback_success, callback_error) {
		this.executeElasticRequest('GET', "/_snapshot/_all", {}, callback_success, callback_error);
	};

	this.createRepository=function(repository, body, callback_success, callback_error) {
		this.executeElasticRequest('POST', "/_snapshot/" + repository, body, callback_success, callback_error);
	};

	this.deleteRepository=function(repository, callback_success, callback_error) {
		this.executeElasticRequest('DELETE', "/_snapshot/" + repository, {}, callback_success, callback_error);
	};

	this.getSnapshots=function(repository, callback_success, callback_error){
		var path = "/_snapshot/" + repository + "/_all";
		this.executeElasticRequest('GET', path, {}, callback_success, callback_error);
	};

	this.deleteSnapshot=function(repository, snapshot, callback_success, callback_error){
		this.executeElasticRequest('DELETE', "/_snapshot/" + repository + "/" +snapshot, {}, callback_success, callback_error);
	};

	this.restoreSnapshot=function(repository, snapshot, body, callback_success, callback_error){
		this.executeElasticRequest('POST', "/_snapshot/" + repository + "/" +snapshot + "/_restore", body, callback_success, callback_error);
	};

	this.createSnapshot=function(repository, snapshot, body, callback_success, callback_error){
		this.executeElasticRequest('PUT', "/_snapshot/" + repository + "/" +snapshot, body, callback_success, callback_error );
	};

	this.executeElasticRequest=function(method, path, data, callback_success, callback_error) {
		var url = this.host + path;
		this.executeRequest(method,url,this.username,this.password, data, callback_success, callback_error);
	};
	
	this.executeRequest=function(method, url, username, password, data, callback_success, callback_error) {
		var auth = this.createAuthToken(username,password);
		$.when(
			$.ajax({
				type: method,
				url: url,
				beforeSend: function(xhr) {
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					}
				},
				data: data
		})).then(
			function(r) {
				callback_success(r);
			},
			function(error) {
				callback_error(error);
			}
		);
	};

	/** ####### END OF REFACTORED AREA ####### **/

	this.getClusterHealth=function(callback_success, callback_error) {
		var url = this.host + "/_cluster/health";
		var auth = this.createAuthToken(this.username,this.password);
		$.when(
			$.ajax({
				type: 'GET',
				url: url,
				dataType: 'json',
				data: {},
				beforeSend: function(xhr) {
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					}
				},
			})).then(
				function(cluster_health) {
					callback_success(new ClusterHealth(cluster_health));
				},
				function(cluster_health) {
					callback_error(cluster_health);
				}
		);
	};

	this.getClusterDetail=function(callback_success, callback_error) {
		var host = this.host;
		var auth = this.createAuthToken(this.username,this.password);
		$.when(
			$.ajax({ 
				type: 'GET', 
				url: host+"/_cluster/state", 
				dataType: 'json', 
				data: {},
				beforeSend: function(xhr) { 
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					} 
				}
			}),
			$.ajax({
				type: 'GET',
				url: host+"/_nodes/stats?all=true", 
				dataType: 'json', 
				data: {}, 
				beforeSend: function(xhr) { 
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					} 
				}
			}),
			$.ajax({
				type: 'GET',
				url: host+"/_status", 
				dataType: 'json', 
				data: {}, 
				beforeSend: function(xhr) { 
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					}
				}
			}),
			$.ajax({
				type: 'GET',
				url: host+"/_cluster/settings", 
				dataType: 'json', 
				data: {}, 
				beforeSend: function(xhr) { 
					if (isDefined(auth)) {
						xhr.setRequestHeader("Authorization", auth);
					} 
				}
			})
		).then(
			function(cluster_state,nodes_stats,cluster_status,settings) {
				callback_success(new Cluster(cluster_state[0],cluster_status[0],nodes_stats[0],settings[0]));
			},
			function(error) {
				callback_error(error);
			}
		);
	};

	this.getClusterDiagnosis=function(health, state, stats, hotthreads, callback_success,callback_error) {
		var host = this.host;
		var auth = this.createAuthToken(this.username,this.password);
		var deferreds = [];
		if (health) {
			deferreds.push(
				$.ajax({ 
					type: 'GET', 
					url: host+"/_cluster/health", 
					dataType: 'json', 
					data: {},
					beforeSend: function(xhr) { 
						if (isDefined(auth)) {
							xhr.setRequestHeader("Authorization", auth);
						} 
					}
				})
			);
		}
		if (state) {
			deferreds.push(
				$.ajax({ 
					type: 'GET', 
					url: host+"/_cluster/state", 
					dataType: 'json', 
					data: {},
					beforeSend: function(xhr) { 
						if (isDefined(auth)) {
							xhr.setRequestHeader("Authorization", auth);
						} 
					}
				})
			);
		}
		if (stats) {
			deferreds.push(
				$.ajax({ 
					type: 'GET', 
					url: host+"/_nodes/stats?all=true", 
					dataType: 'json', 
					data: {},
					beforeSend: function(xhr) { 
						if (isDefined(auth)) {
							xhr.setRequestHeader("Authorization", auth);
						} 
					}
				})
			);
		}
		if (hotthreads) {
			deferreds.push(
				$.ajax({ 
					type: 'GET', 
					url: host+"/_nodes/hot_threads", 
					data: {},
					beforeSend: function(xhr) { 
						if (isDefined(auth)) {
							xhr.setRequestHeader("Authorization", auth);
						} 
					}
				})	
			);
		}
		$.when.apply($, deferreds).then(
			function() {
				callback_success(arguments);
			},
			function(failed_request) {
				callback_error(failed_request);
			}
		);
	};
}













// Expects URL according to /^(https|http):\/\/(\w+):(\w+)@(.*)/i;
// Examples:
// http://localhost:9200
// http://user:password@localhost:9200
// https://localhost:9200
function ESConnection(url) {
	var protected_url = /^(https|http):\/\/(\w+):(\w+)@(.*)/i;
	this.host = "http://localhost:9200"; // default
	if (notEmpty(url)) {
		var connection_parts = protected_url.exec(url);
		if (isDefined(connection_parts)) {
			this.host = connection_parts[1] + "://" + connection_parts[4];
			this.username = connection_parts[2];
			this.password = connection_parts[3];
		} else {
			this.host = url;
		}		
	}
}
function Index(index_name,index_info, index_metadata, index_status) {
	this.name = index_name;
	var index_shards = {};
	this.shards = index_shards;
	this.metadata = {};
	this.aliases = getProperty(index_metadata,'aliases', []);

	this.visibleAliases=function() { return this.aliases.length > 5 ? this.aliases.slice(0,5) : this.aliases; };
	
	this.settings = index_metadata.settings;
	// FIXME: 0.90/1.0 check
	this.editable_settings = new EditableIndexSettings(index_metadata.settings);
	this.mappings = index_metadata.mappings;
	this.metadata.settings = this.settings;
	this.metadata.mappings = this.mappings;

	// FIXME: 0.90/1.0 check
	this.num_of_shards = getProperty(index_metadata.settings, 'index.number_of_shards');
	this.num_of_replicas = parseInt(getProperty(index_metadata.settings, 'index.number_of_replicas'));
	this.state = index_metadata.state;
	
	this.num_docs = getProperty(index_status, 'docs.num_docs', 0);
	this.max_doc = getProperty(index_status, 'docs.max_doc', 0);
	this.deleted_docs = getProperty(index_status, 'docs.deleted_docs', 0);
	this.size = getProperty(index_status, 'index.primary_size_in_bytes', 0);
	this.total_size = getProperty(index_status, 'index.size_in_bytes', 0);	
	this.size_in_bytes = readablizeBytes(this.size);
	this.total_size_in_bytes = readablizeBytes(this.total_size);
	
	var unassigned = [];

	// adds shard information
	
	var unhealthy = false;
	
	if (isDefined(index_info)) {
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
					
					if (new_shard.state == "RELOCATING" || new_shard.state == "INITIALIZING") {
						unhealthy = true;
					}
					
					index_shards[shard_routing.node].push(new_shard);				
				}
			});
		});
	}

	this.unhealthy = unhealthy || unassigned.length > 0;
	this.unassigned = unassigned;
	
	this.settingsAsString=function() {
		return prettyPrintObject(this.metadata);
	};
	this.compare=function(b) { // TODO: take into account index properties?
		return this.name.localeCompare(b.name);
	};
	
	this.getTypes=function() {
		return Object.keys(this.mappings).sort(function(a, b) { return a.localeCompare(b); });
	};
	
	this.getAnalyzers=function() {
		// FIXME: 0.90/1.0 check
		var analyzers = Object.keys(getProperty(this.settings,'index.analysis.analyzer', {}));
		if (analyzers.length === 0) {
			Object.keys(this.settings).forEach(function(setting) {
				if (setting.indexOf('index.analysis.analyzer') === 0) {
					var analyzer = setting.substring('index.analysis.analyzer.'.length);
					analyzer = analyzer.substring(0,analyzer.indexOf("."));
					if ($.inArray(analyzer, analyzers) == -1) {
						analyzers.push(analyzer);
					}
				}
			});			
		}
		return analyzers.sort(function(a, b) { return a.localeCompare(b); });
	};
	
	function isAnalyzable(type) {
		var non_analyzable_types = ['integer', 'long', 'float', 'double', 'multi_field'];
		return non_analyzable_types.indexOf(type) == -1;
	}
	
	this.getFields=function(type) {
		if (isDefined(this.mappings[type])) {
			var fields = this.mappings[type].properties;
			var validFields = [];
			Object.keys(fields).forEach(function(field) {
				// multi fields
				if (isDefined(fields[field].fields)) {
					var full_path = fields[field].path != 'just_name';
					var multi_fields = fields[field].fields;
					Object.keys(multi_fields).forEach(function(multi_field) {
						if (isAnalyzable(multi_fields[multi_field].type)) {
							if (field != multi_field && full_path) {
								validFields.push(field + "." + multi_field);		
							} else {
								validFields.push(multi_field);	
							}
						}
					});
				}
				// normal fields
				if (isAnalyzable(fields[field].type)) {
					validFields.push(field);
				}
			});
			return validFields.sort(function(a, b) { return a.localeCompare(b); });
		} else {
			return [];
		}
	};
	
	this.isSpecial=function() {
		return (
			this.name.indexOf(".") === 0 ||
			this.name.indexOf("_") === 0
		);
	};
	
	this.equals=function(index) {
		return index !== null && index.name == this.name;
	};
	
	this.closed=function() {
		return this.state === "close";
	};
	
	this.open=function() {
		return this.state === "open";
	};
}
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
function Node(node_id, node_info, node_stats) {
	this.id = node_id;	
	this.name = node_info.name;
	this.metadata = {};
	this.metadata.info = node_info;
	this.metadata.stats = node_stats;
	this.transport_address = node_info.transport_address;
	var master = node_info.attributes.master === 'false' ? false : true;
	var data = node_info.attributes.data === 'false' ? false : true;
	var client = node_info.attributes.client === 'true' ? true : false;
	this.master =  master && !client;
	this.data = data && !client;
	this.client = client || !master && !data;
	this.current_master = false;
	this.stats = node_stats;
	
	// FIXME: 0.90/1.0 check
	this.heap_used = readablizeBytes(getProperty(this.stats,'jvm.mem.heap_used_in_bytes'));
	this.heap_committed = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_committed_in_bytes'));
	this.heap_used_percent = getProperty(this.stats, 'jvm.mem.heap_used_percent');
	this.heap_max = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_max_in_bytes'));
	
	var total_in_bytes = 0;
	var free_in_bytes = 0;
	
	// FIXME: 0.90/1.0 check. HEap max and heap_percent are not available on 0.90.0
	if (!isDefined(this.heap_used_percent)) {
		var heap_used = getProperty(this.stats,'jvm.mem.heap_used_in_bytes');
		var heap_committed = getProperty(this.stats, 'jvm.mem.heap_committed_in_bytes');
		this.heap_used_percent = Math.round(100 * (heap_used / heap_committed));
		this.heap_max = this.heap_committed;
		
		// FIXME: 0.90/1.0 check. fs.total is not available on early 0.90
		var devices = getProperty(this.stats, 'fs.data');
		devices.forEach(function(device) {
			total_in_bytes += getProperty(device, 'total_in_bytes');
			free_in_bytes += getProperty(device, 'free_in_bytes');
		});
	} else {
		total_in_bytes = getProperty(this.stats, 'fs.total.total_in_bytes');
		free_in_bytes = getProperty(this.stats, 'fs.total.free_in_bytes');
	}
	
	this.disk_total = readablizeBytes(total_in_bytes);
	this.disk_free = readablizeBytes(free_in_bytes);
	this.disk_used_percent =  Math.round(100 * ((total_in_bytes - free_in_bytes) / total_in_bytes));
	
	this.cpu_user = getProperty(this.stats, 'os.cpu.user');
	this.cpu_sys = getProperty(this.stats, 'os.cpu.sys');
	this.docs = getProperty(this.stats, 'indices.docs.count');
	this.size = readablizeBytes(getProperty(this.stats, 'indices.store.size_in_bytes'));
	
	this.setCurrentMaster=function() {
		this.current_master = true;
	};

	this.equals=function(node) {
		return node.id === this.id;
	};

	this.compare=function(other) {
		if (other.current_master) return 1; // current master comes first
		if (this.current_master) return -1; // current master comes first
		if (other.master && !this.master) return 1; // master eligible comes first
		if (this.master && !other.master) return -1; // master eligible comes first
		if (other.data && !this.data) return 1; // data node comes first
		if (this.data && !other.data) return -1; // data node comes first
		return this.name.localeCompare(other.name); // if all the same, lex. sort
	};
	
	this.matches=function(name, data, master, client) {
		if (notEmpty(name)) {
			if (this.name.toLowerCase().indexOf(name.trim().toLowerCase()) == -1) {
				return false;
			}
		}
		return (data && this.data || master && this.master || client && this.client);
	};
}
function Shard(shard_routing, shard_info) {
	this.info = isDefined(shard_info) ? shard_info : shard_routing;
	this.primary = shard_routing.primary;
	this.shard = shard_routing.shard;
	this.state = shard_routing.state;
	this.node = shard_routing.node;
	this.index = shard_routing.index;
	this.id = this.node + "_" + this.shard + "_" + this.index;
}

function UnassignedShard(shard_info) {
	this.primary = shard_info.primary;
	this.shard = shard_info.shard;
	this.state = shard_info.state;
	this.node = shard_info.node;
	this.index = shard_info.index;
	this.id = this.node + "_" + this.shard + "_" + this.index;
}
/** TYPES **/
function Token(token, start_offset, end_offset, position) {
	this.token = token;
	this.start_offset = start_offset;
	this.end_offset = end_offset;
	this.position = position;
}
function Request(url, method, body) {
	this.timestamp = getTimeString(new Date());
	this.url = url;
	this.method = method;
	this.body = body;
	
	this.clear=function() {
		this.url = '';
		this.method = '';
		this.body = '';
	};
	
	this.loadFromJSON=function(json) {
		this.method = json.method;
		this.url = json.url;
		this.body = json.body;
		this.timestamp = json.timestamp;
		return this;
	};
	
	this.equals=function(request) {
		return (
			this.url === request.url &&
			this.method.toUpperCase() === request.method.toUpperCase() &&
			this.body === request.body
		);
	};
}

function AliasesPagination(page, results) {
	this.page = page;
	this.page_size = 10;
	this.results = results;
	this.alias_query = "";
	this.index_query = "";
	this.past_alias_query = null;
	this.past_index_query = null;
	this.total = 0;
	this.cached_results = null;
	
	this.firstResult=function() {
		if (Object.keys(this.getResults()).length > 0) {
			return ((this.current_page() - 1) * this.page_size) + 1;
		} else {
			return 0;
		}
	};
	
	this.lastResult=function() {
		if (this.current_page() * this.page_size > Object.keys(this.getResults()).length) {
			return Object.keys(this.getResults()).length;
		} else {
			return this.current_page() * this.page_size;
		}
	};

	this.hasNextPage=function() {
		return this.page_size * this.current_page() < Object.keys(this.getResults()).length;
	};
	
	this.hasPreviousPage=function() {
		return this.current_page() > 1;
	};
	
	this.nextPage=function() {
		this.page += 1;
	};
	
	this.previousPage=function() {
		this.page -= 1;
	};
	
	this.current_page=function() {
		if (this.alias_query != this.past_alias_query || this.index_query != this.past_index_query) {
			this.page = 1;
		}
		return this.page;
	};
	
	this.getPage=function() {
		var count = 1;
		var first_result = this.firstResult();
		var last_result = this.lastResult();
		var page = {};
		var results = this.getResults();
		Object.keys(results).forEach(function(alias) {
			if (count < first_result || count > last_result) {
				count += 1;
			} else {
				count += 1;
				page[alias] = results[alias];
			}
		});
		return page;
	};
	
	this.setResults=function(results) {
		this.results = results;
		// forces recalculation of page
		this.cached_results = null; 
	};
	
	this.total=function() {
		return Object.keys(this.getResults()).length;
	};
	
	this.getResults=function() {
		var matchingResults = {};
		var filters_changed = (this.alias_query != this.past_alias_query || this.index_query != this.past_index_query);
		if (filters_changed || !isDefined(this.cached_results)) { // if filters changed or no cached, calculate
			var alias_query = this.alias_query;
			var index_query = this.index_query;
			var results = this.results;
			Object.keys(results).forEach(function(alias_name) {
				if (isDefined(alias_query) && alias_query.length > 0) {
					if (alias_name.indexOf(alias_query) != -1) {
						if (isDefined(index_query) && index_query.length > 0) {
							results[alias_name].forEach(function(alias) {
								if (alias.index.indexOf(index_query) != -1) {
									matchingResults[alias_name] = results[alias_name];
								}
							});
						} else {
							matchingResults[alias_name] = results[alias_name];
						}
					} 
				} else {
					if (isDefined(index_query) && index_query.length > 0) {
						results[alias_name].forEach(function(alias) {
							if (alias.index.indexOf(index_query) != -1) {
								matchingResults[alias_name] = results[alias_name];
							}
						});
					} else {
						matchingResults[alias_name] = results[alias_name];
					}
				}
			});
			this.cached_results = matchingResults;
			this.past_alias_query = this.alias_query;
			this.past_index_query = this.index_query;
		}
		return this.cached_results;
	};
}

function ClusterNavigation() {
	this.page = 1;
	this.page_size = 5; // TODO: move it to a single place?

	this.query = "";
	this.previous_query = null;
	this.hide_special = true;
	
	this.data = true;
	this.master = true;
	this.client = true;
	this.state = "";
	this.node_name = "";
	this.cached_result = [];
	this.cluster_timestamp = null;	
	
	this.clone=function() {
		var instance = new ClusterNavigation();
		instance.page = this.page;
		instance.query = this.query;
		instance.hide_special = this.hide_special;
		instance.data = this.data;
		instance.master = this.master;
		instance.client = this.client;
		instance.state = this.state;
		instance.node_name = this.node_name;
		return instance;
	};
	
	this.equals=function(other) {
		return (
			other !== null &&
			this.page == other.page &&
			this.query == other.query &&
			this.hide_special == other.hide_special &&
			this.data == other.data &&
			this.master == other.master &&
			this.client == other.client &&
			this.state == other.state &&
			this.node_name == other.node_name 
		);
	};
	
}

function ModalControls() {
	this.alert = null;
	this.active = false;
	this.title = '';
	this.info = '';
}
var kopf = angular.module('kopf', []);

kopf.factory('IndexSettingsService', function() {
	return {index: null};
});

// manages behavior of confirmation dialog
kopf.factory('ConfirmDialogService', function() {
	this.header = "Default Header";
	this.body = "Default Body";
	this.cancel_text = "cancel";
	this.confirm_text = "confirm";
	
	this.confirm=function() {
		// when created, does nothing
	};
	
	this.close=function() {
		// when created, does nothing		
	};
	
	this.open=function(header, body, action, confirm_callback, close_callback) {
		this.header = header;
		this.body = body;
		this.action = action;
		this.confirm = confirm_callback;
		this.close = close_callback;
	};
	
	return this;
});

function AliasesController($scope, $location, $timeout, AlertService, AceEditorService) {
	$scope.aliases = null;
	$scope.new_index = {};
	$scope.pagination= new AliasesPagination(1, []);
	$scope.editor = undefined;
	
	$scope.viewDetails=function(alias) {
		$scope.details = alias;
	};

	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('alias-filter-editor');
		}
	};

	$scope.addAlias=function() {
		$scope.new_alias.filter = $scope.editor.format();
		if (!isDefined($scope.editor.error)) {
			try {
				$scope.new_alias.validate();
				// if alias already exists, check if its already associated with index
				if (isDefined($scope.aliases.info[$scope.new_alias.alias])) {
					var aliases = $scope.aliases.info[$scope.new_alias.alias];
					$.each(aliases,function(i, alias) {
						if (alias.index === $scope.new_alias.index) {
							throw "Alias is already associated with this index";
						}
					});
				} else {
					$scope.aliases.info[$scope.new_alias.alias] = [];
				}
				$scope.aliases.info[$scope.new_alias.alias].push($scope.new_alias);
				$scope.new_alias = new Alias();
				$scope.pagination.setResults($scope.aliases.info);
				AlertService.success("Alias successfully added. Note that changes made will only be persisted after saving changes");
			} catch (error) {
				AlertService.error(error ,null);
			}
		} else {
			AlertService.error("Invalid filter defined for alias" , $scope.editor.error);
		}
	};
	
	$scope.removeAlias=function(alias) {
		delete $scope.aliases.info[alias];
		$scope.pagination.setResults($scope.aliases.info);
		AlertService.success("Alias successfully removed. Note that changes made will only be persisted after saving changes");
	};
	
	$scope.removeAliasFromIndex=function(index, alias_name) {
		var aliases = $scope.aliases.info[alias_name];
		for (var i = 0; i < aliases.length; i++) {
			if (alias_name === aliases[i].alias && index === aliases[i].index) {
				$scope.aliases.info[alias_name].splice(i,1);
				AlertService.success("Alias successfully dissociated from index. Note that changes made will only be persisted after saving changes");
			}
		}
	};
	
	$scope.mergeAliases=function() {
		var deletes = [];
		var adds = [];
		Object.keys($scope.aliases.info).forEach(function(alias_name) {
			var aliases = $scope.aliases.info[alias_name];
			aliases.forEach(function(alias) {
				// if alias didnt exist, just add it
				if (!isDefined($scope.originalAliases.info[alias_name])) {
					adds.push(alias);
				} else {
					var originalAliases = $scope.originalAliases.info[alias_name];
					var addAlias = true;
					for (var i = 0; i < originalAliases.length; i++) {
						if (originalAliases[i].equals(alias)) {
							addAlias = false;
							break;
						}
					}
					if (addAlias) {
						adds.push(alias);
					}
				}
			});
		});
		Object.keys($scope.originalAliases.info).forEach(function(alias_name) {
			var aliases = $scope.originalAliases.info[alias_name];
			aliases.forEach(function(alias) {
				if (!isDefined($scope.aliases.info[alias.alias])) {
					deletes.push(alias);
				} else {
					var newAliases = $scope.aliases.info[alias_name];
					var removeAlias = true;
					for (var i = 0; i < newAliases.length; i++) {
						if (alias.index === newAliases[i].index && alias.equals(newAliases[i])) {
							removeAlias = false;
							break;
						}
					}
					if (removeAlias) {
						deletes.push(alias);
					}
				}
			});
		});
		$scope.client.updateAliases(adds,deletes,
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Aliases were successfully updated",response);
				});
				$scope.loadAliases();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating aliases",error);
				});
			}
		);
	};
	
	$scope._parseAliases = function(aliases) {
		$scope.originalAliases = aliases;
		$scope.aliases = jQuery.extend(true, {}, $scope.originalAliases);
		$scope.pagination.setResults($scope.aliases.info);
	};

	$scope.loadAliases=function() {
		$scope.new_alias = new Alias();
		$scope.client.fetchAliases(
			function(aliases) {
				$scope.updateModel(function() {
					$scope._parseAliases(aliases);
				});
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while fetching aliases",error);
				});
			}
		);
	};
	
    $scope.$on('loadAliasesEvent', function() {
		$scope.loadAliases();
		$scope.initEditor();
    });

}
function AnalysisController($scope, $location, $timeout, AlertService) {
	$scope.indices = null;

	// by index
	$scope.field_index = null;
	$scope.field_type = '';
	$scope.field_field = '';
	$scope.field_text = '';
	$scope.field_tokens = [];
	
	// By analyzer
	$scope.analyzer_index = '';
	$scope.analyzer_analyzer = '';
	$scope.analyzer_text = '';
	$scope.analyzer_tokens = [];
	
	$scope.analyzeByField=function() {
		if ($scope.field_field.length > 0 && $scope.field_text.length > 0) {
			$scope.field_tokens = null;
			$scope.client.analyzeByField($scope.field_index.name,$scope.field_type,$scope.field_field,$scope.field_text, 
				function(response) {
					$scope.updateModel(function() {
						$scope.field_tokens = response;
					});
				},
				function(error) {
					$scope.updateModel(function() {
						$scope.field_tokens = null;
						AlertService.error("Error while analyzing text", error);
					});
				}
			);
		}
	};
	
	$scope.analyzeByAnalyzer=function() {
		if ($scope.analyzer_analyzer.length > 0 && $scope.analyzer_text.length > 0) {
			$scope.analyzer_tokens = null;
			$scope.client.analyzeByAnalyzer($scope.analyzer_index.name,$scope.analyzer_analyzer,$scope.analyzer_text,
				function(response) {
					$scope.updateModel(function() {
						$scope.analyzer_tokens = response;
					});
				},
				function(error) {
					$scope.updateModel(function() {
						$scope.analyzer_tokens = null;
						AlertService.error("Error while analyzing text", error);
					});
				}
			);
		}
	};
	
	$scope.$on('loadAnalysisEvent', function() {
		$scope.indices = $scope.cluster.open_indices();
	});
	
}
function ClusterHealthController($scope,$location,$timeout,$sce, AlertService, ConfirmDialogService) {
	$scope.shared_url = '';
	$scope.results = null;
	
  $scope.$on('loadClusterHealth', function() {
		$('#cluster_health_option a').tab('show');
		$scope.results = null;
		// selects which info should be retrieved
		$scope.retrieveHealth = true;
		$scope.retrieveState = true;
		$scope.retrieveStats = true;
		$scope.retrieveHotThreads = true;
		
		$scope.gist_title = '';
  });
	
	$scope.checkPublishClusterHealth=function() {
		ConfirmDialogService.open(
			"Are you share you want to share your cluster information through a Gist?",
			"By sharing information through a public Gist you might be exposing sensitive information about your cluster, such as " +
			"host name, indices names and etc.",
			"Agree",
			function() {
				$scope.confirm_share = true;
				$scope.publishClusterHealth();
			}
		);
	};
	
	$scope.loadClusterHealth=function() {
		var results = {};
		$scope.results = null;
		var info_id = AlertService.info("Loading cluster health state. This could take a few moments.",{},30000);
		$scope.client.getClusterDiagnosis($scope.retrieveHealth, $scope.retrieveState, $scope.retrieveStats, $scope.retrieveHotThreads,
			function(responses) {
				$scope.state = '';
				if (!(responses[0] instanceof Array)) {
					responses = [responses]; // so logic bellow remains the same in case result is not an array
				}
				var idx = 0;
				if ($scope.retrieveHealth) {
					results.health_raw = responses[idx++][0];
					results.health = $sce.trustAsHtml(JSONTree.create(results.health_raw));
				}
				if ($scope.retrieveState) {
					results.state_raw = responses[idx++][0];
					results.state =  $sce.trustAsHtml(JSONTree.create(results.state_raw));
				}
				if ($scope.retrieveStats) {
					results.stats_raw = responses[idx++][0];
					results.stats = $sce.trustAsHtml(JSONTree.create(results.stats_raw));
				}
				if ($scope.retrieveHotThreads) {
					results.hot_threads = responses[idx][0];
				}
				$scope.updateModel(function() {
					$scope.results = results;
					$scope.state = '';
					AlertService.remove(info_id);
				});
			},
			function(failed_request) {
				$scope.updateModel(function() {
					AlertService.remove(info_id);
					AlertService.error("Error while retrieving cluster health information", failed_request.responseText);
				});
			}
		);
	};

	$scope.publishClusterHealth=function() {
		var gist = {};
		gist.description = isDefined($scope.gist_title) ? $scope.gist_title : 'Cluster information delivered by kopf';
		gist.public = true;
		gist.files = {};
		if (isDefined($scope.results)) {
			if (isDefined($scope.results.health_raw)) {
				gist.files.health = {'content': JSON.stringify($scope.results.health_raw, undefined, 4),'indent':'2', 'language':'JSON'};
			}
			if (isDefined($scope.results.state_raw)) {
				gist.files.state = {'content': JSON.stringify($scope.results.state_raw, undefined, 4),'indent':'2', 'language':'JSON'};	
			}
			if (isDefined($scope.results.stats_raw)) {
				gist.files.stats = {'content': JSON.stringify($scope.results.stats_raw, undefined, 4),'indent':'2', 'language':'JSON'} ;
			}
			if (isDefined($scope.results.hot_threads)) {
				gist.files.hot_threads = {'content':$scope.results.hot_threads,'indent':'2', 'language':'JSON'};
			}
		}
		var data = JSON.stringify(gist, undefined, 4);
		$.ajax({ type: 'POST', url: "https://api.github.com/gists", dataType: 'json', data: data})
			.done(function(response) { 
				$scope.updateModel(function() {
					$scope.addToHistory(new Gist(gist.description, response.html_url));
					AlertService.success("Cluster health information successfully shared at: " + response.html_url, null, 60000);
				});
			})
			.fail(function(response) {
				$scope.updateModel(function() {
					AlertService.error("Error while publishing Gist", responseText);
				});
			}
		);
	};
	
	$scope.addToHistory=function(gist) {
		$scope.gist_history.unshift(gist);
		if ($scope.gist_history.length > 30) {
			$scope.gist_history.length = 30;
		}
		localStorage.kopf_gist_history = JSON.stringify($scope.gist_history);
	};
	
	$scope.loadHistory=function() {
		var history = [];
		if (isDefined(localStorage.kopf_gist_history)) {
			try {
				history = JSON.parse(localStorage.kopf_gist_history).map(function(h) {
					return new Gist().loadFromJSON(h);
				});
			} catch (error) {
				localStorage.kopf_gist_history = null;
			}
		} 
		return history;
	};
	
	$scope.gist_history = $scope.loadHistory();

}
function ClusterOverviewController($scope, $location, $timeout, IndexSettingsService, ConfirmDialogService, AlertService, SettingsService) {
	$scope.settings_service = SettingsService;
	$scope.idxSettingsSrv = IndexSettingsService;
	$scope.dialog_service = ConfirmDialogService;
	$scope.pagination = new ClusterNavigation();
	$scope.previous_pagination = null;
	
	
	$scope.getNodes=function() {
		if (isDefined($scope.cluster)) {
			return $scope.cluster.getNodes($scope.pagination.node_name, $scope.pagination.data,$scope.pagination.master,$scope.pagination.client);	
		}
	};
	
	$scope.closeModal=function(forced_refresh){
		if (forced_refresh) {
			$scope.refreshClusterState();
		}
	};
	
	$scope.shutdown_node=function(node_id, node_name) {
		$scope.dialog_service.open(
			"are you sure you want to shutdown node " + node_name + "?",
			"Shutting down a node will make all data stored in this node inaccessible, unless this data is replicated across other nodes." +
			"Replicated shards will be promoted to primary if the primary shard is no longer reachable.",
			"Shutdown",
			function() {
				var response = $scope.client.shutdownNode(node_id,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Node [" + node_id + "] successfully shutdown", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while shutting down node",error);
						});
					}
				);
			}
		);
	};

	$scope.optimizeIndex=function(index){
		$scope.dialog_service.open(
			"are you sure you want to optimize index " + index + "?",
			"Optimizing an index is a resource intensive operation and should be done with caution."+
			"Usually, you will only want to optimize an index when it will no longer receive updates",
			"Optimize",
			function() {
				$scope.client.optimizeIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully optimized", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while optimizing index", error);
						});
					}				
				);
			}
		);
	};
	
	$scope.deleteIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to delete index " + index + "?",
			"Deleting an index cannot be undone and all data for this index will be lost",
			"Delete",
			function() {
				$scope.client.deleteIndex(index, 
					function(response) {
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting index", error);
						});
					}	
				);
			}
		);
	};
	
	$scope.clearCache=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to clear the cache for index " + index + "?",
			"This will clear all caches for this index.",
			"Clear",
			function() {
				$scope.client.clearCache(index,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index cache was successfully cleared", response);
						});
						$scope.refreshClusterState();						
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while clearing index cache", error);
						});
					}
				);
			}
		);
	};

	$scope.refreshIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to refresh index " + index + "?",
			"Refreshing an index makes all operations performed since the last refresh available for search.",
			"Refresh",
			function() {
				$scope.client.refreshIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully refreshed", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while refreshing index", error);	
						});
					}
				);
			}
		);
	};
	
	$scope.enableAllocation=function() {
		var response = $scope.client.enableShardAllocation(
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Shard allocation was successfully enabled", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while enabling shard allocation", error);	
				});
			}
		);
	};
	
	$scope.disableAllocation=function(current_state) {
		var response = $scope.client.disableShardAllocation(
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Shard allocation was successfully disabled", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while disabling shard allocation", error);	
				});
			}
		);
	};
	
	$scope.closeIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to close index " + index + "?",
			"Closing an index will remove all it's allocated shards from the cluster. " +
			"Both searches and updates will no longer be accepted for the index." +
			"A closed index can be reopened at any time",
			"Close index",
			function() {
				$scope.client.closeIndex(index, 
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully closed", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while closing index", error);	
						});
					}
				);
			}
		);
	};
	
	$scope.openIndex=function(index) {
		$scope.dialog_service.open(
			"are you sure you want to open index " + index + "?",
			"Opening an index will trigger the recovery process for the index. " +
			"This process could take sometime depending on the index size.",
			"Open index",
			function() {
				$scope.client.openIndex(index,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Index was successfully opened", response);
						});
						$scope.refreshClusterState();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while opening index", error);
						});
					}
				);
			}
		);
	};
	
	$scope.loadIndexSettings=function(index) {
		$('#index_settings_option a').tab('show');
		var indices = $scope.cluster.indices.filter(function(i) {
			return i.name == index;
		});
		$scope.idxSettingsSrv.index = indices[0];
		$('#idx_settings_tabs a:first').tab('show');
		$(".setting-info").popover();		
	};
	
	
	$scope.firstResult=function() {
		if ($scope.getResults().length > 0) {
			return (($scope.current_page() - 1) * $scope.pagination.page_size) + 1;
		} else {
			return 0;
		}
	};
	
	$scope.lastResult=function() {
		if ($scope.current_page() * $scope.pagination.page_size > $scope.getResults().length) {
			return $scope.getResults().length;
		} else {
			return $scope.current_page() * $scope.pagination.page_size;
		}
	};

	$scope.hasNextPage=function() {
		return $scope.pagination.page_size * $scope.current_page() < $scope.getResults().length;
	};
	
	$scope.hasPreviousPage=function() {
		return $scope.current_page() > 1;
	};
	
	$scope.nextPage=function() {
		$scope.pagination.page += 1;
	};
	
	$scope.previousPage=function() {
		$scope.pagination.page -= 1;
	};
	
	$scope.total=function() {
		return $scope.getResults().length;
	};
	
	$scope.current_page=function() {
		if ($scope.pagination.query != $scope.pagination.previous_query) {
			$scope.pagination.previous_query = $scope.pagination.query;
			$scope.pagination.page = 1;
		}
		return $scope.pagination.page;
	};
	
	$scope.getPage=function() {
		var count = 1;
		var first_result = $scope.firstResult();
		var last_result = $scope.lastResult();
		var page = $.map($scope.getResults(),function(i) {
			if (count < first_result || count > last_result) {
				count += 1;
				return null;
			}
			count += 1;
			return i;
		});
		return page;
	};
	
	$scope.index=function(index) {
		var page = $scope.getPage();
		if (isDefined(page[index])) {
			return page[index];
		} else {
			return null;
		}
	};
	
	$scope.getResults=function() {
		if ($scope.cluster !== null && ($scope.pagination.cluster_timestamp === null || $scope.pagination.cluster_timestamp != $scope.cluster.created_at|| !$scope.pagination.equals($scope.previous_pagination))) {
			var indices = isDefined($scope.cluster) ? $scope.cluster.indices : [];
			var query = $scope.pagination.query;
			var state = $scope.pagination.state;
			var hide_special = $scope.pagination.hide_special;
			$scope.pagination.cached_result = $.map(indices,function(i) {
				if (hide_special && i.isSpecial()) {
					return null;
				}
				
				if (notEmpty(query)) {
					if (i.name.toLowerCase().indexOf(query.trim().toLowerCase()) == -1) {
						return null;
					} 
				}
				
				if (state.length > 0) {
					if (state == "unhealthy") {
						if (!i.unhealthy) {
							return null;							
						}
					} else if ((state == "open" || state == "close") && state != i.state) {
						return null;						
					}
				} 
				return i;
			});
			$scope.previous_pagination = $scope.pagination.clone();
			$scope.pagination.cluster_timestamp = $scope.cluster.created_at;
		}
		return $scope.pagination.cached_result;
	};
	
}
function ClusterSettingsController($scope, $location, $timeout, AlertService) {

	$scope.$on('loadClusterSettingsEvent', function() {
		$('#cluster_settings_option a').tab('show');
		$('#cluster_settings_tabs a:first').tab('show');
		$(".setting-info").popover();
		$scope.active_settings = "transient"; // remember last active?
		$scope.settings = new ClusterSettings($scope.cluster.settings);
	});

	$scope.save=function() {
		var response = $scope.client.updateClusterSettings(JSON.stringify($scope.settings, undefined, ""),
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Cluster settings were successfully updated",response);
				});
				$scope.refreshClusterState();
			}, 
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating cluster settings",error);
				});
			}
		);
	};
}
function CreateIndexController($scope, $location, $timeout, AlertService) {
	$scope.settings = '';
	$scope.shards = '';
	$scope.replicas = '';
	$scope.name = '';
	$scope.indices = [];

	$scope.editor = new AceEditor('index-settings-editor');
	
    $scope.$on('loadCreateIndex', function() {
		$('#create_index_option a').tab('show');
		$scope.prepareCreateIndex();
    });

	$scope.updateEditor=function() {
		$scope.editor.setValue($scope.settings);
	};
	
	$scope.createIndex=function() {
		if ($scope.name.trim().length === 0) {
			AlertService.error("You must specify a valid index name", null);	
		} else {
			var settings = {};
			var content = $scope.editor.getValue();
			if (content.trim().length > 0) {
				try {
					settings = JSON.parse(content);
				} catch (error) {
					throw "Invalid JSON: " + error;
				}
			} 
			if (!isDefined(settings.settings)) {
				settings = {"settings":settings};
			} 
			if (!isDefined(settings.settings.index)) {
				settings.settings.index = {};
			} 
			var index_settings = settings.settings.index;
			if ($scope.shards.trim().length > 0) {
				index_settings.number_of_shards = $scope.shards;
			}
			if ($scope.replicas.trim().length > 0) {
				index_settings.number_of_replicas = $scope.replicas;
			}
			$scope.client.createIndex($scope.name, JSON.stringify(settings, undefined, ""), 
				function(response) {
					$scope.refreshClusterState();
				}, function(error) { 
					$scope.updateModel(function() {
						AlertService.error("Error while creating index", error);
					});
				}
			);
		}
	};
	
	$scope.prepareCreateIndex=function() {
		$scope.indices = $scope.cluster.indices;
		$scope.settings = "";
		$scope.editor.setValue("{}");
		$scope.shards = '';
		$scope.name = '';
		$scope.replicas = '';
	};
}
function GlobalController($scope, $location, $timeout, $sce, ConfirmDialogService, AlertService, SettingsService, ThemeService) {
	$scope.dialog = ConfirmDialogService;
	$scope.version = "0.5.8";
	$scope.username = null;
	$scope.password = null;
	$scope.alert_service = AlertService;
	
	$scope.home_screen=function() {
		$('#cluster_option a').tab('show');
	};
	
	$scope.getTheme=function() {
		return ThemeService.getTheme();
	};
	
	$scope.setConnected=function(status) {
		if (!status) {
			$scope.cluster = null;
			$scope.cluster_health = null;
		}
		$scope.is_connected = status;
	};

	$scope.broadcastMessage=function(message,args) {
		$scope.$broadcast(message,args);
	};
	
	$scope.readParameter=function(name){
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(window.location.href);
		return isDefined(results) ? results[1] : null;
	};
	
	$scope.setHost=function(url) {
		if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
			url = "http://" + url;
		}
		$scope.connection = new ESConnection(url);
		$scope.setConnected(false);
		try {
			$scope.client = new ElasticClient($scope.connection);
			$scope.home_screen();
		} catch (error) {
			$scope.client = null;
			AlertService.error(error.message, error.body);
		}
	};
	
	$scope.connect=function() {
		// when opening from filesystem, just try default ES location
		if ($location.host() === "") {
			$scope.setHost("http://localhost:9200");
		} else {
			var location = $scope.readParameter('location');
			// reads ES location from url parameter
			if (isDefined(location)) {
				$scope.setHost(location);
			} else { // uses current location as ES location
				var absUrl = $location.absUrl();
				var cutIndex = absUrl.indexOf("/_plugin/kopf");
				$scope.setHost(absUrl.substring(0,cutIndex));
			}
		}		
	};
	
	$scope.connect();

	$scope.modal = new ModalControls();
	$scope.alert = null;
	$scope.is_connected = false;

	$scope.alertClusterChanges=function() {
		if (isDefined($scope.cluster)) {
			var changes = $scope.cluster.changes;
			if (changes.hasChanges()) {
				if (changes.hasJoins()) {
					var joins = changes.nodeJoins.map(function(node) { return node.name + "[" + node.transport_address + "]"; });
					AlertService.info(joins.length + " new node(s) joined the cluster", joins);
				}
				if (changes.hasLeaves()) {
					var leaves = changes.nodeLeaves.map(function(node) { return node.name + "[" + node.transport_address + "]"; });
					AlertService.warn(changes.nodeLeaves.length + " node(s) left the cluster", leaves);
				}
				if (changes.hasCreatedIndices()) {
					var created = changes.indicesCreated.map(function(index) { return index.name; });
					AlertService.info(changes.indicesCreated.length + " indices created: [" + created.join(",") + "]");
				}
				if (changes.hasDeletedIndices()) {
					var deleted = changes.indicesDeleted.map(function(index) { return index.name; });
					AlertService.info(changes.indicesDeleted.length + " indices deleted: [" + deleted.join(",") + "]");
				}
			}
		}
	};
		
	$scope.refreshClusterState=function() {
		if (isDefined($scope.client)) {
			$timeout(function() { 
				$scope.client.getClusterDetail(
					function(cluster) {
						$scope.updateModel(function() { 
							cluster.computeChanges($scope.cluster);
							$scope.cluster = cluster;
							$scope.alertClusterChanges();
						});
					},
					function(error) {
						$scope.updateModel(function() { 
							AlertService.error("Error while retrieving cluster information", error);
							$scope.cluster = null; 
						});
					}
				);
			
				$scope.client.getClusterHealth( 
					function(cluster) {
						$scope.updateModel(function() { 
							$scope.cluster_health = cluster;
							$scope.setConnected(true);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							$scope.cluster_health = null;
							$scope.setConnected(false);
							AlertService.error("Error connecting to [" + $scope.host + "]",error);						
						});
					}
				);
			}, 100);			
		}
	};

	$scope.autoRefreshCluster=function() {
		$scope.refreshClusterState();
		$timeout(function() { $scope.autoRefreshCluster(); }, SettingsService.getRefreshInterval());	
	};
	
	$scope.autoRefreshCluster();

	$scope.hasConnection=function() {
		return $scope.is_connected;
	};
	
	$scope.isActive=function(tab) {
		return $('#' + tab).hasClass('active');
	};
	
	$scope.displayInfo=function(title,info) {
		$scope.modal.title = title;
		$scope.modal.info = $sce.trustAsHtml(JSONTree.create(info));
		$('#modal_info').modal({show:true,backdrop:true});
	};
	
	$scope.getCurrentTime=function() {
		return getTimeString(new Date());
	};
	
	$scope.selectTab=function(event) {
		AlertService.clear();
		if (isDefined(event)) {
			$scope.broadcastMessage(event, {});
		}
	};
	
	$scope.updateModel=function(action) {
		$scope.$apply(action);
	};

}
function IndexSettingsController($scope, $location, $timeout, IndexSettingsService, AlertService) {
	$scope.service = IndexSettingsService;

	$scope.save=function() {
		var index = $scope.service.index;
		var new_settings = {};
		// TODO: could move that to editable_index_settings model
		index.editable_settings.valid_settings.forEach(function(setting) {
			if (notEmpty(index.editable_settings[setting])) {
				new_settings[setting] = index.editable_settings[setting];
			}
		});
		$scope.client.updateIndexSettings(index.name, JSON.stringify(new_settings, undefined, ""),
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Index settings were successfully updated", response);
				});
				$scope.refreshClusterState();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating index settings", error);
				});
			}
		);
	};
 }
function NavbarController($scope, $location, $timeout, AlertService, SettingsService, ThemeService) {
	$scope.settings_service = SettingsService;
	$scope.new_refresh = $scope.settings_service.getRefreshInterval();
	$scope.theme = ThemeService.getTheme();
	
    $scope.connectToHost=function(event) {
		if (event.keyCode == 13) {
			if (isDefined($scope.new_host) && $scope.new_host.length > 0) {
				$scope.setHost($scope.new_host);
				$scope.refreshClusterState();
			}			
		}
	};
	
	$scope.changeRefresh=function() {
		$scope.settings_service.setRefreshInterval($scope.new_refresh);
	};
	
	$scope.changeTheme=function() {
		ThemeService.setTheme($scope.theme);
	};

}

function RestController($scope, $location, $timeout, AlertService, AceEditorService) {
	
	$scope.request = new Request($scope.connection.host + "/_search","GET","{}");
	$scope.validation_error = null;

	$scope.loadHistory=function() {
		var history = [];
		if (isDefined(localStorage.kopf_request_history)) {
			try {
				history = JSON.parse(localStorage.kopf_request_history).map(function(h) {
					return new Request().loadFromJSON(h);
				});
			} catch (error) {
				localStorage.kopf_request_history = null;
			}
		}
		return history;
	};
	
	$scope.history = $scope.loadHistory();
	$scope.history_request = null;

	if(!angular.isDefined($scope.editor)){
		$scope.editor = AceEditorService.init('rest-client-editor');
	}

	$scope.editor.setValue($scope.request.body);

	$scope.loadFromHistory=function(history_request) {
		$scope.request.url = history_request.url;
		$scope.request.body = history_request.body;
		$scope.request.method = history_request.method;
		$scope.editor.setValue(history_request.body);
		$scope.history_request = null;
	};

	$scope.addToHistory=function(history_request) {
		var exists = false;
		for (var i = 0; i < $scope.history.length; i++) {
			if ($scope.history[i].equals(history_request)) {
				exists = true;
				break;
			}
		}
		if (!exists) {
			$scope.history.unshift(history_request);
			if ($scope.history.length > 30) {
				$scope.history.length = 30;
			}
			localStorage.kopf_request_history = JSON.stringify($scope.history);
		}
	};

	$scope.sendRequest=function() {
		$scope.request.body = $scope.editor.format();
		$('#rest-client-response').html('');
		if (notEmpty($scope.request.url)) {
			// TODO: deal with basic auth here
			if ($scope.request.method == 'GET' && '{}' !== $scope.request.body) {
				AlertService.info("You are executing a GET request with body content. Maybe you meant to use POST or PUT?");
			}
			$scope.client.executeRequest($scope.request.method,$scope.request.url,null,null,$scope.request.body,
				function(response) {
					var content = response;
					try {
						content = JSONTree.create(response);
					} catch (parsing_error) {
						// nothing to do
					}
					$('#rest-client-response').html(content);
					$scope.updateModel(function() {
						$scope.addToHistory(new Request($scope.request.url,$scope.request.method,$scope.request.body));
					});

				},
				function(error) {
					$scope.updateModel(function() {
						if (error.status !== 0) {
							AlertService.error("Request was not successful: " + error.statusText);
						} else {
							AlertService.error($scope.request.url + " is unreachable");
						}
					});
					try {
						$('#rest-client-response').html(JSONTree.create(JSON.parse(error.responseText)));
					} catch (invalid_json) {
						$('#rest-client-response').html(error.responseText);
					}
				}
			);
		}
	};
}
function PercolatorController($scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {
	$scope.editor = undefined;
	$scope.total = 0;
	$scope.queries = [];
	$scope.page = 1;
	$scope.filter = "";
	$scope.id = "";
	
	$scope.index = null;
	$scope.indices = [];
	$scope.new_query = new PercolateQuery({});
	
	$scope.$on('loadPercolatorEvent', function() {
		$scope.indices = $scope.cluster.indices;
		$scope.initEditor();
    });
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('percolator-query-editor');
		}
	};

	$scope.previousPage=function() {
		$scope.page -= 1;
		$scope.loadPercolatorQueries();
	};
	
	$scope.nextPage=function() {
		$scope.page += 1;
		$scope.loadPercolatorQueries();
	};
	
	$scope.hasNextPage=function() {
		return $scope.page * 10 < $scope.total;
	};
	
	$scope.hasPreviousPage=function() {
		return $scope.page > 1;
	};
	
	$scope.firstResult=function() {
		return $scope.total > 0 ? ($scope.page - 1) * 10  + 1 : 0;
	};
	
	$scope.lastResult=function() {
		return $scope.hasNextPage() ? $scope.page * 10 : $scope.total;
	};
	
	$scope.parseSearchParams=function() {
		var queries = [];
		if ($scope.id.trim().length > 0) {
			queries.push({"term":{"_id":$scope.id}});
		}
		if ($scope.filter.trim().length > 0) {
			var filter = JSON.parse($scope.filter);
			Object.keys(filter).forEach(function(field) {
				var q = {};
				q[field] = filter[field];
				queries.push({"term": q});
			});
		}
		return queries;
	};
	
	$scope.deletePercolatorQuery=function(query) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + query.id + " for index " + query.index + "?",
			query.sourceAsJSON(),
			"Delete",
			function() {
				$scope.client.deletePercolatorQuery(query.index, query.id,
					function(response) {
						var refreshIndex = $scope.client.is1() ? query.index : '_percolator';
						$scope.client.refreshIndex(refreshIndex,
							function(response) {
								$scope.updateModel(function() {
									AlertService.success("Query successfully deleted", response);
									$scope.loadPercolatorQueries();
								});
							},
							function(error) {
								$scope.updateModel(function() {
									AlertService.error("Error while reloading queries", error);
								});
							}
						);
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting query", error);
						});
					}
				);
			}
		);
	};
	
	$scope.createNewQuery=function() {
		if (!notEmpty($scope.new_query.index) || !notEmpty($scope.new_query.id)) {
			AlertService.error("Both index and query id must be specified");
			return;
		}
		
		$scope.new_query.source = $scope.editor.format();
		if (isDefined($scope.editor.error)) {
			AlertService.error("Invalid percolator query");
			return;
		}
		
		if (!notEmpty($scope.new_query.source)) {
			AlertService.error("Query must be defined");
			return;
		}
		$scope.client.createPercolatorQuery($scope.new_query.index, $scope.new_query.id, $scope.new_query.source,
			function(response) {
				var refreshIndex = $scope.client.is1() ? $scope.new_query.index : '_percolator';
				$scope.client.refreshIndex(refreshIndex,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Percolator Query successfully created", response);
							$scope.index = $scope.new_query.index;
							$scope.loadPercolatorQueries();
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.success("Error while reloading queries", error);
						});
					}
				);
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while creating percolator query", error);
				});
			}
		);
	};
	
	$scope.searchPercolatorQueries=function() {
		if (isDefined($scope.index)) {
			$scope.loadPercolatorQueries();
		} else {
			AlertService.info("No index is selected");
		}
	};
	
	$scope.loadPercolatorQueries=function() {
		var params = {};
		try {
			var queries = $scope.parseSearchParams();
			if (queries.length > 0) {
				params.query = {"bool": {"must": queries}};
			}
			params.from = (($scope.page - 1) * 10);
			$scope.client.fetchPercolateQueries($scope.index, JSON.stringify(params),
				function(response) {
					$scope.updateModel(function() {
						$scope.total = response.hits.total;
						$scope.queries = response.hits.hits.map(function(q) { return new PercolateQuery(q); });
					});
				},
				function(error) {
					if (!(isDefined(error.responseJSON) && error.responseJSON.error == "IndexMissingException[[_percolator] missing]")) {
						$scope.updateModel(function() {
							AlertService.error("Error while reading loading percolate queries", error);
						});
					}
				}
			);
		} catch (error) {
			AlertService.error("Filter is not a valid JSON");
			return;
		}
	};
	
}

function PercolateQuery(query_info) {
	// FIXME: 0.90/1.0 check
	if (query_info._index == '_percolator') {
		this.index = query_info._type;
	} else {
		this.index = query_info._index;
	}
	this.id = query_info._id;
	this.source = query_info._source;
	
	this.sourceAsJSON=function() {
		try {
			return JSON.stringify(this.source,undefined, 2);
		} catch (error) {

		}
	};
	
	this.equals=function(other) {
		return (other instanceof PercolateQuery &&
			this.index == other.index &&
			this.id == other.id && 
			this.source == other.source);
	};
}
function RepositoryController($q, $scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {

	$scope.dialog_service = ConfirmDialogService;
	$scope.repositories = [];
	$scope.repositories_names = [];
	$scope.snapshots = [];
	$scope.indices = [];
	$scope.restorable_indices = [];
	$scope.new_repo = {};
	$scope.new_snap = {};
	$scope.restore_snap = {};
	$scope.editor = undefined;

    $scope.$on('loadRepositoryEvent', function() {
		$scope.reload();
		$scope.initEditor();
    });
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('repository-settings-editor');
		}
	};

	$scope.loadIndices=function() {
		if( angular.isDefined($scope.cluster) )
		{
			$scope.indices = $scope.cluster.indices || [];
		}
	};

    $scope.reload=function(){
		$scope.loadRepositories().then(
							function() {
								$scope.allSnapshots($scope.repositories)
							});
		$scope.loadIndices();
    };

    $scope.optionalParam=function(body, object, paramname){
		if(angular.isDefined(object[paramname]))
		{
			body[paramname] = object[paramname];
		}
		return body;
    };

	$scope.deleteRepository=function(name, value){
		$scope.dialog_service.open(
			"are you sure you want to delete repository " + name + "?",
			value,
			"Delete",
			function() {
				$scope.client.deleteRepository(name,
					function(response) {
						AlertService.success("Repository successfully deleted", response);
						$scope.reload();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting repositor", error);
						});
					}
				);
			}
		);
	};

	$scope.restoreSnapshot=function(){

		var body = {}
		// dont add to body if not present, these are optional, all indices included by default
		if(angular.isDefined($scope.restore_snap.indices) && $scope.restore_snap.indices.length > 0)
		{
			body["indices"] = $scope.restore_snap.indices.join(",");
		}

		if(angular.isDefined($scope.restore_snap.include_global_state))
		{
			//TODO : when es fixes bug [https://github.com/elasticsearch/elasticsearch/issues/4949], this extra "true/false" -> true/false handling will go away
			body["include_global_state"] = ($scope.restore_snap.include_global_state == 'true');
		}

		$scope.optionalParam(body, $scope.restore_snap, "ignore_unavailable");
		$scope.optionalParam(body, $scope.restore_snap, "rename_replacement");
		$scope.optionalParam(body, $scope.restore_snap, "rename_pattern");

		$scope.client.restoreSnapshot($scope.restore_snap.snapshot.repository, $scope.restore_snap.snapshot.snapshot, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot Restored Started");
				$scope.reload();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while started restore of snapshot", error);
				});
			}
		);
	};

	$scope.createRepository=function(){
		$scope.new_repo.settings = $scope.editor.format();
		if ($scope.editor.error === null){
			var body = {
				type: $scope.new_repo.type,
				settings: JSON.parse($scope.new_repo.settings)
			}

			$scope.client.createRepository($scope.new_repo.name, JSON.stringify(body),
				function(response) {
					AlertService.success("Repository created");
					$scope.loadRepositories();
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while creating repository", error);
					});
				}
			);
		}
	};

	$scope._parseRepositories=function(response, deferred){
		$scope.updateModel(function() {
			$scope.repositories = response;
			$scope.repositories_names = [];
			$.each($scope.repositories, function(key, value){
				$scope.repositories_names.push({"name":key, "value":key});
			});
		});
		deferred.resolve(true);
	};

	$scope.loadRepositories=function() {
		var deferred = $q.defer();
		try {
			$scope.client.getRepositories(
				function(response) {
					$scope._parseRepositories(response, deferred)
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while reading repositories", error);
					});
					deferred.reject(true);
				}
			)
		} catch (error) {
			AlertService.error("Failed to load repositories");
			deferred.reject(false);
		}
		return deferred.promise
	};

	$scope.createSnapshot=function(){
		var body = {}

		// name and repo required
		if(!angular.isDefined($scope.new_snap.repository))
		{
			AlertService.warn("Repository is required");
			return
		}

		if(!angular.isDefined($scope.new_snap.name))
		{
			AlertService.warn("Snapshot name is required");
			return
		}

		// dont add to body if not present, these are optional, all indices included by default
		if(angular.isDefined($scope.new_snap.indices) && $scope.new_snap.indices.length > 0)
		{
			body["indices"] = $scope.new_snap.indices.join(",");
		}

		if(angular.isDefined($scope.new_snap.include_global_state))
		{
			//TODO : when es fixes bug [https://github.com/elasticsearch/elasticsearch/issues/4949], this extra "true/false" -> true/false handling will go away
			body["include_global_state"] = ($scope.new_snap.include_global_state == 'true');
		}
		
		$scope.optionalParam(body, $scope.new_snap, "ignore_unavailable");

		$scope.client.createSnapshot($scope.new_snap.repository, $scope.new_snap.name, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot created");
				$scope.reload();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while creating snapshot", error);
				});
			}
		);
	};

	$scope.deleteSnapshot=function(snapshot){
			$scope.dialog_service.open(
			"are you sure you want to delete snapshot " + snapshot.snapshot + "?",
			snapshot,
			"Delete",
			function() {
				$scope.client.deleteSnapshot(
					snapshot.repository,
					snapshot.snapshot,
					function(response) {
						AlertService.success("Snapshot successfully deleted", response);
						$scope.reload();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting snapshot", error);
						});
					}
				);
			}
		);
	};

	$scope.allSnapshots=function(repositories) {
		var all = [];
		$.each( repositories, function( repository, value ){
			$scope.fetchSnapshots(repository).then(
					function(data){
						$.merge(all, data );
					});
		});
		$scope.snapshots = all;
	};

	$scope._parseSnapshots=function(repository, response, deferred) {
		var arr = response["snapshots"];

		// add the repository name to each snapshot object
		//
		if(arr && arr.constructor==Array && arr.length!==0){
			$.each(arr, function(index, value){
				value["repository"] = repository;
			});
		}
		deferred.resolve(response["snapshots"]);
	};

	$scope.fetchSnapshots=function(repository) {
		var deferred = $q.defer();
		try {
			$scope.client.getSnapshots(repository,
				function(response) {
					$scope._parseSnapshots(repository, response, deferred);
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while fetching snapshots", error);
					});
					deferred.resolve([]);
				}
			)
		} catch (error) {
			AlertService.error("Failed to load snapshots");
			deferred.resolve([]);
		}
		return deferred.promise;
	};

}

function ConfirmDialogController($scope, $location, $timeout, ConfirmDialogService) {

	$scope.dialog_service = ConfirmDialogService;
	
	$scope.close=function() {
		$scope.dialog_service.close();
	};
	
	$scope.confirm=function() {
		$scope.dialog_service.confirm();
	};
	
}
function WarmupController($scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {
	$scope.editor = undefined;
	$scope.indices = [];
	$scope.index = null;
	$scope.pagination = new WarmersPagination(1, []);
	
	// holds data for new warmer. maybe create a model for that
	$scope.new_warmer_id = '';
	$scope.new_index = '';
	$scope.new_source = '';
	$scope.new_types = '';
	
	$scope.$on('loadWarmupEvent', function() {
		$scope.loadIndices();
		$scope.initEditor();
	});
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('warmup-query-editor');
		}
	};

	$scope.totalWarmers=function() {
		return $scope.pagination.total();
	};
	
	$scope.loadIndices=function() {
		$scope.indices = $scope.cluster.indices;
	};
	
	$scope.createWarmerQuery=function() {
		if ($scope.editor.hasContent()) {
			$scope.editor.format();
			if (!isDefined($scope.editor.error)) {
				$scope.client.registerWarmupQuery($scope.new_index.name, $scope.new_types, $scope.new_warmer_id, $scope.editor.getValue(),
					function(response) {
						$scope.updateModel(function() {
							$scope.loadIndexWarmers();
							AlertService.success("Warmup query successfully registered", response);
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Request did not return a valid JSON", error);
						});
					}
				);
			}
		} else {
			AlertService.error("Warmup query body can't be empty");
		}
	};
	
	$scope.deleteWarmupQuery=function(warmer_id, source) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + warmer_id + "?",
			source,
			"Delete",
			function() {
				$scope.client.deleteWarmupQuery($scope.index.name, warmer_id,
					function(response) {
						$scope.updateModel(function() {
							AlertService.success("Warmup query successfully deleted", response);
							$scope.loadIndexWarmers();
						});
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting warmup query", error);
						});
					}
				);
			}
		);
	};
	
	$scope.loadIndexWarmers=function() {
		if (isDefined($scope.index)) {
			$scope.client.getIndexWarmers($scope.index.name, $scope.pagination.warmer_id,
				function(response) {
					$scope.updateModel(function() {
						if (isDefined(response[$scope.index.name])) {
							$scope.pagination.setResults(response[$scope.index.name].warmers);
						} else {
							$scope.pagination.setResults([]);
						}
					});
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while fetching warmup queries", error);
					});
				}
			);
		} else {
			$scope.pagination.setResults([]);
		}
	};
	
}
var Alert=function(message, response, level, _class, icon) {
	var current_date = new Date();
	this.message = message;
	this.response = response;
	this.level = level;
	this.class = _class;
	this.icon = icon;
	this.timestamp = getTimeString(current_date);
	this.id = "alert_box_" + current_date.getTime();
	
	this.hasResponse=function() {
		return isDefined(this.response);
	};
	
	this.getResponse=function() {
		if (isDefined(this.response)) {
			return JSON.stringify(this.response, undefined, 2);			
		}
	};
};

kopf.factory('AlertService', function() {
	this.max_alerts = 3;

	this.alerts = [];
	
	// removes ALL alerts
	this.clear=function() {
		this.alerts.length = 0;
	};
	
	// remove a particular alert message
	this.remove=function(id) {
		$("#" + id).fadeTo(1000, 0).slideUp(200, function(){
			$(this).remove(); 
		});
		this.alerts = this.alerts.filter(function(a) { return id != a.id; });
	};
	
	// creates an error alert
	this.error=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 15000;
		return this.addAlert(new Alert(message, response, "error", "alert-danger", "icon-warning-sign"), timeout);
	};
	
	// creates an info alert
	this.info=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "info", "alert-info", "icon-info"), timeout);
	};
	
	// creates success alert
	this.success=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "success", "alert-success", "icon-ok"), timeout);
	};
	
	// creates a warn alert
	this.warn=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 10000;
		return this.addAlert(new Alert(message, response, "warn", "alert-warning", "icon-info"), timeout);
	};
	
	this.addAlert=function(alert, timeout) {
		this.alerts.unshift(alert);
		var service = this;
		setTimeout(function() { service.remove(alert.id); }, timeout);		
		if (this.alerts.length >= this.max_alerts) {
			this.alerts.length = 3;
		}
		return alert.id;
	};
	
	return this;
});
kopf.factory('SettingsService', function() {
	
	this.refresh_interval = 3000;
	
	this.setRefreshInterval=function(interval) {
		this.refresh_interval = interval;
		localStorage.kopf_refresh_interval = interval;
	};
	
	this.getRefreshInterval=function() {
		if (isDefined(localStorage.kopf_refresh_interval) && isDefined(localStorage.kopf_refresh_interval)) {
			return localStorage.kopf_refresh_interval;
		} else {
			return this.refresh_interval;
		}
	};
	
	return this;
});

kopf.factory('AceEditorService', function() {

	this.init=function(name) {
		return new AceEditor(name);
	};

	return this;
});
kopf.factory('ThemeService', function() {
	
	this.theme = "default";
	
	this.setTheme=function(theme) {
		this.theme = theme;
		localStorage.kopf_theme = theme;
	};
	
	this.getTheme=function() {
		if (isDefined(localStorage.kopf_theme)) {
			return localStorage.kopf_theme;
		} else {
			return this.theme;
		}
	};
	
	return this;
});
function AceEditor(target) {
	// ace editor
	this.editor = ace.edit(target);
	this.editor.setFontSize("10px");
	this.editor.setTheme("ace/theme/kopf");
	this.editor.getSession().setMode("ace/mode/json");
	
	// validation error
	this.error = null;
	
	// sets value and moves cursor to beggining
	this.setValue=function(value) {
		this.editor.setValue(value,1);
		this.editor.gotoLine(0,0,false);
	};
	
	this.getValue=function() {
		return this.editor.getValue();
	};
	
	// formats the json content
	this.format=function() {
		var content = this.editor.getValue();
		try {
			if (isDefined(content) && content.trim().length > 0) {
				this.error = null;
				content = JSON.stringify(JSON.parse(content),undefined,4);
				this.editor.setValue(content,0);
				this.editor.gotoLine(0,0,false);
			}
		} catch (error) {
			this.error = error.toString();
		}
		return content;
	};
	
	this.hasContent=function() {
		return this.editor.getValue().trim().length > 0;
	};
}
function Gist(title, url) {
	this.timestamp = getTimeString(new Date());
	this.title = title;
	this.url = url;
	
	this.loadFromJSON=function(json) {
		this.title = json.title;
		this.url = json.url;
		this.timestamp = json.timestamp;
		return this;
	};

}
function WarmersPagination(page, results) {
	this.page = page;
	this.page_size = 10;
	this.results = results;
	this.warmer_id = "";
	this.past_warmer_id = null;
	this.total = 0;
	this.cached_results = null;
	
	this.firstResult=function() {
		if (Object.keys(this.getResults()).length > 0) {
			return ((this.current_page() - 1) * this.page_size) + 1;
		} else {
			return 0;
		}
	};
	
	this.lastResult=function() {
		if (this.current_page() * this.page_size > Object.keys(this.getResults()).length) {
			return Object.keys(this.getResults()).length;
		} else {
			return this.current_page() * this.page_size;
		}
	};

	this.hasNextPage=function() {
		return this.page_size * this.current_page() < Object.keys(this.getResults()).length;
	};
	
	this.hasPreviousPage=function() {
		return this.current_page() > 1;
	};
	
	this.nextPage=function() {
		this.page += 1;
	};
	
	this.previousPage=function() {
		this.page -= 1;
	};
	
	this.current_page=function() {
		if (this.warmer_id != this.past_warmer_id) {
			this.page = 1;
		}
		return this.page;
	};
	
	this.getPage=function() {
		var count = 1;
		var first_result = this.firstResult();
		var last_result = this.lastResult();
		var page = {};
		var results = this.getResults();
		Object.keys(results).forEach(function(alias) {
			if (count < first_result || count > last_result) {
				count += 1;
			} else {
				count += 1;
				page[alias] = results[alias];
			}
		});
		return page;
	};
	
	this.setResults=function(results) {
		this.results = results;
		// forces recalculation of page
		this.cached_results = null; 
		while (this.total() < this.firstResult()) {
			this.previousPage();
		}
	};
	
	this.total=function() {
		return Object.keys(this.getResults()).length;
	};
	
	this.getResults=function() {
		var matchingResults = {};
		var filters_changed = this.warmer_id != this.past_warmer_id;
		if (filters_changed || !isDefined(this.cached_results)) { // if filters changed or no cached, calculate
			var warmer_id = this.warmer_id;
			var results = this.results;
			Object.keys(results).forEach(function(current_warmer_id) {
				if (isDefined(warmer_id) && warmer_id.length > 0) {
					if (current_warmer_id.indexOf(warmer_id) != -1) {
						matchingResults[current_warmer_id] = results[current_warmer_id];
					} 
				} else {
					matchingResults[current_warmer_id] = results[current_warmer_id];
				}
			});
			this.cached_results = matchingResults;
			this.past_warmer_id = this.warmer_id;
		}
		return this.cached_results;
	};
}
function readablizeBytes(bytes) {
	if (bytes > 0) {
		var s = ['b', 'KB', 'MB', 'GB', 'TB', 'PB'];
		var e = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, e)).toFixed(2) + s[e];	
	} else {
		return 0;
	}
}

// Gets the value of a nested property from an object if it exists.
// Otherwise returns the default_value given.
// Example: get the value of object[a][b][c][d]
// where property_path is [a,b,c,d]
function getProperty(object, property_path, default_value) {
	if (isDefined(object)) {
		if (isDefined(object[property_path])) {
			return object[property_path];
		}
		var path_parts = property_path.split('.'); // path as nested properties
		for (var i = 0; i < path_parts.length && isDefined(object); i++) {
			object = object[path_parts[i]];
		}
	}
	return isDefined(object) ? object : default_value;
}

// Checks if value is both non null and undefined
function isDefined(value) {
	return value !== null && typeof value != 'undefined';
}

// Checks if the String representation of value is a non empty string
// string.trim().length is grater than 0
function notEmpty(value) {
	return isDefined(value) && value.toString().trim().length > 0;
}

// Returns the given date as a String formatted as hh:MM:ss
function getTimeString(date) {
	return ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2) + ":" + ('0' + date.getSeconds()).slice(-2);
}

function prettyPrintObject(object) {
	var prettyObject = {};
	Object.keys(object).forEach(function(key) {
		var parts = key.split(".");
		var property = null;
		var reference = prettyObject;
		var previous = null;
		for (var i = 0; i<parts.length; i++) {
			if (i == parts.length - 1) {
				if (isNaN(parts[i])) {
					reference[parts[i]] = object[key];	
				} else {
					if (!(previous[property] instanceof Array)) {
						previous[property] = [];
					}
					previous[property].push(object[key]);
				}
			} else {
				property = parts[i];
				if (!isDefined(reference[property])) {
					reference[property] = {};
				}
				previous = reference;
				reference = reference[property];
			}
		}
	});
	return JSON.stringify(prettyObject,undefined,4);
}