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












