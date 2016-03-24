kopf.factory('ElasticService', ['$http', '$q', '$timeout', '$location',
  'ExternalSettingsService', 'DebugService', 'AlertService',
  function($http, $q, $timeout, $location, ExternalSettingsService,
           DebugService, AlertService) {

    var instance = this;

    this.connection = undefined;

    this.connected = false;

    this.cluster = undefined;

    this.autoRefreshStarted = false;

    this.brokenCluster = false;

    this.encodeURIComponent = function(text) {
      return encodeURIComponent(text);
    };

    var encode = function(text) {
      return instance.encodeURIComponent(text);
    };

    /**
     * Resets service state
     */
    this.reset = function() {
      this.connection = undefined;
      this.connected = false;
      this.cluster = undefined;
    };

    this.getIndices = function() {
      return this.cluster ? this.cluster.indices : [];
    };

    this.getNodes = function() {
      return this.cluster ? this.cluster.getNodes() : [];
    };

    this.getOpenIndices = function() {
      return this.cluster ? this.cluster.open_indices() : [];
    };

    this.isConnected = function() {
      return this.connected;
    };

    this.alertClusterChanges = function() {
      if (isDefined(this.cluster)) {
        var changes = this.cluster.changes;
        if (changes.hasChanges()) {
          if (changes.hasJoins()) {
            var joins = changes.nodeJoins.map(function(node) {
              return node.name + '[' + node.transportAddress + ']';
            });
            AlertService.info(joins.length + ' new node(s) joined the cluster',
                joins);
          }
          if (changes.hasLeaves()) {
            var leaves = changes.nodeLeaves.map(function(node) {
              return node.name + '[' + node.transportAddress + ']';
            });
            AlertService.warn(changes.nodeLeaves.length +
            ' node(s) left the cluster', leaves);
          }
          if (changes.hasCreatedIndices()) {
            var created = changes.indicesCreated.map(function(index) {
              return index.name;
            });
            AlertService.info(changes.indicesCreated.length +
            ' indices created: [' + created.join(',') + ']');
          }
          if (changes.hasDeletedIndices()) {
            var deleted = changes.indicesDeleted.map(function(index) {
              return index.name;
            });
            AlertService.info(changes.indicesDeleted.length +
            ' indices deleted: [' + deleted.join(',') + ']');
          }
        }
      }
    };

    /**
     * Connects to Elasticsearch instance and triggers auto polling of cluster
     * state
     *
     * @param {string} host - Elasticsearch url
     */
    this.connect = function(host) {
      this.reset();
      var root = ExternalSettingsService.getElasticsearchRootPath();
      var withCredentials = ExternalSettingsService.withCredentials();
      this.connection = new ESConnection(host + root, withCredentials);
      DebugService.debug('Elasticseach connection:', this.connection);
      this.clusterRequest('GET', '/', {}, {},
          function(data) {
            if (data.OK) { // detected https://github.com/Asquera/elasticsearch-http-basic
              DebugService.debug('elasticsearch-http-basic plugin detected');
              DebugService.debug('Attemping to connect with [' + host + '/]');
              instance.connect(host + '/');
            } else {
              instance.setVersion(data.version.number);
              instance.connected = true;
              if (!instance.autoRefreshStarted) {
                instance.autoRefreshStarted = true;
                instance.autoRefreshCluster();
              } else {
                instance.refresh();
              }
            }
          },
          function(data) {
            if (data.status == 503) {
              DebugService.debug('No active master, switching to basic mode');
              instance.setVersion(data.version.number);
              instance.connected = true;
              instance.setBrokenCluster(true);
              AlertService.error('No active master, switching to basic mode');
              if (!instance.autoRefreshStarted) {
                instance.autoRefreshStarted = true;
                instance.autoRefreshCluster();
              }
            } else {
              AlertService.error(
                  'Error connecting to [' + instance.connection.host + ']',
                  data
              );
            }
          }
      );
    };

    this.setVersion = function(version) {
      this.version = new Version(version);
      if (!this.version.isValid()) {
        DebugService.debug('Invalid Elasticsearch version[' + version + ']');
        throw 'Invalid Elasticsearch version[' + version + ']';
      }
    };

    this.getVersion = function() {
      return this.version;
    };

    this.getHost = function() {
      return this.isConnected() ? this.connection.host : '';
    };

    this.versionCheck = function(version) {
      if (isDefined(this.version.isValid())) {
        return this.version.isGreater(new Version(version));
      } else {
        return true;
      }
    };

    /**
     * Creates an index
     *
     * @param {string} name - new index name
     * @param {Object} settings - index settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createIndex = function(name, settings, success, error) {
      var path = '/' + encode(name);
      this.clusterRequest('POST', path, {}, settings, success, error);
    };

    /**
     * Enables shard allocation
     *
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.enableShardAllocation = function(success, error) {
      var body = {
        transient: {
          'cluster.routing.allocation.enable': 'all'
        }
      };
      this.clusterRequest('PUT', '/_cluster/settings', {}, body, success,
          error);
    };

    /**
     * Disables shard allocation
     *
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.disableShardAllocation = function(success, error) {
      var body = {
        transient: {
          'cluster.routing.allocation.enable': 'none'
        }
      };
      this.clusterRequest('PUT', '/_cluster/settings', {}, body, success,
          error);
    };

    /**
     * Opens index
     *
     * @param {string} index - index name
     */
    this.openIndex = function(index) {
      var path = '/' + encode(index) + '/_open';
      var success = function(response) {
        AlertService.success('Index was successfully opened', response);
        instance.refresh();
      };
      var error = function(response) {
        AlertService.error('Error while opening index', response);
      };
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Optimizes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.optimizeIndex = function(index, success, error) {
      var path = '/' + encode(index) + '/_optimize';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Clears index cache
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.clearCache = function(index, success, error) {
      var path = '/' + encode(index) + '/_cache/clear';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Closes index
     *
     * @param {string} index - index name
     */
    this.closeIndex = function(index) {
      var path = '/' + encode(index) + '/_close';
      var success = function(response) {
        AlertService.success('Index was successfully closed', response);
        instance.refresh();
      };
      var error = function(error) {
        AlertService.error('Error while closing index', error);
      };
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Refreshes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.refreshIndex = function(index, success, error) {
      var path = '/' + encode(index) + '/_refresh';
      this.clusterRequest('POST', path, {}, {}, success, error);
    };

    /**
     * Deletes index
     *
     * @param {string} index - index name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteIndex = function(index, success, error) {
      var path = '/' + encode(index);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Updates index settings
     *
     * @param {string} name - index name
     * @param {Object} settings - index settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateIndexSettings = function(name, settings, success, error) {
      var path = '/' + encode(name) + '/_settings';
      this.clusterRequest('PUT', path, {}, settings, success, error);
    };

    /**
     * Updates the cluster settings
     *
     * @param {Object} settings - new cluster settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateClusterSettings = function(settings, success, error) {
      var path = '/_cluster/settings';
      this.clusterRequest('PUT', path, {}, settings, success, error);
    };

    /**
     * Deletes a warmer
     *
     * @param {Warmer} warmer - warmer to be deleted
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteWarmer = function(warmer, success, error) {
      var path = '/' + encode(warmer.index) + '/_warmer/' + encode(warmer.id);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Deletes a percolator
     *
     * @param {string} index - percolator target index
     * @param {string} id - percolator id
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deletePercolatorQuery = function(index, id, success, error) {
      var path = '/' + encode(index) + '/.percolator/' + encode(id);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Creates a percolator query
     *
     * @param {Percolator} percolator - percolator to be created
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createPercolatorQuery = function(percolator, success, error) {
      var index = percolator.index;
      var id = percolator.id;
      var path = '/' + encode(index) + '/.percolator/' + encode(id);
      this.clusterRequest('PUT', path, {}, percolator.source, success, error);
    };

    /**
     * Creates a repository
     *
     * @param {string} repository - repository name
     * @param {Object} body - repository settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createRepository = function(repository, body, success, error) {
      var path = '/_snapshot/' + encode(repository);
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Deletes a repository
     *
     * @param {string} repository - repository name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteRepository = function(repository, success, error) {
      var path = '/_snapshot/' + encode(repository);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Deletes a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} snapshot - snapshot name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteSnapshot = function(repository, snapshot, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/' + encode(snapshot);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Restores a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} name - snapshot name
     * @param {Object} body - restore settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.restoreSnapshot = function(repository, name, body, success, error) {
      var path = '/_snapshot/' + encode(repository);
      path += '/' + encode(name) + '/_restore';
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Creates a snapshot
     *
     * @param {string} repository - repository name
     * @param {string} snapshot - snapshot name
     * @param {Object} body - snapshot settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createSnapshot = function(repository, snapshot, body, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/' + encode(snapshot);
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Executes a benchmark
     *
     * @param {Object} body - benchmark settings
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.executeBenchmark = function(body, success, error) {
      var path = '/_bench';
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Registers a warmer query
     *
     * @param {Warmer} warmer - Warmer query
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.registerWarmer = function(warmer, success, error) {
      var path = '/' + encode(warmer.index);
      if (notEmpty(warmer.types)) {
        path += '/' + encode(warmer.types);
      }
      path += '/_warmer/' + encode(warmer.id.trim());
      var body = warmer.source;
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Updates indices aliases
     *
     * @param {Alias[]} add - aliases that should be added
     * @param {Alias[]} remove - aliases that should be removed
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.updateAliases = function(add, remove, success, error) {
      var data = {actions: []};
      add.forEach(function(a) {
        data.actions.push({add: a.info()});
      });
      remove.forEach(function(a) {
        data.actions.push({remove: a.info()});
      });
      this.clusterRequest('POST', '/_aliases', {}, data, success, error);
    };

    /**
     * Deletes an index template
     *
     * @param {string} name - template name
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.deleteIndexTemplate = function(name, success, error) {
      var path = '/_template/' + encode(name);
      this.clusterRequest('DELETE', path, {}, {}, success, error);
    };

    /**
     * Creates a new index template
     *
     * @param {IndexTemplate} template - The index template
     * @callback success - invoked on success
     * @callback error - invoked on error
     */
    this.createIndexTemplate = function(template, success, error) {
      var path = '/_template/' + encode(template.name);
      var body = template.body;
      this.clusterRequest('PUT', path, {}, body, success, error);
    };

    /**
     * Fetches all index templates
     * @callback success
     * @callback error
     */
    this.getIndexTemplates = function(success, error) {
      var path = '/_template';
      var parseTemplates = function(response) {

        var templates = Object.keys(response).map(function(name) {
          return new IndexTemplate(name, response[name]);
        });
        success(templates);
      };
      this.clusterRequest('GET', path, {}, {}, parseTemplates, error);
    };

    /**
     * Relocates a shard to a given node
     * @param {string} shard - The shard to be relocated
     * @param {string} index - The index the shard belongs to
     * @param {string} fromNode - Node where shard is currently located
     * @param {string} toNode - Target node for shard relocation
     * @callback success
     * @callback error
     */
    this.relocateShard = function(shard, index, fromNode, toNode,
                                  success, error) {
      var path = '/_cluster/reroute';
      var body = {
        commands: [
          {
            move: {
              shard: shard,
              index: index,
              from_node: fromNode,
              to_node: toNode
            }
          }
        ]
      };
      this.clusterRequest('POST', path, {}, body, success, error);
    };

    /**
     * Executes cat api request
     * @callback success
     * @callback error
     */
    this.executeCatRequest = function(api, success, error) {
      var path = '/_cat/' + encode(api) + '?v';
      var parseCat = function(response) {
        success(new CatResult(response));
      };
      this.clusterRequest('GET', path, {}, {}, parseCat, error);
    };

    /**
     * Get hot threads
     *
     * @param {string} node - The target node(or empty if all)
     * @param {string} type - the type of threads to be sampled
     * @param {string} threads - The number of threads to be sampled
     * @param {string} interval - The sampling interval in ms
     * @param {boolean} ignoreIdleThreads - Ignores idle threads or not
     * @callback success
     * @callback error
     */
    this.getHotThreads = function(node, type, threads, interval,
                                  ignoreIdleThreads, success, error) {
      var path = '/_nodes' + (node ? '/' + encode(node) : '') + '/hot_threads';
      var params = {
        type: type,
        threads: threads,
        ignore_idle_threads: ignoreIdleThreads,
        interval: interval
      };
      var parseHotThreads = function(response) {
        var threads = new HotThreads(response).nodes_hot_threads;
        success(threads);
      };
      this.clusterRequest('GET', path, params, {}, parseHotThreads, error);
    };

    /**
     * Retrieve comples cluster mapping
     *
     * @callback success
     * @callback error
     */
    this.getClusterMapping = function(success, error) {
      var transformed = function(response) {
        success(new ClusterMapping(response));
      };
      var path = '/_mapping';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    this.getIndexMetadata = function(name, success, error) {
      var transformed = function(response) {
        success(new IndexMetadata(name, response.metadata.indices[name]));
      };
      var path = '/_cluster/state/metadata/' + encode(name) + '?human';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    this.getNodeStats = function(nodeId, success, error) {
      var transformed = function(response) {
        success(new NodeStats(name, response.nodes[nodeId]));
      };
      var path = '/_nodes/' + encode(nodeId) + '/stats?human';
      this.clusterRequest('GET', path, {}, {}, transformed, error);
    };

    /**
     * Fetches shard information both from index/_stats and index/_recovery
     * @param {string} shard - shard number
     * @param {string} index - index
     * @param {string} nodeId - node id
     * @callback success
     * @callback error
     */
    this.getShardStats = function(shard, index, nodeId, success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(
            host + '/' + encode(index) + '/_stats?level=shards&human',
            params
        ),
        $http.get(
            host + '/' + encode(index) + '/_recovery?active_only=true&human',
            params
        )
      ]).then(
          function(responses) {
            try {
              var indexStats = responses[0].data;
              var shardsStats = indexStats.indices[index].shards[shard];
              shardsStats = shardsStats ? shardsStats : [];
              var shardStats = shardsStats.filter(
                  function(stats) {
                    return stats.routing.node === nodeId;
                  }
              );
              if (shardStats.length == 1) { // shard is started
                success(new ShardStats(shard, index, shardStats[0]));
              } else { // non started shard
                var indexRecovery = responses[1].data;
                var shardRecoveries = indexRecovery[index].shards.filter(
                    function(recovery) {
                      return recovery.target.id === nodeId &&
                        recovery.id == shard;
                    });
                success(new ShardStats(shard, index, shardRecoveries[0]));
              }
            } catch (exception) {
              DebugService.debug('Error parsing output:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting shard stats data:', response);
            error(response);
          }
      );
    };

    this.fetchAliases = function(success, error) {
      var createAliases = function(response) {
        var indices = Object.keys(response);
        var allAliases = [];
        indices.forEach(function(index) {
          var indexAliases = response[index].aliases;
          if (indexAliases && Object.keys(indexAliases).length > 0) {
            var aliases = Object.keys(indexAliases).map(function(alias) {
              var info = indexAliases[alias];
              return new Alias(alias, index, info.filter, info.index_routing,
                  info.search_routing);
            });
            allAliases.push(new IndexAliases(index, aliases));
          }
        });
        success(allAliases);
      };
      this.clusterRequest('GET', '/_aliases', {}, {}, createAliases, error);
    };

    function analyze(index, body, success, error) {
      var buildTokens = function(response) {
        var tokens = response.tokens.map(function(t) {
          return new Token(t.token, t.start_offset, t.end_offset, t.position);
        });
        success(tokens);
      };
      var path = '/' + encode(index) + '/_analyze';
      instance.clusterRequest('POST', path, {}, body, buildTokens, error);
    }

    this.analyzeByField = function(index, field, text, success, error) {
      analyze(index, {text: text, field: field}, success, error);
    };

    this.analyzeByAnalyzer = function(index, analyzer, text, success, error) {
      analyze(index, {text: text, analyzer: analyzer}, success, error);
    };

    this.getIndexWarmers = function(index, warmer, success, error) {
      var path = '/' + encode(index) + '/_warmer/' + encode(warmer.trim());
      var parseWarmers = function(response) {
        var warmers = [];
        Object.keys(response).forEach(function(i) {
          var index = i;
          var indexWarmers = response[index].warmers;
          Object.keys(indexWarmers).forEach(function(warmerId) {
            warmers.push(new Warmer(warmerId, index, indexWarmers[warmerId]));
          });
        });
        success(warmers);
      };
      this.clusterRequest('GET', path, {}, {}, parseWarmers, error);
    };

    this.fetchPercolateQueries = function(index, query, success, error) {
      var path = '/' + encode(index) + '/.percolator/_search';
      var parsePercolators = function(response) {
        var collection = response.hits.hits.map(function(q) {
          return new PercolateQuery(q);
        });
        var from = query.from;
        var total = response.hits.total;
        var size = query.size;
        var percolators = new PercolatorsPage(from, size, total, collection);
        success(percolators);
      };
      var body = JSON.stringify(query);
      this.clusterRequest('POST', path, {}, body, parsePercolators, error);
    };

    this.getRepositories = function(success, error) {
      var parseRepositories = function(response) {
        var repositories = Object.keys(response).map(function(repository) {
          return new Repository(repository, response[repository]);
        });
        success(repositories);
      };
      var path = '/_snapshot/_all';
      this.clusterRequest('GET', path, {}, {}, parseRepositories, error);
    };

    this.getSnapshots = function(repository, success, error) {
      var path = '/_snapshot/' + encode(repository) + '/_all';
      var parseSnapshots = function(response) {
        var snapshots = response.snapshots.map(function(snapshot) {
          return new Snapshot(snapshot);
        });
        success(snapshots);
      };
      this.clusterRequest('GET', path, {}, {}, parseSnapshots, error);
    };

    this.clusterRequest = function(method, path, params, data, success, error) {
      var url = this.connection.host + path;
      var config = {method: method, url: url, data: data, params: params};
      this.addAuth(config);
      $http(config).
          success(function(data, status, headers, config) {
            try {
              success(data);
            } catch (exception) {
              DebugService.debug('Error parsing REST API data:', exception);
              DebugService.debug('REST API output:', data);
              error(exception);
            }
          }).
          error(function(data, status, headers, config) {
            DebugService.debug('Error executing request:', config);
            DebugService.debug('REST API output:', data);
            error(data);
          });
    };

    this.getClusterDetail = function(success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(host + '/_cluster/state/master_node,routing_table,blocks/',
            params),
        $http.get(host + '/_stats/docs,store', params),
        $http.get(host + '/_nodes/stats/jvm,fs,os,process', params),
        $http.get(host + '/_cluster/settings', params),
        $http.get(host + '/_aliases', params),
        $http.get(host + '/_cluster/health', params),
        $http.get(host + '/_nodes/_all/os,jvm', params),
        $http.get(host, params),
      ]).then(
          function(responses) {
            try {
              var state = responses[0].data;
              var indexStats = responses[1].data;
              var nodesStats = responses[2].data;
              var settings = responses[3].data;
              var aliases = responses[4].data;
              var health = responses[5].data;
              var nodes = responses[6].data;
              var main = responses[7].data;
              var cluster = new Cluster(health, state, indexStats, nodesStats,
                  settings, aliases, nodes, main);
              success(cluster);
            } catch (exception) {
              DebugService.debug('Error parsing cluster data:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting cluster data:', response);
            error(response);
          }
      );
    };

    this.getBrokenClusterDetail = function(success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      $q.all([
        $http.get(host +
            '/_cluster/state/master_node,blocks?local=true',
            params),
        $http.get(host + '/_nodes/stats/jvm,fs,os?local=true', params),
        $http.get(host + '/_cluster/settings?local=true', params),
        $http.get(host + '/_cluster/health?local=true', params),
        $http.get(host + '/_nodes/_all/os,jvm?local=true', params)
      ]).then(
          function(responses) {
            try {
              var state = responses[0].data;
              var nodesStats = responses[1].data;
              var settings = responses[2].data;
              var health = responses[3].data;
              var nodes = responses[4].data;
              var cluster = new BrokenCluster(health, state, nodesStats,
                  settings, nodes);
              success(cluster);
            } catch (exception) {
              DebugService.debug('Error parsing cluster data:', exception);
              DebugService.debug('REST APIs output:', responses);
              error(exception);
            }
          },
          function(response) {
            DebugService.debug('Error requesting cluster data:', params);
            DebugService.debug('REST API output:', response);
            AlertService.error('Error requesting cluster data', response);
            instance.cluster = undefined;
          }
      );
    };

    this.getClusterDiagnosis = function(health, state, stats, hotthreads,
                                        success, error) {
      var host = this.connection.host;
      var params = {};
      this.addAuth(params);
      var requests = [];
      if (health) {
        requests.push($http.get(host + '/_cluster/health', params));
      }
      if (state) {
        requests.push($http.get(host + '/_cluster/state', params));
      }
      if (stats) {
        requests.push($http.get(host + '/_nodes/stats?all=true', params));
      }
      if (hotthreads) {
        requests.push($http.get(host + '/_nodes/hot_threads', params));
      }
      $q.all(requests).then(
          function(responses) {
            try {
              success(responses.map(function(response) {
                return response.data;
              }));
            } catch (exception) {
              error(exception);
            }
          },
          function(response) {
            error(response);
          }
      );
    };

    this.refresh = function() {
      if (this.isConnected()) {
        var threshold = (ExternalSettingsService.getRefreshRate() * 0.75);
        $timeout(function() {
          var start = new Date().getTime();
          if (instance.brokenCluster) {
            instance.getBrokenClusterDetail(
                function(brokenCluster) {
                  instance.cluster = brokenCluster;
                  if (instance.cluster.status !== 'red') {
                    DebugService.debug('Switching to normal mode');
                    instance.setBrokenCluster(false);
                  }
                },
                function(response) {
                  AlertService.error('Error loading cluster data', response);
                  instance.cluster = undefined;
                }
            );
          } else {
            instance.getClusterDetail(
                function(cluster) {
                  var end = new Date().getTime();
                  var took = end - start;
                  if (took >= threshold) {
                    AlertService.warn('Loading cluster information is taking ' +
                    'too long. Try increasing the refresh interval');
                  }
                  cluster.computeChanges(instance.cluster);
                  instance.cluster = cluster;
                  instance.alertClusterChanges();
                },
                function(response) {
                  if (response.status === 503) {
                    var message = 'No active master, switching to basic mode';
                    DebugService.debug(message);
                    AlertService.error(message);
                    instance.setBrokenCluster(true);
                  } else {
                    AlertService.error('Error loading cluster data', response);
                    instance.cluster = undefined;
                  }
                }
            );
          }

        }, 100);
      } else {
        this.cluster = undefined;
      }
    };

    /**
     * Sets the cluster state as broken and refreshes cluster state.
     * If cluster is broken, redirect view to nodes view
     * @param {Boolean} broken - indicates if cluster is broken
     */
    this.setBrokenCluster = function(broken) {
      instance.brokenCluster = broken;
      if (broken) {
        $location.path('nodes');
      }
      instance.refresh();
    };

    this.autoRefreshCluster = function() {
      this.refresh();
      var nextRefresh = function() {
        instance.autoRefreshCluster();
      };
      $timeout(nextRefresh, ExternalSettingsService.getRefreshRate());
    };

    /**
     * Adds authentication information/cookies to request params
     * @param {Object} config - request config
     */
    this.addAuth = function(config) {
      if (isDefined(this.connection.auth)) {
        config.headers = {Authorization: this.connection.auth};
      }
      if (this.connection.withCredentials) {
        config.withCredentials = true;
      }
    };

    return this;

  }]);
