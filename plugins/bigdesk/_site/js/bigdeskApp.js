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

// bigdesk store keeps track of state of clusters
var bigdeskStore = new BigdeskStore();

// declare views
var nodesView = {

    clusterHealthView: undefined,
    clusterNodesListView: undefined,

    render: function(cluster) {

        var nodesViewTemplate = Mustache.render(templates.nodesViewTemplate, {});
        $("#selectedViewDetail").empty().append(nodesViewTemplate);

        this.clusterHealthView = new ClusterHealthView({el: $("#clusterHealth"), model: cluster});
        this.clusterHealthView.render();

        this.clusterNodesListView = new ClusterNodesListView({el: $("#clusterNodes"), model: cluster});
        this.clusterNodesListView.render();
    },

    showNodeDetail: function(cluster, nodeId) {
        if (this.clusterNodesListView == undefined) {
            this.clusterNodesListView = new ClusterNodesListView({el: $("#clusterNodes"), model: cluster});
            this.clusterNodesListView.render();
        }
        this.clusterNodesListView.showNodeDetail(nodeId);
    },

    clear: function() {
        if (this.clusterHealthView != undefined) {
            this.clusterHealthView.clear();
        }
        if (this.clusterNodesListView != undefined) {
            this.clusterNodesListView.clear();
            this.clusterNodesListView.undelegateEvents();
        }
    }
};

var clusterView = {

    clusterHealthView: undefined,
    clusterStateView: undefined,

    render: function(cluster) {

        var clusterViewTemplate = Mustache.render(templates.clusterViewTemplate, {});
        $("#selectedViewDetail").empty().append(clusterViewTemplate);

        this.clusterHealthView = new ClusterHealthView({el: $("#clusterHealth"), model: cluster});
        this.clusterHealthView.render();

        this.clusterStateView = new ClusterStateView({el: $("#clusterChart"), model: cluster});
//        this.clusterStateView.render();
    },

    clear: function() {
        if (this.clusterHealthView != undefined) {
            this.clusterHealthView.clear();
        }
        if (this.clusterStateView != undefined) {
            this.clusterStateView.clear();
        }
    }
};

var selectedView = undefined;

var selectedClusterName = undefined;

var connectTo = function(url, refreshInterval, storeSize, dispatcher, selectedView, callback) {

    var connectionConfig = { baseUrl: url };
    var clusterHealth = new ClusterHealth({},connectionConfig);

    clusterHealth.fetch({

        success: function(model, response) {

            var clusterName = model.get("cluster_name");
            var cluster = bigdeskStore.getCluster(clusterName);

            selectedClusterName = clusterName;

            if (cluster == undefined) {

                console.log("Found a new cluster [" + clusterName + "]");

                bigdeskStore.addCluster(

                    // Keep in mind 'new Cluster()' is a heavy operation
                    // because it performs several AJAX calls.
                    new Cluster({
                        id: clusterName,
                        baseUrl: connectionConfig.baseUrl,
                        storeSize: storeSize,
                        refreshInterval: refreshInterval,
                        dispatcher: dispatcher
                    })
                );

                // get cluster reference so that it can be used in view later...
                cluster = bigdeskStore.getCluster(clusterName);
                selectedView.render(cluster);

            } else {

                console.log("Cluster [" + clusterName + "] found in store");

                cluster.setStoreSize(storeSize);

                // init view first, then fetch the update!
                selectedView.render(cluster);
                cluster.startFetch(refreshInterval, connectionConfig.baseUrl);
            }
            if (callback) {
                callback();
            }
        },

        error: function(model, response) { /* can not handle in JSONP */ }

    });
};

var disconnectFrom = function(url, callback) {

    var disconnectFromCluster = function(cluster) {
        cluster.clearIntervals();
        cluster.clearTimeouts();
        selectedView.clear();
    };

    // Iterate through all clusters having baseUrl == url and disconnect from them.
    var disconnectFromURL = function(url) {
        _.each(bigdeskStore.get("cluster")
            .filter(function(cluster){
                return cluster.get("health").get("baseUrl") == url;
            }),
            function(cluster){
                console.log("Disconnecting from ["+cluster.id+"]");
                disconnectFromCluster(cluster);
            });
        if (callback) {
            callback();
        }
    };

    disconnectFromURL(url);
};

var changeRefreshInterval = function(url, newRefreshInterval) {

    var connectionConfig = { baseUrl: url };
    var clusterHealth = new ClusterHealth({},connectionConfig);

    // we need to do the health.fetch to get cluster name.
    clusterHealth.fetch({

        success: function(model, response) {
            var clusterName = model.get("cluster_name");
            var cluster = bigdeskStore.getCluster(clusterName);
            if (cluster) {
                // we do not want to change URL just refresh interval
                cluster.startFetch(newRefreshInterval/*, connectionConfig.baseUrl*/);
            }
        },

        error: function(model, response) { /* can not handle in JSONP */ }

    });
};

var changeStoreSize = function(url, newStoreSize) {

    var connectionConfig = { baseUrl: url };
    var clusterHealth = new ClusterHealth({},connectionConfig);

    // we need to do the health.fetch to get cluster name.
    clusterHealth.fetch({

        success: function(model, response) {
            var clusterName = model.get("cluster_name");
            var cluster = bigdeskStore.getCluster(clusterName);
            if (cluster) {
                cluster.setStoreSize(newStoreSize);
            }
        },

        error: function(model, response) { /* can not handle in JSONP */ }

    });
};

$(document).ready(
    function($) {

        var restEndPoint = $("#restEndPoint"),
            refreshInterval = $("#refreshInterval"),
            storeSize = $("#storeSize"),
            button = $("#connectButton"),
            ajaxIndicator = $("#ajaxIndicator");

        var isConnected = function() {
            return (button.val() !== "Connect");
        };

        var getRefreshInterval = function() {
            return refreshInterval.find(":selected").val();
        };

        var getStoreSize = function() {
            return storeSize.find(":selected").val();
        };

        var switchButtonText = function() {
            if (isConnected()) {
                button.val("Connect");
                restEndPoint.removeAttr('disabled');
            } else {
                button.val("Disconnect");
                restEndPoint.attr('disabled','disabled');
            }
        };

        refreshInterval.change(function(){
            if (isConnected()) {
                changeRefreshInterval(restEndPoint.val(), getRefreshInterval());
            }
        });

        storeSize.change(function(){
           if (isConnected()) {
               changeStoreSize(restEndPoint.val(), getStoreSize());
           }
        });

        var ajaxResponseCallback = function(clusterName, restApiName, response) {
//            console.log("["+clusterName+"] ["+restApiName+"]", response);
//            var iterator = function(nodeStats) {return nodeStats.id; };
//            if (restApiName == "cluster > NodesStats") {
//                console.log(response);
//                var nodesCollection = this.get("nodesStats");
//                console.log("collection length",nodesCollection.length);
//                console.log("collection max",nodesCollection.max(iterator).id);
//                console.log("collection min",nodesCollection.min(iterator).id);
//            }
            ajaxIndicator.show().css("background-color", "lightgreen").fadeOut("slow");
        };

        var newDataCallback = function(description, data) {
//            console.log(description, data);
        };

        var bigdeskEventDispatcher = _.clone(Backbone.Events);
        bigdeskEventDispatcher.on("onAjaxResponse", ajaxResponseCallback);
        bigdeskEventDispatcher.on("onNewData", newDataCallback);

        button.click(function(){
            if (isConnected()) {
                disconnectFrom(restEndPoint.val(), switchButtonText);
            } else {
                connectTo(restEndPoint.val(), getRefreshInterval(), getStoreSize(), bigdeskEventDispatcher, selectedView, switchButtonText);
            }
        });

        restEndPoint.bind("keypress",function(event){
            if (typeof event == 'undefined' && window.event) { event = window.event; }
            if(event.keyCode == 13){
                if (event.cancelable && event.preventDefault) {
                    event.preventDefault();
                    button.click();
                } else {
                    button.click();
                }
				return false;
            }
			return true;
        });

        var getSearchUrlVar = function(key) {
            var result = new RegExp(key + "=([^&]*)", "i").exec(window.location.search);
            return decodeURIComponent(result && result[1] || "");
        };

        var parseUrlParams = function() {
            return {
                endpoint: getSearchUrlVar("endpoint") || "http://localhost:9200",
                refresh: getSearchUrlVar("refresh") || 2000,
                history: getSearchUrlVar("history") || 300000,
                connect: getSearchUrlVar("connect") || false
            }
        };

        // If any URL params are found (i.e. they are provided by the user)
        // then they are applied/set into appropriate form fields.
        var applyUrlParams = function() {

            var params = parseUrlParams();

            // assume this is a plugin running in ES node
            if (window.location.href.indexOf("/_plugin/") != -1) {
                // if "endpoint" or "connect" values provided as an URL parameter, do not change them
                if (!getSearchUrlVar("endpoint")) {
                    params.endpoint = window.location.protocol + "//" + window.location.host;
                }
                if (!getSearchUrlVar("connect")) {
                    params.connect = true;
                }
            }

            restEndPoint.val(params.endpoint);
            refreshInterval.val(params.refresh);
            storeSize.val(params.history);
            return params;
        };

        var applyUrlParamsCalled = false;

        var BigdeskRouter = Backbone.Router.extend({

            routes: {
                "nodes" : "nodes",
                "nodes/master" : "nodes_master",
                "nodes/:nodeId" : "nodes",
                "cluster" : "cluster",
                "*other" : "defaultRoute"
            },

            cluster: function() {
//                console.log("change route: cluster");
                if (selectedView && _.isFunction(selectedView.clear)) {
                    selectedView.clear();
                }
                selectedView = clusterView;
                if (!isConnected() && !applyUrlParamsCalled) {
                    var params = applyUrlParams();
                    applyUrlParamsCalled = true;
                    if (params.connect == true || params.connect == "true") {
                        button.click();
                    }
                } else {
                    selectedView.render(
                        bigdeskStore.getCluster(selectedClusterName)
                    )
                }
            },

            nodes_master: function() {
//                console.log("try to connect to the master node");
                var masterNodeId = "";
                if (!isConnected() && !applyUrlParamsCalled) {
                    // we are not connected and master node id is not known yet
                } else {
                    masterNodeId = "/" + bigdeskStore.getCluster(selectedClusterName).getMasterNodeId();
                }

                this.navigate("nodes" + masterNodeId, {trigger: true, replace: true});
            },

            nodes: function(nodeId) {
//                console.log("change route: nodes("+(nodeId||"")+")");
                if (selectedView && _.isFunction(selectedView.clear)) {
                    selectedView.clear();
                }
                selectedView = nodesView;
                if (!isConnected() && !applyUrlParamsCalled) {
                    if (nodeId) {
                        // If not connected yet but nodeId is provided, then redirect to "nodes" route
                        // i.e. remove the nodeId form the URL fragment.
                        this.navigate("nodes", {trigger: true, replace: true});
                        return;
                    }
                    var params = applyUrlParams();
                    applyUrlParamsCalled = true;
                    if (params.connect == true || params.connect == "true") {
                        button.click();
                    }
                } else {
                    selectedView.render(
                        bigdeskStore.getCluster(selectedClusterName)
                    );
                    if (nodeId) {
                        selectedView.showNodeDetail(bigdeskStore.getCluster(selectedClusterName), nodeId);
                    }
                }
            },

            defaultRoute: function(other) {
                this.navigate("nodes", {trigger: true, replace: true});
            }

        });

        new BigdeskRouter();

        Backbone.history.start();

    }
);
