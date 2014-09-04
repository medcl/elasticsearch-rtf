function IndexAliases(index, aliases) {
    this.index = index;
    this.aliases = aliases;

    this.clone=function() {
        var cloned = new IndexAliases(this.index, []);
        cloned.aliases = this.aliases.map(function(alias) { return alias.clone(); });
        return cloned;
    };
}

IndexAliases.diff=function(original, modified) {
    var differences = [];
    modified.forEach(function(ia) {
        var is_new = true;
        original.forEach(function(orig_ia) {
            if (ia.index == orig_ia.index) {
                is_new = false;
                ia.aliases.forEach(function(alias) {
                    var original_aliases = orig_ia.aliases.filter(function(original_alias) {
                        return alias.equals(original_alias);
                    });
                    if (original_aliases.length === 0) {
                        differences.push(alias);
                    }
                });
            }
        });
        if (is_new) {
            ia.aliases.forEach(function(alias) { differences.push(alias); });
        }
    });
    return differences;
};

function Alias(alias, index, filter, index_routing, search_routing) {
	this.alias = isDefined(alias) ? alias.toLowerCase() : "";
	this.index = isDefined(index) ? index.toLowerCase() : "";
	this.filter = isDefined(filter) ? filter : "";
	this.index_routing = isDefined(index_routing) ? index_routing : "";
	this.search_routing = isDefined(search_routing) ? search_routing : "";

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

    this.clone=function() {
        return new Alias(this.alias, this.index, this.filter, this.index_routing, this.search_routing);
    };
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
function ElasticClient(connection, http_service, q) {
	this.host = connection.host;
	this.username = connection.username;
	this.password = connection.password;

	this.createAuthToken=function(username,password) {
		var hasAuth = isDefined(username) && isDefined(password);
        return hasAuth ? "Basic " + window.btoa(username + ":" + password) : null;
	};
	
	var auth = this.createAuthToken(this.username, this.password);
	var fetch_version = $.ajax({
		type: 'GET',
		url: connection.host + "/",
		beforeSend: function(xhr) {
			if (isDefined(auth)) {
				xhr.setRequestHeader("Authorization", auth);
			} 
		},
		async: false
	});
	
	var client = this;
	fetch_version.done(function(response) {
		try {
			var version = response.version.number;
            client.version = { 'str': version };
            var parts = version.split('.');
            client.version.major = parseInt(parts[0]);
            client.version.minor = parseInt(parts[1]);
            client.version.build = parseInt(parts[2]);
        } catch (error) {
			throw { message: "Version property could not bet read. Are you sure there is an ElasticSearch runnning at [" + connection.host + "]?", body: response };
		}
	});
	
	fetch_version.fail(function(error) {
		throw error.statusText;
	});

    this.versionCheck=function(version) {
        var parts = version.split('.');
        var mjr = parseInt(parts[0]);
        var mnr = parseInt(parts[1]);
        var bld = parseInt(parts[2]);
        var v = this.version;
        return (v.major > mjr || v.major == mjr && v.minor > mnr || v.major == mjr && v.minor == mnr && v.build >= bld);
    };

	this.createIndex=function(name, settings, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/" + name, settings, callback_success, callback_error);
	};

	this.enableShardAllocation=function(callback_success, callback_error) {
		var new_settings = { "transient":{ "cluster.routing.allocation": { "enable": 'all', "disable_allocation": false } } };
		this.executeClusterRequest('PUT', "/_cluster/settings",JSON.stringify(new_settings, undefined, ""), callback_success, callback_error);
	};

	this.disableShardAllocation=function(callback_success, callback_error) {
		var new_settings = { "transient":{ "cluster.routing.allocation": { "enable": 'none', "disable_allocation": true } } };
		this.executeClusterRequest('PUT', "/_cluster/settings",JSON.stringify(new_settings, undefined, ""), callback_success, callback_error);
	};

	this.shutdownNode=function(node_id, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/_cluster/nodes/" + node_id + "/_shutdown", {}, callback_success, callback_error);
	};

	this.openIndex=function(index, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/" + index + "/_open", {}, callback_success, callback_error);
	};

	this.optimizeIndex=function(index, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/" + index + "/_optimize", {}, callback_success, callback_error);
	};

	this.clearCache=function(index, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/" + index + "/_cache/clear", {}, callback_success, callback_error);
	};

	this.closeIndex=function(index, callback_success, callback_error) {
        this.executeClusterRequest('POST', "/" + index + "/_close", {}, callback_success, callback_error);
	};

	this.refreshIndex=function(index, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/" + index + "/_refresh", {}, callback_success, callback_error);
	};

	this.deleteIndex=function(name, callback_success, callback_error) {
		this.executeClusterRequest('DELETE', "/" + name, {}, callback_success, callback_error);
	};

	this.updateIndexSettings=function(name, settings, callback_success, callback_error) {
		this.executeClusterRequest('PUT', "/" + name + "/_settings", settings, callback_success, callback_error);
	};

	this.updateClusterSettings=function(settings, callback_success, callback_error) {
		this.executeClusterRequest('PUT', "/_cluster/settings", settings, callback_success, callback_error);
	};

    this.getIndexMetadata=function(name, callback_success, callback_error) {
        var transformed = function(response) { callback_success(new IndexMetadata(name, response.metadata.indices[name])); };
        this.executeClusterRequest('GET', "/_cluster/state/metadata/" + name, {}, transformed, callback_error);
    };

	this.fetchAliases=function(callback_success, callback_error) {
		var createAliases=function(response) {
            var indices = Object.keys(response);
            var index_aliases = [];
            indices.forEach(function(index) {
                if (Object.keys(response[index].aliases).length > 0) {
                    var aliases = Object.keys(response[index].aliases).map(function(alias) {
                        var info = response[index].aliases[alias];
                        return new Alias(alias, index, info.filter, info.index_routing, info.search_routing);
                    });
                    index_aliases.push(new IndexAliases(index, aliases));
                }
            });
			callback_success(index_aliases);
		};
		this.executeClusterRequest('GET', "/_aliases",{}, createAliases, callback_error);
	};

	this.analyzeByField=function(index, type, field, text, callback_success, callback_error) {
		var buildTokens=function(response) {
			var tokens = response.tokens.map(function (token) {
				return new Token(token.token,token.start_offset,token.end_offset,token.position);
			});
			callback_success(tokens);
		};
		this.executeClusterRequest('GET', "/" + index + "/_analyze?field=" + type +"."+field,{'text':text}, buildTokens, callback_error);
	};

	this.analyzeByAnalyzer=function(index, analyzer, text, callback_success, callback_error) {
		var buildTokens=function(response) {
			var tokens = response.tokens.map(function (token) {
				return new Token(token.token,token.start_offset,token.end_offset,token.position);
			});
			callback_success(tokens);
		};
		this.executeClusterRequest('GET', "/" + index + "/_analyze?analyzer=" + analyzer,{'text':text}, buildTokens, callback_error);
	};

	this.updateAliases=function(add_aliases,remove_aliases, callback_success, callback_error) {
		var data = { actions: [] };
		remove_aliases.forEach(function(alias) { data.actions.push({'remove':alias.info()}); });
		add_aliases.forEach(function(alias) { data.actions.push({'add':alias.info()}); });
		this.executeClusterRequest('POST', "/_aliases",JSON.stringify(data), callback_success, callback_error);
	};

	this.getIndexWarmers=function(index, warmer, callback_success, callback_error) {
		var path = "/" + index + "/_warmer/" + warmer.trim();
        var parseWarmers = function(response) {
            var warmers = [];
            Object.keys(response).forEach(function(i) {
                var index = i;
                var index_warmers = response[index].warmers;
                Object.keys(index_warmers).forEach(function(warmer_id) {
                    warmers.push(new Warmer(warmer_id, index, index_warmers[warmer_id]));
                });
            });
            callback_success(warmers);
        };
		this.executeClusterRequest('GET', path ,{}, parseWarmers, callback_error);
	};
	
	this.deleteWarmupQuery=function(warmer, callback_success, callback_error) {
		var path = "/" + warmer.index + "/_warmer/" + warmer.id;
		this.executeClusterRequest('DELETE', path, {},callback_success, callback_error);
	};
	
	this.registerWarmupQuery=function(warmer, callback_success, callback_error) {
		var path = "/" + warmer.index + "/";
		if (notEmpty(warmer.types)) {
			path += warmer.types + "/";
		}
		path += "/_warmer/" + warmer.id.trim();
		this.executeClusterRequest('PUT', path ,warmer.source, callback_success, callback_error);
	};
	
	this.fetchPercolateQueries=function(index, body, callback_success, callback_error) {
		var path = "/" + index + "/.percolator/_search";
        var parsePercolators = function(response) {
            var collection = response.hits.hits.map(function(q) { return new PercolateQuery(q); });
            var percolators = new PercolatorsPage(body.from, body.size, response.hits.total, collection);
            callback_success(percolators);
        };
        this.executeClusterRequest('POST', path , JSON.stringify(body), parsePercolators, callback_error);
	};
	
	this.deletePercolatorQuery=function(index, id, callback_success, callback_error) {
		var path = "/" + index + "/.percolator/" + id;
		this.executeClusterRequest('DELETE', path, {}, callback_success, callback_error);
	};
	
	this.createPercolatorQuery=function(percolator, callback_success, callback_error) {
		var path = "/" + percolator.index + "/.percolator/" + percolator.id;
		this.executeClusterRequest('PUT', path, percolator.source, callback_success, callback_error);
	};
	
	this.getRepositories=function(callback_success, callback_error) {
		var parse_repositories = function(response) {
			var repositories = Object.keys(response).map(function(repository) {
				return new Repository(repository, response[repository]);
			});
			callback_success(repositories);
		};
		this.executeClusterRequest('GET', "/_snapshot/_all", {}, parse_repositories, callback_error);
	};

	this.createRepository=function(repository, body, callback_success, callback_error) {
		this.executeClusterRequest('POST', "/_snapshot/" + repository, body, callback_success, callback_error);
	};

	this.deleteRepository=function(repository, callback_success, callback_error) {
		this.executeClusterRequest('DELETE', "/_snapshot/" + repository, {}, callback_success, callback_error);
	};

	this.getSnapshots=function(repository, callback_success, callback_error){
		var path = "/_snapshot/" + repository + "/_all";
		var parseSnapshots = function(response) {
			var snapshots = response.snapshots.map(function(snapshot) { return new Snapshot(snapshot); } );
			callback_success(snapshots);
		};
		this.executeClusterRequest('GET', path, {}, parseSnapshots, callback_error);
	};

	this.deleteSnapshot=function(repository, snapshot, callback_success, callback_error){
		this.executeClusterRequest('DELETE', "/_snapshot/" + repository + "/" +snapshot, {}, callback_success, callback_error);
	};

	this.restoreSnapshot=function(repository, snapshot, body, callback_success, callback_error){
		this.executeClusterRequest('POST', "/_snapshot/" + repository + "/" +snapshot + "/_restore", body, callback_success, callback_error);
	};

	this.createSnapshot=function(repository, snapshot, body, callback_success, callback_error){
		this.executeClusterRequest('PUT', "/_snapshot/" + repository + "/" +snapshot, body, callback_success, callback_error );
	};
	
	this.executeBenchmark=function(body, callback_success, callback_error){
		this.executeClusterRequest('PUT', "/_bench", body, callback_success, callback_error );
	};

    this.executeClusterRequest=function(method, path, data, callback_success, callback_error) {
        var params = {
            method: method,
            url: this.host + path,
            data: data,
            withCredentials: auth !== null,
            headers: { Authorization: auth}
        };
        http_service(params).
            success(function(data, status, headers, config) { callback_success(data); }).
            error(function(data, status, headers, config) { callback_error(data); });
    };
	
	this.executeRequest=function(method, url, username, password, data, callback_success, callback_error) {
        var params = {
            method: method,
            url: url,
            data: data,
            withCredentials: auth !== null,
            headers: { Authorization: auth}
        };
        http_service(params).
            success(function(data, status, headers, config) { callback_success(data); }).
            error(function(data, status, headers, config) { callback_error(data, status); });
	};

	/** ####### END OF REFACTORED AREA ####### **/

	this.getClusterHealth=function(callback_success, callback_error) {
		var url = this.host + "/_cluster/health";
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
				}
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
		var auth = this.auth;
        var params = { withCredentials: auth !== null, headers: { Authorization: auth } };
        q.all([
            http_service.get(host+"/_cluster/state/master_node,nodes,routing_table,blocks/", params),
            http_service.get(host+"/_status", params),
            http_service.get(host+"/_nodes/stats?all=true", params),
            http_service.get(host+"/_cluster/settings", params),
            http_service.get(host+"/_aliases", params)
        ]).then(function(responses) {
                callback_success(new Cluster(responses[0].data,responses[1].data,responses[2].data,responses[3].data,responses[4].data));
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
	this.host = node_stats.host;
	var master = node_info.attributes.master === 'false' ? false : true;
	var data = node_info.attributes.data === 'false' ? false : true;
	var client = node_info.attributes.client === 'true' ? true : false;
	this.master =  master && !client;
	this.data = data && !client;
	this.client = client || !master && !data;
	this.current_master = false;
	this.stats = node_stats;

	this.heap_used = readablizeBytes(getProperty(this.stats,'jvm.mem.heap_used_in_bytes'));
	this.heap_committed = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_committed_in_bytes'));
	this.heap_used_percent = getProperty(this.stats, 'jvm.mem.heap_used_percent');
	this.heap_max = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_max_in_bytes'));

	var total_in_bytes = getProperty(this.stats, 'fs.total.total_in_bytes');
	var free_in_bytes = getProperty(this.stats, 'fs.total.free_in_bytes');

	this.disk_total = readablizeBytes(total_in_bytes);
	this.disk_free = readablizeBytes(free_in_bytes);
	this.disk_used_percent =  Math.round(100 * ((total_in_bytes - free_in_bytes) / total_in_bytes));

	this.cpu_user = getProperty(this.stats, 'os.cpu.user');
	this.cpu_sys = getProperty(this.stats, 'os.cpu.sys');
	this.docs = getProperty(this.stats, 'indices.docs.count');
    this.size_in_bytes = getProperty(this.stats, 'indices.store.size_in_bytes');
    this.size = readablizeBytes(this.size_in_bytes);

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
function Repository(name, info) {
	this.name = name;
	this.type = info.type;
	this.settings = info.settings;

    this.asJson=function() {
        var json = { type: this.type };
        if (this.type === 'fs') {
            var fsSettings = ['location', 'chunk_size', 'max_restore_bytes_per_sec', 'max_snapshot_bytes_per_sec', 'compress'];
            json.settings = this.getSettings(fsSettings);
        }
        if (this.type === 'url') {
            var urlSettings = ['url'];
            json.settings = this.getSettings(urlSettings);
        }
        if (this.type === 's3') {
            var s3Settings = ['region', 'bucket', 'base_path', 'access_key', 'secret_key', 'chunk_size', 'max_retries', 'compress', 'server_side_encryption'];
            json.settings = this.getSettings(s3Settings);
        }
        if (this.type === 'hdfs') {
            var hdfsSettings = ['uri', 'path', 'load_defaults', 'conf_location', 'concurrent_streams', 'compress', 'chunk_size'];
            json.settings = this.getSettings(hdfsSettings);
        }
        if (this.type === 'azure') {
            var azureSettings = ['container', 'base_path', 'concurrent_streams', 'chunk_size', 'compress'];
            json.settings = this.getSettings(azureSettings);
        }
        return JSON.stringify(json);
    };

    this.validate=function() {
        if (!notEmpty(this.name)) {
            throw "Repository name is required";
        }
        if (!notEmpty(this.type)) {
            throw "Repository type is required";
        }
        if (this.type === 'fs') {
            var fsRequired = ['location'];
            this.validateSettings(fsRequired);
        }
        if (this.type === 'url') {
            var urlRequired = ['url'];
            this.validateSettings(urlRequired);
        }
        if (this.type === 's3') {
            var s3Required = ['bucket'];
            this.validateSettings(s3Required);
        }
        if (this.type === 'hdfs') {
            var hdfsRequired = ['path'];
            this.validateSettings(hdfsRequired);
        }
    };

    this.validateSettings=function(required) {
        var repository = this;
        required.forEach(function(setting) {
            if (!notEmpty(repository.settings[setting])) {
                throw(setting + " is required for repositories of type " + repository.type);
            }
        });
    };

    this.getSettings=function(availableSettings) {
        var settings = {};
        var currentSettings = this.settings;
        availableSettings.forEach(function(setting) {
            if (notEmpty(currentSettings[setting])) {
                settings[setting] = currentSettings[setting];
            }
        });
        return settings;
    };
}
function Snapshot(info) {
	this.name = info.snapshot;
	this.indices = info.indices;
	this.state = info.state;
	this.start_time = info.start_time;
	this.start_time_in_millis = info.start_time_in_millis;
	this.end_time = info.end_time;
	this.end_time_in_millis = info.end_time_in_millis;
	this.duration_in_millis = info.duration_in_millis;
	this.failures = info.failures;
	this.shards = info.shards;
}
function Warmer(id, index, body) {
    this.id = id;
    this.index = index;
    this.source = body.source;
    this.types = body.types;
}
function PercolateQuery(query_info) {
    this.index = query_info._index;
    this.id = query_info._id;
    this.source = query_info._source;
    this.filter = {};

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

function PercolatorsPage(from, size, total, percolators) {
    this.from = from;
    this.size = size;
    this.total = total;
    this.percolators = percolators;

    this.hasNextPage=function() {
        return from + size < total;
    };

    this.hasPreviousPage=function() {
        return from > 0;
    };

    this.firstResult=function() {
        return total > 0 ? from  + 1 : 0;
    };

    this.lastResult=function() {
        return this.hasNextPage() ? from + size : total;
    };

    this.nextOffset=function() {
      return this.hasNextPage() ? from +size : from;
    };

    this.previousOffset=function() {
        return this.hasPreviousPage() ? from - size : from;
    };

    this.getPage=function() {
        return percolators;
    };

    this.total=function() {
        return total;
    };
}
function IndexMetadata(index, metadata) {
    this.index = index;
    this.mappings = metadata.mappings;
    this.settings = metadata.settings;

    this.getTypes=function() {
        return Object.keys(this.mappings).sort(function(a, b) { return a.localeCompare(b); });
    };

    this.getAnalyzers=function() {
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
        return ['float', 'double', 'byte', 'short', 'integer', 'long', 'nested', 'object'].indexOf(type) == -1;
    }

    this.getFields=function(type) {
        var fields = [];
        if (isDefined(this.mappings[type])) {
            fields = this.getProperties("", this.mappings[type].properties);
        }
        return fields.sort(function(a, b) { return a.localeCompare(b); });
    };

    this.getProperties=function(parent, fields) {
        var prefix = parent !== "" ? parent + "." : "";
        var validFields = [];
        for (var field in fields) {
            // multi field
            if (isDefined(fields[field].fields)) {
                var multiPrefix = fields[field].path != 'just_name' ? prefix + field : prefix;
                var multiProps = this.getProperties(multiPrefix, fields[field].fields);
                validFields = validFields.concat(multiProps);
            }
            // nested and object types
            if (fields[field].type == 'nested' || fields[field].type == 'object' || !isDefined(fields[field].type)) {
                var nestedProperties = this.getProperties(prefix + field,fields[field].properties);
                validFields = validFields.concat(nestedProperties);
            }
            // normal fields
            if (isDefined(fields[field].type) && isAnalyzable(fields[field].type)) {
                validFields.push(prefix + field);
            }
        }
        return validFields;
    };
}
var kopf = angular.module('kopf', []);

kopf.factory('IndexSettingsService', function() {

    this.loadSettings=function(index, settings) {
        this.index = index;
        this.settings = settings;
        this.editable_settings = new EditableIndexSettings(settings);
    };

    return this;
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

kopf.controller('AliasesController', ['$scope', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, AlertService, AceEditorService, ElasticService) {
	$scope.paginator = new Paginator(1,10, [], new AliasFilter("",""));
    $scope.page = $scope.paginator.getPage();
    $scope.original = [];
	$scope.editor = undefined;
    $scope.new_alias = new Alias("", "", "", "", "");

    $scope.aliases = [];

    $scope.$watch('paginator', function(filter, previous) {
        $scope.page = $scope.paginator.getPage();
    }, true);

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
                var index_name = $scope.new_alias.index;
                var alias_name = $scope.new_alias.alias;
				// if alias already exists, check if its already associated with index
                var collection = $scope.paginator.getCollection();
				var indices = collection.filter(function(a) { return a.index == index_name; });
                if (indices.length === 0) {
                    collection.push(new IndexAliases(index_name, [ $scope.new_alias ]));
                } else {
                    var index_aliases = indices[0];
                    var aliases = index_aliases.aliases.filter(function(a) { return alias_name == a.alias;  });
                    if (aliases.length > 0) {
                        throw "Alias is already associated with this index";
                    } else {
                        index_aliases.aliases.push($scope.new_alias);
                    }
                }
				$scope.new_alias = new Alias();
				$scope.paginator.setCollection(collection);
                $scope.page = $scope.paginator.getPage();
				AlertService.success("Alias successfully added. Note that changes made will only be persisted after saving changes");
			} catch (error) {
				AlertService.error(error ,null);
			}
		} else {
			AlertService.error("Invalid filter defined for alias" , $scope.editor.error);
		}
	};
	
	$scope.removeIndexAliases=function(index) {
        var collection = $scope.paginator.getCollection();
        for (var position = 0; position < collection.length; position++) {
            if (index == collection[position].index) {
                collection.splice(position, 1);
                break;
            }
        }
        $scope.paginator.setCollection(collection);
        $scope.page = $scope.paginator.getPage();
		AlertService.success("All aliases were removed for " + index);
	};
	
	$scope.removeIndexAlias=function(index, alias) {
        var index_position = 0;
        var collection = $scope.paginator.getCollection();
        for (; index_position < collection.length; index_position++) {
            if (index == collection[index_position].index) {
                break;
            }
        }
        var index_aliases = collection[index_position];
        for (var alias_position = 0; alias_position < index_aliases.aliases.length; alias_position++) {
            if (alias == index_aliases.aliases[alias_position].alias) {
                index_aliases.aliases.splice(alias_position, 1);
                if (index_aliases.aliases.length === 0) {
                    collection.splice(index_position, 1);
                }
                break;
            }
        }
        $scope.paginator.setCollection(collection);
        $scope.page = $scope.paginator.getPage();
        AlertService.success("Alias successfully dissociated from index. Note that changes made will only be persisted after saving changes");
	};
	
	$scope.mergeAliases=function() {
		var collection = $scope.paginator.getCollection();
        var deletes = IndexAliases.diff(collection, $scope.original);
		var adds = IndexAliases.diff($scope.original, collection);
        if (adds.length === 0 && deletes.length === 0) {
            AlertService.warn("No changes were made: nothing to save");
        } else {
            ElasticService.client.updateAliases(adds,deletes,
                function(response) {
                    AlertService.success("Aliases were successfully updated",response);
                    $scope.loadAliases();
                },
                function(error) {
                    AlertService.error("Error while updating aliases",error);
                }
            );
        }
	};

	$scope.loadAliases=function() {
		ElasticService.client.fetchAliases(
			function(index_aliases) {
                $scope.original = index_aliases.map(function(ia) { return ia.clone(); });
                $scope.paginator.setCollection(index_aliases);
                $scope.page = $scope.paginator.getPage();
			},
			function(error) {
                AlertService.error("Error while fetching aliases",error);
			}
		);
	};
	
    $scope.$on('loadAliasesEvent', function() {
        $scope.indices = $scope.cluster.indices;
        $scope.loadAliases();
		$scope.initEditor();
    });
}]);

kopf.controller('AnalysisController', ['$scope', '$location', '$timeout', 'AlertService', 'ElasticService', function($scope, $location, $timeout, AlertService, ElasticService) {

	$scope.indices = null;

	// by index
	$scope.field_index = null;
    $scope.field_index_metadata = null;
	$scope.field_type = '';
	$scope.field_field = '';
	$scope.field_text = '';
	$scope.field_tokens = [];
	
	// By analyzer
	$scope.analyzer_index = '';
    $scope.analyzer_index_metadata = null;
	$scope.analyzer_analyzer = '';
	$scope.analyzer_text = '';
	$scope.analyzer_tokens = [];

    $scope.$watch('field_index', function(current, previous) {
        if (isDefined(current)) {
            $scope.loadIndexTypes(current.name);
        }
    });

    $scope.loadIndexTypes=function(index) {
        $scope.field_type = '';
        $scope.field_field = '';
        if (notEmpty(index)) {
            ElasticService.client.getIndexMetadata(index,
                function(metadata) {
                    $scope.field_index_metadata = metadata;
                },
                function(error) {
                    $scope.field_index = '';
                    AlertService.error("Error while loading index metadata", error);
                }
            );
        }
    };

    $scope.$watch('analyzer_index', function(current, previous) {
        if (isDefined(current)) {
            $scope.loadIndexAnalyzers(current.name);
        }
    });

    $scope.loadIndexAnalyzers=function(index) {
        $scope.analyzer_analyzer = '';
        if (notEmpty(index)) {
            ElasticService.client.getIndexMetadata(index,
                function(metadata) {
                    $scope.analyzer_index_metadata = metadata;
                },
                function(error) {
                    $scope.analyzer_index = '';
                    AlertService.error("Error while loading index metadata", error);
                }
            );
        }
    };


	$scope.analyzeByField=function() {
		if ($scope.field_field.length > 0 && $scope.field_text.length > 0) {
			$scope.field_tokens = null;
			ElasticService.client.analyzeByField($scope.field_index.name,$scope.field_type,$scope.field_field,$scope.field_text, 
				function(response) {
                    $scope.field_tokens = response;
				},
				function(error) {
                    $scope.field_tokens = null;
                    AlertService.error("Error while analyzing text", error);
				}
			);
		}
	};
	
	$scope.analyzeByAnalyzer=function() {
		if ($scope.analyzer_analyzer.length > 0 && $scope.analyzer_text.length > 0) {
			$scope.analyzer_tokens = null;
			ElasticService.client.analyzeByAnalyzer($scope.analyzer_index.name,$scope.analyzer_analyzer,$scope.analyzer_text,
				function(response) {
					$scope.analyzer_tokens = response;
				},
				function(error) {
                    $scope.analyzer_tokens = null;
                    AlertService.error("Error while analyzing text", error);
				}
			);
		}
	};
	
	$scope.$on('loadAnalysisEvent', function() {
		$scope.indices = $scope.cluster.open_indices();
	});
	
}]);
kopf.controller('ClusterHealthController', ['$scope', '$location', '$timeout', '$sce', 'AlertService', 'ConfirmDialogService', 'ElasticService', function($scope,$location,$timeout,$sce, AlertService, ConfirmDialogService, ElasticService) {
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
		ElasticService.client.getClusterDiagnosis($scope.retrieveHealth, $scope.retrieveState, $scope.retrieveStats, $scope.retrieveHotThreads,
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

}]);
kopf.controller('ClusterOverviewController', ['$scope', 'IndexSettingsService', 'ConfirmDialogService', 'AlertService', 'ElasticService', function($scope, IndexSettingsService, ConfirmDialogService, AlertService, ElasticService) {

    $scope.index_paginator = new Paginator(1, 5, [], new IndexFilter("","", true, 0));

    $scope.page = $scope.index_paginator.getPage();

    $scope.node_filter = new NodeFilter("", true, true, true, 0);

    $scope.nodes = [];

    $scope.$watch('cluster', function(cluster, previous) {
        if (isDefined(cluster)) {
            $scope.setIndices(cluster.indices);
            $scope.setNodes($scope.cluster.nodes);
        } else {
            $scope.setIndices([]);
            $scope.setNodes([]);
        }
    });

    $scope.$watch('index_paginator', function(filter, previous) {
        if (isDefined($scope.cluster)) {
            $scope.setIndices($scope.cluster.indices);
        } else {
            $scope.setIndices([]); // could it even happen?
        }
    }, true);

    $scope.$watch('node_filter', function(filter, previous) {
        if (isDefined($scope.cluster)) {
            $scope.setNodes($scope.cluster.nodes);
        } else {
            $scope.setNodes([]);
        }
    }, true);

    $scope.setNodes=function(nodes) {
        $scope.nodes = nodes.filter(function(node) { return $scope.node_filter.matches(node); });
    };

    $scope.setIndices=function(indices) {
        $scope.index_paginator.setCollection(indices);
        $scope.page = $scope.index_paginator.getPage();
    };

	$scope.closeModal=function(forced_refresh){
		if (forced_refresh) {
			$scope.refreshClusterState();
		}
	};
	
	$scope.shutdownNode=function(node_id) {
        ElasticService.client.shutdownNode(node_id,
            function(response) {
                AlertService.success("Node [" + node_id + "] successfully shutdown", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while shutting down node",error);
            }
        );
    };

    $scope.promptShutdownNode=function(node_id, node_name) {
        ConfirmDialogService.open(
			"are you sure you want to shutdown node " + node_name + "?",
			"Shutting down a node will make all data stored in this node inaccessible, unless this data is replicated across other nodes." +
			"Replicated shards will be promoted to primary if the primary shard is no longer reachable.",
			"Shutdown",
			function() { $scope.shutdownNode(node_id); }
		);
	};

	$scope.optimizeIndex=function(index) {
        ElasticService.client.optimizeIndex(index,
            function(response) {
                AlertService.success("Index was successfully optimized", response);
            },
            function(error) {
                AlertService.error("Error while optimizing index", error);
            }
        );
    };

    $scope.promptOptimizeIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to optimize index " + index + "?",
			"Optimizing an index is a resource intensive operation and should be done with caution."+
			"Usually, you will only want to optimize an index when it will no longer receive updates",
			"Optimize",
			function() { $scope.optimizeIndex(index); }
		);
	};
	
	$scope.deleteIndex=function(index) {
        ElasticService.client.deleteIndex(index,
            function(response) {
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while deleting index", error);
            }
        );
    };

    $scope.promptDeleteIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to delete index " + index + "?",
			"Deleting an index cannot be undone and all data for this index will be lost",
			"Delete",
			function() { $scope.deleteIndex(index); }
		);
	};
	
	$scope.clearCache=function(index) {
        ElasticService.client.clearCache(index,
            function(response) {
                AlertService.success("Index cache was successfully cleared", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while clearing index cache", error);
            }
        );
    };

    $scope.promptClearCache=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to clear the cache for index " + index + "?",
			"This will clear all caches for this index.",
			"Clear",
			function() { $scope.clearCache(index); }
		);
	};

	$scope.refreshIndex=function(index) {
        ElasticService.client.refreshIndex(index,
            function(response) {
                AlertService.success("Index was successfully refreshed", response);
            },
            function(error) {
                AlertService.error("Error while refreshing index", error);
            }
        );
    };

    $scope.promptRefreshIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to refresh index " + index + "?",
			"Refreshing an index makes all operations performed since the last refresh available for search.",
			"Refresh",
			function() { $scope.refreshIndex(index); }
		);
	};
	
	$scope.enableAllocation=function() {
		ElasticService.client.enableShardAllocation(
			function(response) {
                AlertService.success("Shard allocation was successfully enabled", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while enabling shard allocation", error);
			}
		);
	};
	
	$scope.disableAllocation=function() {
		ElasticService.client.disableShardAllocation(
			function(response) {
                AlertService.success("Shard allocation was successfully disabled", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while disabling shard allocation", error);
			}
		);
	};
	
	$scope.closeIndex=function(index) {
        ElasticService.client.closeIndex(index,
            function(response) {
                AlertService.success("Index was successfully closed", response);
                $scope.refreshClusterState();
            },
            function(error) { AlertService.error("Error while closing index", error); }
        );
    };

    $scope.promptCloseIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to close index " + index + "?",
			"Closing an index will remove all it's allocated shards from the cluster. " +
			"Both searches and updates will no longer be accepted for the index." +
			"A closed index can be reopened at any time",
			"Close index",
            function() { $scope.closeIndex(index); }
		);
	};

    $scope.openIndex=function(index) {
        ElasticService.client.openIndex(index,
            function(response) {
                AlertService.success("Index was successfully opened", response);
                $scope.refreshClusterState();
            },
            function(error) {
                AlertService.error("Error while opening index", error);
            }
        );
    };

    $scope.promptOpenIndex=function(index) {
        ConfirmDialogService.open(
			"are you sure you want to open index " + index + "?",
			"Opening an index will trigger the recovery process for the index. " +
			"This process could take sometime depending on the index size.",
			"Open index",
			function() { $scope.openIndex(index); }
		);
	};
	
	$scope.loadIndexSettings=function(index) {
		$('#index_settings_option a').tab('show');
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                IndexSettingsService.loadSettings(index, metadata.settings);
                $('#idx_settings_tabs a:first').tab('show');
                $(".setting-info").popover();
            },
            function(error) {
                AlertService.error("Error while loading index settings", error);
            }
        );
	};

    $scope.showIndexSettings=function(index) {
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                $scope.displayInfo('settings for index ' + index, metadata.settings);
            },
            function(error) {
                AlertService.error("Error while loading index settings", error);
            }
        );
    };

    $scope.showIndexMappings=function(index) {
        ElasticService.client.getIndexMetadata(index,
            function(metadata) {
                $scope.displayInfo('mappings for index ' + index, metadata.mappings);
            },
            function(error) {
                AlertService.error("Error while loading index mappings", error);
            }
        );
    };

}]);
kopf.controller('ClusterSettingsController', ['$scope', '$location', '$timeout', 'AlertService', 'ElasticService', function($scope, $location, $timeout, AlertService, ElasticService) {
	$scope.$on('loadClusterSettingsEvent', function() {
		$('#cluster_settings_option a').tab('show');
		$('#cluster_settings_tabs a:first').tab('show');
		$(".setting-info").popover();
		$scope.active_settings = "transient"; // remember last active?
		$scope.settings = new ClusterSettings($scope.cluster.settings);
	});

	$scope.save=function() {
		ElasticService.client.updateClusterSettings(JSON.stringify($scope.settings, undefined, ""),
			function(response) {
                AlertService.success("Cluster settings were successfully updated",response);
				$scope.refreshClusterState();
			}, 
			function(error) {
                AlertService.error("Error while updating cluster settings",error);
			}
		);
	};
}]);
kopf.controller('CreateIndexController', ['$scope', '$location', '$timeout', 'AlertService', 'ElasticService', function($scope, $location, $timeout, AlertService, ElasticService) {
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
			ElasticService.client.createIndex($scope.name, JSON.stringify(settings, undefined, ""), 
				function(response) {
					$scope.refreshClusterState();
				}, function(error) { 
                    AlertService.error("Error while creating index", error);
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
}]);
kopf.controller('GlobalController', ['$scope', '$location', '$timeout', '$http', '$q', '$sce', '$window', 'ConfirmDialogService', 'AlertService', 'SettingsService', 'ThemeService', 'ElasticService', function($scope, $location, $timeout, $http, $q, $sce, $window, ConfirmDialogService, AlertService, SettingsService, ThemeService, ElasticService) {
	$scope.version = "1.3.0-SNAPSHOT";
	$scope.alert_service = AlertService;
    $scope.modal = new ModalControls();

	$scope.home_screen=function() {
		$('#cluster_option a').tab('show');
	};
	
	$scope.getTheme=function() {
		return ThemeService.getTheme();
	};

	$scope.broadcastMessage=function(message,args) {
		$scope.$broadcast(message,args);
	};
	
	$scope.readParameter=function(name){
		var results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec($window.location.href);
		return isDefined(results) ? results[1] : null;
	};

    $scope.connect=function() {
        try {
            var host = "http://localhost:9200"; // default
            if ($location.host() !== "") { // not opening from fs
                var location = $scope.readParameter('location');
                if (isDefined(location)) {
                    host = location;
                } else {
                    var url = $location.absUrl();
                    host = url.substring(0, url.indexOf("/_plugin/kopf"));
                }
            }
            ElasticService.connect(host);
            this.home_screen(); // FIXME: not even sure why this is here
        } catch(error) {
            AlertService.error(error.message, error.body);
        }
    };

	$scope.connect();

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
		if (ElasticService.isConnected()) {
			$timeout(function() {
				ElasticService.client.getClusterDetail(
					function(cluster) {
                        cluster.computeChanges($scope.cluster);
                        $scope.cluster = cluster;
                        $scope.alertClusterChanges();
					},
					function(error) {
                        AlertService.error("Error while retrieving cluster information", error);
                        $scope.cluster = null;
					}
				);

				ElasticService.client.getClusterHealth(
					function(cluster) {
                        $scope.cluster_health = cluster;
					},
					function(error) {
                        $scope.cluster_health = null;
                        AlertService.error("Error connecting to [" + $scope.host + "]",error);
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
		return isDefined($scope.cluster_health);
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

}]);

kopf.controller('IndexSettingsController', ['$scope', '$location', '$timeout', 'IndexSettingsService', 'AlertService', 'ElasticService', function($scope, $location, $timeout, IndexSettingsService, AlertService, ElasticService) {
	$scope.service = IndexSettingsService;

	$scope.save=function() {
        var index = $scope.service.index;
		var settings = $scope.service.settings;
		var new_settings = {};
        var editable_settings = $scope.service.editable_settings;
		// TODO: could move that to editable_index_settings model
		editable_settings.valid_settings.forEach(function(setting) {
			if (notEmpty(editable_settings[setting])) {
				new_settings[setting] = editable_settings[setting];
			}
		});
		ElasticService.client.updateIndexSettings(index, JSON.stringify(new_settings, undefined, ""),
			function(response) {
                AlertService.success("Index settings were successfully updated", response);
				$scope.refreshClusterState();
			},
			function(error) {
                AlertService.error("Error while updating index settings", error);
			}
		);
	};
 }]);
kopf.controller('NavbarController', ['$scope', '$location', '$timeout', 'AlertService', 'SettingsService', 'ThemeService', function($scope, $location, $timeout, AlertService, SettingsService, ThemeService) {
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

}]);

kopf.controller('RestController', ['$scope', '$location', '$timeout', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, $location, $timeout, AlertService, AceEditorService, ElasticService) {

	$scope.request = new Request(ElasticService.connection.host + "/_search","GET","{}");
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
			var a = document.createElement('a');
			a.href = $scope.request.url;
			var username = a.username || null;
			var password = a.password || null;
			if ($scope.request.method == 'GET' && '{}' !== $scope.request.body) {
				AlertService.info("You are executing a GET request with body content. Maybe you meant to use POST or PUT?");
			}
			ElasticService.client.executeRequest($scope.request.method,$scope.request.url,username,password,$scope.request.body,
				function(response) {
					var content = response;
					try {
						content = JSONTree.create(response);
					} catch (parsing_error) {
						// nothing to do
					}
					$('#rest-client-response').html(content);
					$scope.addToHistory(new Request($scope.request.url,$scope.request.method,$scope.request.body));
				},
				function(error, status) {
					if (status !== 0) {
						AlertService.error("Request was not successful");
                        try {
                            $('#rest-client-response').html(JSONTree.create(error));
                        } catch (invalid_json) {
                            $('#rest-client-response').html(error);
                        }
					} else {
						AlertService.error($scope.request.url + " is unreachable");
					}
				}
			);
		}
	};
}]);
kopf.controller('PercolatorController', ['$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, ConfirmDialogService, AlertService, AceEditorService, ElasticService) {
	$scope.editor = undefined;
	$scope.pagination = new PercolatorsPage(0, 0, 0, []);

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
		$scope.loadPercolatorQueries(this.pagination.previousOffset());
	};
	
	$scope.nextPage=function() {
		$scope.loadPercolatorQueries(this.pagination.nextOffset());
	};

	$scope.parseSearchParams=function() {
		var queries = [];
		if ($scope.id.trim().length > 0) {
			queries.push({"query_string":{ default_field: '_id', query: $scope.id}});
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
				ElasticService.client.deletePercolatorQuery(query.index, query.id,
					function(response) {
						var refreshIndex = query.index;
						ElasticService.client.refreshIndex(refreshIndex,
							function(response) {
                                AlertService.success("Query successfully deleted", response);
                                $scope.loadPercolatorQueries();
							},
							function(error) {
                                AlertService.error("Error while reloading queries", error);
							}
						);
					},
					function(error) {
                        AlertService.error("Error while deleting query", error);
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
		ElasticService.client.createPercolatorQuery($scope.new_query,
			function(response) {
				var refreshIndex = $scope.new_query.index;
				ElasticService.client.refreshIndex(refreshIndex,
					function(response) {
                        AlertService.success("Percolator Query successfully created", response);
                        $scope.index = $scope.new_query.index;
                        $scope.loadPercolatorQueries(0);
					},
					function(error) {
                        AlertService.success("Error while reloading queries", error);
					}
				);
			},
			function(error) {
                AlertService.error("Error while creating percolator query", error);
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
	
	$scope.loadPercolatorQueries=function(from) {
		try {
            from = isDefined(from) ? from : 0;
			var queries = $scope.parseSearchParams();
            var body = { from: from, size: 10 };
			if (queries.length > 0) {
				body.query = { bool: { must: queries } };
			}
			ElasticService.client.fetchPercolateQueries($scope.index, body,
				function(percolators) {
                    $scope.pagination = percolators;
				},
				function(error) {
                    AlertService.error("Error while reading loading percolate queries", error);
				}
			);
		} catch (error) {
			AlertService.error("Filter is not a valid JSON");
		}
	};
	
}]);

kopf.controller('RepositoryController', ['$scope', 'ConfirmDialogService', 'AlertService', 'ElasticService', function($scope, ConfirmDialogService, AlertService, ElasticService) {
	// registered repositories
	$scope.repositories = [];
	$scope.indices = [];
	
	$scope.paginator = new Paginator(1, 10, [], new SnapshotFilter());
    $scope.page = $scope.paginator.getPage();
    $scope.snapshots = [];
	
	$scope.snapshot = null;
	$scope.snapshot_repository = '';

	$scope.restorable_indices = [];
	$scope.repository_form = new Repository('', { settings: {}, type: '' });
	$scope.new_snap = {};
	$scope.restore_snap = {};
	$scope.editor = undefined;

    $scope.$watch('paginator', function(filter, previous) {
        $scope.page = $scope.paginator.getPage();
    }, true);
	
	$scope.$on('loadRepositoryEvent', function() {
		$scope.snapshot = null; // clear 'active' snapshot
		$scope.reload();
	});

	$scope.reload=function(){
		$scope.loadIndices();
		$scope.loadRepositories();
		if (notEmpty($scope.snapshot_repository)) {
			$scope.fetchSnapshots($scope.snapshot_repository);
		}
	};
	
	$scope.loadIndices=function() {
		if (isDefined($scope.cluster)) {
			$scope.indices = $scope.cluster.indices || [];
		}
	};

	$scope.optionalParam=function(body, object, paramname){
		if(angular.isDefined(object[paramname])) {
			body[paramname] = object[paramname];
		}
		return body;
	};

    $scope.executeDeleteRepository = function(repository) {
        ElasticService.client.deleteRepository(repository.name,
            function(response) {
                AlertService.success("Repository successfully deleted", response);
                if (notEmpty($scope.snapshot_repository) && $scope.snapshot_repository == repository.name) {
                    $scope.snapshot_repository = '';
                }
                $scope.reload();
            },
            function(error) {
                AlertService.error("Error while deleting repositor", error);
            }
        );
    };

	$scope.deleteRepository=function(repository) {
		ConfirmDialogService.open(
			"are you sure you want to delete repository " + repository.name + "?",
			repository.settings,
			"Delete",
            function() { $scope.executeDeleteRepository(repository); }
		);
	};

	$scope.restoreSnapshot=function() {
		var body = {};
		// dont add to body if not present, these are optional, all indices included by default
		if (angular.isDefined($scope.restore_snap.indices) && $scope.restore_snap.indices.length > 0) {
			body.indices = $scope.restore_snap.indices.join(",");
		}

		if (angular.isDefined($scope.restore_snap.include_global_state)) {
			body.include_global_state = $scope.restore_snap.include_global_state;
		}

		$scope.optionalParam(body, $scope.restore_snap, "ignore_unavailable");
		$scope.optionalParam(body, $scope.restore_snap, "rename_replacement");
		$scope.optionalParam(body, $scope.restore_snap, "rename_pattern");

		ElasticService.client.restoreSnapshot($scope.snapshot_repository, $scope.snapshot.name, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot Restored Started");
				$scope.reload();
			},
			function(error) {
                AlertService.error("Error while started restore of snapshot", error);
			}
		);
	};

    $scope.createRepository=function(){
        try {
            $scope.repository_form.validate();
            ElasticService.client.createRepository($scope.repository_form.name, $scope.repository_form.asJson(),
                function(response) {
                    AlertService.success("Repository created");
                    $scope.loadRepositories();
                },
                function(error) {
                    AlertService.error("Error while creating repository", error);
                }
            );
        } catch (error) {
            AlertService.error(error);
        }
    };

	$scope.loadRepositories=function() {
		ElasticService.client.getRepositories(
			function(response) {
                $scope.repositories = response;
			},
			function(error) {
                $scope.repositories = [];
                AlertService.error("Error while reading repositories", error);
			}
		);
	};

	$scope.createSnapshot=function(){
		var body = {};

		// name and repo required
		if (!isDefined($scope.new_snap.repository)) {
			AlertService.warn("Repository is required");
			return;
		}

		if (!isDefined($scope.new_snap.name)) {
			AlertService.warn("Snapshot name is required");
			return;
		}

		// dont add to body if not present, these are optional, all indices included by default
		if (isDefined($scope.new_snap.indices) && $scope.new_snap.indices.length > 0) {
			body.indices = $scope.new_snap.indices.join(",");
		}

		if(isDefined($scope.new_snap.include_global_state)) {
			body.include_global_state = $scope.new_snap.include_global_state;
		}
		
		$scope.optionalParam(body, $scope.new_snap, "ignore_unavailable");

		ElasticService.client.createSnapshot($scope.new_snap.repository.name, $scope.new_snap.name, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot created");
				$scope.reload();
			},
			function(error) {
                AlertService.error("Error while creating snapshot", error);
			}
		);
	};

	$scope.deleteSnapshot=function(snapshot) {
			ConfirmDialogService.open(
			"are you sure you want to delete snapshot " + snapshot.name + "?",
			snapshot,
			"Delete",
			function() {
				ElasticService.client.deleteSnapshot(
					$scope.snapshot_repository,
					snapshot.name,
					function(response) {
						AlertService.success("Snapshot successfully deleted", response);
						$scope.reload();
					},
					function(error) {
                        AlertService.error("Error while deleting snapshot", error);
					}
				);
			}
		);
	};

	$scope.fetchSnapshots=function(repository) {
		ElasticService.client.getSnapshots(repository,
			function(response) {
                $scope.paginator.setCollection(response);
                $scope.page = $scope.paginator.getPage();
			},
			function(error) {
                $scope.paginator.setCollection([]);
                $scope.page = $scope.paginator.getPage();
                AlertService.error("Error while fetching snapshots", error);
			}
		);
	};

	$scope.selectSnapshot=function(snapshot) {
		$scope.snapshot = snapshot;
	};
	
	$scope.unselectSnapshot=function() {
		$scope.snapshot = null;
	};
	
	$scope.selectRepository=function(repository) {
		$scope.snapshot_repository = repository;
		$scope.fetchSnapshots(repository);
	};
}]);

kopf.controller('ConfirmDialogController', ['$scope', '$location', '$timeout', 'ConfirmDialogService', function($scope, $location, $timeout, ConfirmDialogService) {

	$scope.dialog_service = ConfirmDialogService;
	
	$scope.close=function() {
		$scope.dialog_service.close();
	};
	
	$scope.confirm=function() {
		$scope.dialog_service.confirm();
	};
	
}]);
kopf.controller('WarmupController', ['$scope', 'ConfirmDialogService', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, ConfirmDialogService, AlertService, AceEditorService, ElasticService) {
	$scope.editor = undefined;
	$scope.indices = [];
	$scope.index = null;
	$scope.paginator = new Paginator(1, 10, [], new WarmerFilter(""));
    $scope.page = $scope.paginator.getPage();
	
	$scope.warmer = new Warmer('', '', { types: [], source: {} });

    $scope.warmers = [];

    $scope.$watch('paginator', function(filter, previous) {
        $scope.page = $scope.paginator.getPage();
    }, true);

	$scope.$on('loadWarmupEvent', function() {
		$scope.loadIndices();
		$scope.initEditor();
	});
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('warmup-query-editor');
		}
	};

	$scope.loadIndices=function() {
		$scope.indices = $scope.cluster.indices;
	};
	
	$scope.createWarmerQuery=function() {
		if ($scope.editor.hasContent()) {
			$scope.editor.format();
			if (!isDefined($scope.editor.error)) {
                $scope.warmer.source = $scope.editor.getValue();
				ElasticService.client.registerWarmupQuery($scope.warmer,
					function(response) {
                        $scope.loadIndexWarmers();
                        AlertService.success("Warmup query successfully registered", response);
					},
					function(error) {
                        AlertService.error("Request did not return a valid JSON", error);
					}
				);
			}
		} else {
			AlertService.error("Warmup query body can't be empty");
		}
	};
	
	$scope.deleteWarmupQuery=function(warmer) {
		ConfirmDialogService.open(
			"are you sure you want to delete query " + warmer.id + "?",
			warmer.source,
			"Delete",
			function() {
				ElasticService.client.deleteWarmupQuery(warmer,
					function(response) {
                        AlertService.success("Warmup query successfully deleted", response);
                        $scope.loadIndexWarmers();
					},
					function(error) {
                        AlertService.error("Error while deleting warmup query", error);
					}
				);
			}
		);
	};
	
	$scope.loadIndexWarmers=function() {
		if (isDefined($scope.index)) {
			ElasticService.client.getIndexWarmers($scope.index, "",
				function(warmers) {
                    $scope.paginator.setCollection(warmers);
                    $scope.page = $scope.paginator.getPage();
				},
				function(error) {
                    $scope.paginator.setCollection([]);
                    $scope.page = $scope.paginator.getPage();
                    AlertService.error("Error while fetching warmup queries", error);
				}
			);
		} else {
			$scope.paginator.setCollection([]);
            $scope.page = $scope.paginator.getPage();
		}
	};
	
}]);
kopf.controller('BenchmarkController', ['$scope', '$location', '$timeout', 'AlertService', 'ElasticService', function($scope, $location, $timeout, AlertService, ElasticService) {
	$scope.bench = new Benchmark();
	$scope.competitor = new Competitor();
	$scope.indices = [];
	$scope.types = [];

	$scope.$on('loadBenchmarkEvent', function() {
		if (isDefined($scope.cluster)) {
			$scope.indices = $scope.cluster.indices || [];
		}
	});
	
	$scope.addCompetitor=function() {
		if (notEmpty($scope.competitor.name)) {
			this.bench.addCompetitor($scope.competitor);
			$scope.competitor = new Competitor();	
		} else {
			AlertService.error("Competitor needs a name");
		}
	};
	
	$scope.removeCompetitor=function(index) {
		$scope.bench.competitors.splice(index, 1);
	};
	
	$scope.editCompetitor=function(index) {
		var edit = $scope.bench.competitors.splice(index, 1);
		$scope.competitor = edit[0];
	};
	
	$scope.runBenchmark=function() {
		$('#benchmark-result').html('');
		try {
			var json = $scope.bench.toJson();
			ElasticService.client.executeBenchmark(json, 
				function(response) {
					$scope.result = JSONTree.create(response);
					$('#benchmark-result').html($scope.result);
				},
				function(error, status) {
                    if (status == 503) {
                        AlertService.info("No available nodes for executing benchmark. At least one node must be started with '--node.bench true' option.");
                    } else {
                        AlertService.error(error.error);
                    }
				}
			);
		} catch (error) {
			AlertService.error(error);
		}
	};
	
}]);
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
		return this.addAlert(new Alert(message, response, "error", "alert-danger", "fa fa-warning"), timeout);
	};
	
	// creates an info alert
	this.info=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "info", "alert-info", "fa fa-info"), timeout);
	};
	
	// creates success alert
	this.success=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "success", "alert-success", "fa fa-check"), timeout);
	};
	
	// creates a warn alert
	this.warn=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 10000;
		return this.addAlert(new Alert(message, response, "warn", "alert-warning", "fa fa-info"), timeout);
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
	
	this.theme = "dark";
	
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
kopf.factory('ElasticService', ['$http','$q', function($http, $q) {
    this.client = null;
    this.connection = null;

    this.connect=function(url) {
        this.client = null;
        this.connection = null;
        if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
            url = "http://" + url;
        }
        this.connection = new ESConnection(url);
        this.client = new ElasticClient(this.connection, $http, $q);
    };

    this.isConnected=function() {
      return isDefined(this.client);
    };

    return this;

}]);
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
function Benchmark() {
	this.name = '';
	this.num_executor = 1;
	this.percentiles = '[10, 25, 50, 75, 90, 99]';
	this.competitors = [ ];
	
	this.addCompetitor=function(competitor) {
		this.competitors.push(competitor);
	};
	
	this.toJson=function() {
		var body = {};
		body.name = this.name;
		if (notEmpty(this.num_executor)) {
			body.num_executor_nodes = this.num_executor;
		}
		if (notEmpty(this.percentiles)) {
			body.percentiles = JSON.parse(this.percentiles);
		}
		if (this.competitors.length > 0) {
			body.competitors = this.competitors.map(function(c) { return c.toJson(); });
		}
		if (notEmpty(this.iterations)) {
			body.iterations = this.iterations;
		}
		if (notEmpty(this.concurrency)) {
			body.concurrency = this.concurrency;
		}
		if (notEmpty(this.multiplier)) {
			body.multiplier = this.multiplier;
		}
		if (notEmpty(this.num_slowest)) {
			body.num_slowest = this.num_slowest;
		}
		return JSON.stringify(body, null, 4);
	};
	
}

function Competitor() {
	this.name = '';

	// override benchmark options
	this.iterations = '';
	this.concurrency = '';
	this.multiplier = '';
	this.num_slowest = '';
	this.warmup = true;
	this.requests = [];
	
	// defined only by competitor
	this.search_type = 'query_then_fetch';
	this.indices = '';
	this.types = '';
	
	// cache
	this.filter_cache = false;
	this.field_data = false;
	this.recycler_cache = false;
	this.id_cache = false;
	
	this.cache_fields = '';
	this.cache_keys = '';
	
	this.toJson=function() {
		var body = {};
		body.name = this.name;
		if (notEmpty(this.requests)) {
			body.requests = JSON.parse(this.requests);
		}
		if (notEmpty(this.iterations)) {
			if (isNumber(this.iterations)) {
				body.iterations = parseInt(this.iterations);
			} else {
				throw "Iterations must be a valid number";
			}
		}
		if (notEmpty(this.concurrency)) {
			if (isNumber(this.concurrency)) {
				body.concurrency = parseInt(this.concurrency);
			} else {
				throw "Concurrency must be a valid number";
			}
		}
		if (notEmpty(this.multiplier)) {
			if (isNumber(this.multiplier)) {
				body.multiplier = parseInt(this.multiplier);
			} else {
				throw "Multiplier must be a valid number";
			}
		}
		if (notEmpty(this.num_slowest)) {
			if (isNumber(this.num_slowest)) {
				body.num_slowest = parseInt(this.num_slowest);
			} else {
				throw "Num slowest must be a valid number";
			}
		}
		if (notEmpty(this.indices)) {
			body.indices = this.indices.split(",").map(function(index) { return index.trim(); });
		}
		if (notEmpty(this.types)) {
			body.types = this.types.split(",").map(function(type) { return type.trim(); });
		}

		body.search_type = this.search_type;

		body.clear_caches = {};
		body.clear_caches.filter = this.filter_cache;
		body.clear_caches.field_data = this.field_data;
		body.clear_caches.id = this.id_cache;
		body.clear_caches.recycler = this.recycler_cache;
		if (notEmpty(this.cache_fields)) {
			body.clear_caches.fields = this.cache_fields.split(",").map(function(field) { return field.trim(); });
		}
		if (notEmpty(this.cache_keys)) {
			body.clear_caches.filter_keys = this.cache_keys.split(",").map(function(key) { return key.trim(); });
		}
		
		return body;
	};
	
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
function Paginator(page, page_size, collection, filter) {

    this.filter = filter;

    this.page = page;

    this.page_size = page_size;

    this.$collection = isDefined(collection) ? collection : [];

    this.nextPage=function() {
        this.page += 1;
    };

    this.previousPage=function() {
        this.page -= 1;
    };

    this.getPage=function() {
        var results = this.getResults();
        var total = results.length;

        var first = total > 0 ? ((this.page - 1) * this.page_size) + 1 : 0;
        while (total < first) {
            this.previousPage();
            first = (this.page - 1) * this.page_size + 1;
        }
        var last = this.page * this.page_size > total ? total : this.page * this.page_size;

        var elements = total > 0 ? results.slice(first - 1, last) : [];

        var next = this.page_size * this.page < total;
        var previous = this.page > 1;
        while (elements.length < this.page_size) {
            elements.push(null);
        }
        return new Page(elements, total, first, last, next, previous);
    };

    this.setCollection=function(collection) {
        this.$collection = collection;
    };

    this.getResults=function() {
        var filter = this.filter;
        var collection = this.$collection;
        if (filter.isBlank()) {
            return collection;
        } else {
            var filtered_collection = [];
            collection.forEach(function(item) {
                if (filter.matches(item)) {
                    filtered_collection.push(item);
                }
            });
            return filtered_collection;
        }
    };


    this.getCollection=function() {
        return this.$collection;
    };

}

function Page(elements, total, first, last, next, previous) {
    this.elements = elements;
    this.total = total;
    this.first = first;
    this.last = last;
    this.next = next;
    this.previous = previous;
}
function AliasFilter(index, alias) {

    this.index = index;
    this.alias = alias;

    this.clone=function() { return new AliasFilter(this.index, this.alias); };

    this.equals=function(other) {
        return other !== null && this.index == other.index && this.alias == other.alias;
    };

    this.isBlank=function() { return !notEmpty(this.index) && !notEmpty(this.alias); };

    this.matches=function(index_alias) {
        if (this.isBlank()) {
            return true;
        } else {
            var matches = true;
            if (notEmpty(this.index)) {
                matches = index_alias.index.indexOf(this.index) != -1;
            }
            if (matches && notEmpty(this.alias)) {
                matches = false;
                var aliases = index_alias.aliases;
                for (var i = 0; !matches && i < aliases.length; i++) {
                    var alias = aliases[i];
                    matches = alias.alias.indexOf(this.alias) != -1;
                }
            }
            return matches;
        }
    };

}
function SnapshotFilter() {

    this.clone=function() { return new SnapshotFilter(); };

    this.equals=function(other) { return other !== null; };

    this.isBlank=function() { return true; };

    this.matches=function(snapshot) { return true; };

}
function WarmerFilter(id) {

    this.id = id;

    this.clone=function() { return new WarmerFilter(this.id); };

    this.equals=function(other) {
        return other !== null && this.id == other.id;
    };

    this.isBlank=function() { return !notEmpty(this.id); };

    this.matches=function(warmer) {
        if (this.isBlank()) {
            return true;
        } else {
            return warmer.id.indexOf(this.id) != -1;
        }
    };

}
function IndexFilter(name, state, hide_special, timestamp) {
    this.name = name;
    this.state = state;
    this.hide_special = hide_special;
    this.timestamp = timestamp;

    this.clone=function() {
        return new IndexFilter(this.name, this.state, this.hide_special, this.timestamp);
    };

    this.equals=function(other) {
        return (
            other !== null &&
            this.name == other.name &&
            this.state == other.state &&
            this.hide_special === other.hide_special &&
            this.timestamp == other.timestamp
        );
    };

    this.isBlank=function() {
        return !notEmpty(this.name) && !notEmpty(this.state) && !notEmpty(this.hide_special);
    };

    this.matches=function(index) {
        if (this.isBlank()) {
            return true;
        } else {
            var matches = true;
            if (this.hide_special) {
                matches = !index.special;
            }
            if (matches && notEmpty(this.state)) {
                if (this.state == "unhealthy" && !index.unhealthy) {
                    matches = false;
                } else if ((this.state == "open" || this.state == "close") && this.state != index.state) {
                    matches = false;
                }
            }
            if (matches && notEmpty(this.name)) {
                try {
                    var reg = new RegExp(this.name.trim(), "i");
                    matches = reg.test(index.name);
                }
                catch (err) { // if not valid regexp, still try normal matching
                    matches = index.name.indexOf(this.name.toLowerCase()) != -1;
                }
            }
            return matches;
        }
    };

}
function NodeFilter(name, data, master, client, timestamp) {
    this.name = name;
    this.data = data;
    this.master = master;
    this.client = client;
    this.timestamp = timestamp;

    this.clone=function() {
        return new NodeFilter(this.name, this.data, this.master, this.client);
    };

    this.equals=function(other) {
        return (
            other !== null &&
            this.name == other.name &&
            this.data == other.data &&
            this.master == other.master &&
            this.client == other.client &&
            this.timestamp == other.timestamp
            );
    };

    this.isBlank=function() {
        return !notEmpty(this.name) && (this.data && this.master && this.client);
    };

    this.matches=function(node) {
        if (this.isBlank()) {
            return true;
        } else {
            var matches = notEmpty(this.name) ? node.name.toLowerCase().indexOf(this.name.toLowerCase()) != -1 : true;
            return matches && (node.data && this.data || node.master && this.master || node.client && this.client);
        }
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

function isNumber(value) {
	var exp = /\d+/;
	return exp.test(value);
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