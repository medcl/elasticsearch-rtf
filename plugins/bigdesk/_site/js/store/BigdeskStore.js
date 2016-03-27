/*   
   Copyright 2011-2014 Lukas Vlcek

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

/*
{
    cluster: {
        cluster_name: {
            connectionVerified: bool,
            intervals: {_all_active_intervals_},
            timeouts: {_all_active_timeouts_},
            storeSize: int,
            health: {},
            nodesStats: [
                timestamp_x: {
                    [nodeStats, nodeStats, ...]
                },
                timestamp_y: {[...]},
                timestamp_z: {[...]},
                ...
            ],
            nodesState: [
                {node_with_id},
                {node_with_id},
                ...
            ],
            nodeInfo: {}, //relevant to selected node
            clusterState: [
                clusterStateTimestamp: {},
                ...
            ],
            indicesStatus: [
                indicesStatusTimestamp: {},
                ...
            ]
        }
    }
}
*/

var Cluster = Backbone.Model.extend({
    defaults: {
        id: "not_set_yet",
        connectionVerified: false,
        health: undefined,
        nodesStats: undefined,
        nodesState: undefined,
        nodeInfo: undefined,
        clusterState: undefined,
        indicesStatus: undefined,
        storeSize: 60000, // 1min
        intervals: {},
        timeouts: {},
        dispatcher: undefined
    },
    // id: "cluster_name"
    // baseUrl: "complete URL for REST API including port number"
    // refreshInterval: _some_number_ [optional, defaults to 2000ms]
    // dispatcher: function [optional].
    initialize: function(attrs){
        var _model = this;
        var _conn = _model.get("connectionVerified");
        if (_conn == false) {
            // ensure default dispatcher (in case user explicitly provided "undefined" value instead of function)
            if (this.get("dispatcher") == undefined /*|| typeof this.get("dispatcher") != "function"*/) {
                console.log("using default dispatcher");
                var _dispatcher = _.clone(Backbone.Events);
                _dispatcher.on("onAjaxResponse", function(clusterName, restApiName, response) {
                    console.log("["+clusterName+"] ["+restApiName+"]", response)
                });
                this.set({dispatcher: _dispatcher});
            }
            var connection = {
                baseUrl: attrs.baseUrl,
                refreshInterval: attrs.refreshInterval || 2000
            };
            var hello = new Hello({},connection);
            hello.fetch({
                success: function(model, response){
                    var version = hello.get("version");
                    if (version && version.number) {
                        version = version.number;
                        var _vArray = version.split(".");
                        if (_vArray.length > 2 && _model.checkVersion(_vArray)) {
                            _model.versionVerified(version);
                            _model.initCluster(connection);
                        } else {
                            _model.yellAboutVersion(version);
                        }
                    } else {
                        _model.yellAboutVersion("n/a");
                    }
                },
                error: function(model, response) {
                    console.log("[Error] something wrong happened...", model, response);
                }
            });
        }
    },

    // When creating a new cluster, client has to provide both REST URL endpoint and cluster name.
    // The idea is that the cluster name is obtained by client upfront using cluster health API for example.
    validate: function(attrs){
        // this must be constructor call
        if (this.get("connectionVerified") == undefined) {
            if (!attrs.id || !attrs.baseUrl) {
                return "Both cluster name and URL must be provided.\n" +
                    "Example: { " +
                        "id: \"_cluster_name_\", " +
                        "baseUrl: \"_ES_REST_end_point_\" " +
                    "}";
            }
            if (attrs.dispatcher != undefined) {
                if (typeof attrs.dispatcher != "function") {
                    return "dispatcher must be a function.";
                }
            }
        }
    },

    // returns false or true depending on given version numbers
    checkVersion: function(parsedArray) {
		var major = parsedArray[0];
		var minor = parsedArray[1];
		var maintenance = parsedArray[2];
		var build = undefined;
		if (parsedArray.length > 3) {
			build = parsedArray[3]; // Betax, RCx, GAx ...
		}
        return (major == 1 && minor >= 0 && maintenance >= 0 && (build != 'Beta1' || build != 'Beta2'));
    },

    versionVerified: function(version) {
        console.log("Check ES node version: " + version + " [ok]");
    },

    yellAboutVersion: function(version) {
        var message =
            "*********************************\n" +
            "Bigdesk may not work correctly!\n" +
            "Found ES node version: " + version + "\n" +
            "Requires ES node version: >= 1.0.0.RC1\n" +
            "*********************************";
        console.log(message);
        if (alert) { alert(message); }
    },

    // connection.baseUrl
    // connection.refreshInterval
    initCluster: function(connection) {
        var _model = this;
        // connection has been already verified
        _model.set({connectionVerified: true});

        _model.set({        health: new ClusterHealth({}, connection) });
        _model.set({    nodesStats: new NodesStats([],    connection) });
        _model.set({    nodesState: new NodesState([],    connection) });
        _model.set({      nodeInfo: new NodeInfo({},      connection) });
        _model.set({  clusterState: new ClusterState([],  connection) });
        _model.set({ indicesStatus: new IndicesStatus([], connection) });

        this.startFetch(connection.refreshInterval);

    },

    clearTimeouts: function() {
        var _cluster = this;
        var timeouts = _cluster.get("timeouts");
        _.each(timeouts, function(num, key){
            _cluster.clearTimeout(key);
        });
    },

    clearTimeout: function(timeoutId) {
        var timeouts = this.get("timeouts");
        if (timeouts && timeouts[timeoutId]) {
            window.clearTimeout(timeouts[timeoutId]);
            delete timeouts[timeoutId];
            this.set({timeouts: timeouts});
        }
    },

    clearIntervals: function() {
        var _cluster = this;
        var intervals = this.get("intervals");
        _.each(intervals, function(num, key){
            _cluster.clearInterval(key);
        });
    },

    clearInterval: function(intervalId) {
//        console.log("stop interval " + intervalId);
        var intervals = this.get("intervals");
        if (intervals && intervals[intervalId]) {
            window.clearInterval(intervals[intervalId]);
            delete intervals[intervalId];
            this.set({intervals: intervals});
        }
    },

    startTimeout: function(timeoutId, functionCall, interval) {
        var _model = this;
        var timeouts = _model.get("timeouts");
        if (timeouts) {
            if (timeouts[timeoutId]) {
                console.log("[WARN] clearing and replacing existing timeout");
                _model.clearTimeout(timeoutId);
            }

            var timeoutFn = function() {
                functionCall();
				timeouts[timeoutId] = window.setTimeout(timeoutFn, interval);
                _model.set({timeouts: timeouts});
            };

            timeoutFn();
        }
    },

    startInterval: function(intervalId, functionCall, interval) {
        var _model = this;
        var intervals = this.get("intervals");
        if (intervals) {
            if (intervals[intervalId]) {
                console.log("[WARN] clearing and replacing existing interval");
                _model.clearInterval(intervalId);
            }
			intervals[intervalId] = window.setInterval(functionCall, interval);
            this.set({intervals: intervals});
            // fire callback right now
            functionCall();
        }
    },

    // start fetching bigdesk models and collections
    // params:
    //  refreshInterval
    //  baseUrl [optional] can override baseUrl that was passed into Cluster constructor
    startFetch: function(refreshInterval, baseUrl) {
        var _cluster = this;
        var _dispatcher = _cluster.get("dispatcher");
        var _clusterName = _cluster.get("id");

        if (baseUrl && typeof baseUrl == "string") {
            _cluster.get("health").setBaseUrl(baseUrl);
            _cluster.get("nodesStats").setBaseUrl(baseUrl);
            _cluster.get("nodesState").setBaseUrl(baseUrl);
            _cluster.get("nodeInfo").setBaseUrl(baseUrl);
            _cluster.get("clusterState").setBaseUrl(baseUrl);
            _cluster.get("indicesStatus").setBaseUrl(baseUrl);
        }

        var healthRefreshFunction = function(){
            _cluster.get("health").fetch({
                success: function(model, response){
                    _dispatcher.trigger("onAjaxResponse", _clusterName, "cluster > Health", response);
                }
            });
        };

        var nodesStatsRefreshFunction = function(){
            _cluster.get("nodesStats").fetch({
                add:        true,
                storeSize:  _cluster.get("storeSize"),
                now:        new Date().getTime(),
                silent:     true,
                success:    function(model, response){
                    _dispatcher.trigger("onAjaxResponse", _clusterName, "cluster > NodesStats", response);
                }
            });
        };

        var nodesStateRefreshFunction = function(){
            _cluster.get("nodesState").fetch({
                add:        true,
                silent:     true,
                success:    function(model, response){
                    _dispatcher.trigger("onAjaxResponse", _clusterName, "cluster > NodesState", response);
                }
            });
        };

        var clusterStateRefreshFunction = function(){
            _cluster.get("clusterState").fetch({
                add:        true,
                storeSize:  _cluster.get("storeSize"),
                now:        new Date().getTime(),
                silent:     true,
                success:    function(model, response){
                    _dispatcher.trigger("onAjaxResponse", _clusterName, "cluster > State", response);
                    _dispatcher.trigger("newClusterState");
                }
            });
        };

        var indicesStatusRefreshFunction = function(){
            _cluster.get("indicesStatus").fetch({
                add:        true,
                storeSize:  _cluster.get("storeSize"),
                now:        new Date().getTime(),
                silent:     true,
                success:    function(model, response){
                    _dispatcher.trigger("onAjaxResponse", _clusterName, "indices > Status", response);
                    _dispatcher.trigger("newIndicesStatus");
                }
            });
        };

        this.clearInterval("nodesStateInterval");
        this.clearInterval("nodesStatsInterval");
        this.clearInterval("healthInterval");
        this.clearTimeout("clusterStateInterval");
        this.clearTimeout("indicesStatusInterval");

        this.startInterval("nodesStateInterval",   nodesStateRefreshFunction,    refreshInterval);
        this.startInterval("nodesStatsInterval",   nodesStatsRefreshFunction,    refreshInterval);
        this.startInterval("healthInterval",       healthRefreshFunction,        refreshInterval);
        this.startTimeout("clusterStateInterval",  clusterStateRefreshFunction,  refreshInterval);
        this.startTimeout("indicesStatusInterval", indicesStatusRefreshFunction, refreshInterval);
    },

    // set storeSize value of the cluster
    setStoreSize: function(storeSize) {
        var _cluster = this;
        _cluster.set({storeSize: storeSize});
    },

    // return master node id if available, otherwise return empty string
    getMasterNodeId: function() {
        var _cluster = this;
        return  _cluster.get("nodesState").getMasterNodeId();
    }
});

var ClusterCollection = Backbone.Collection.extend({
    model: Cluster
});

var BigdeskStore = Backbone.Model.extend({

    defaults: {
        cluster: new ClusterCollection()
    },

    // Returns an instance of a Cluster model with given name (id)
    // or <code>undefined</code> if no instance if found.
    getCluster: function(clusterName) {
        return this.get("cluster").get(clusterName);
    },

    // Add a new cluster into store. Parameter is an instance of a Cluster model.
    // Throws error if there already is a cluster with the same id.
    addCluster: function(clusterModel) {
        var _c = this.get("cluster");
        if (_c.get(clusterModel.get("id")) == undefined) {
            _c.add(clusterModel)
        } else {
            throw "Cluster already exists.";
        }
    }
});
