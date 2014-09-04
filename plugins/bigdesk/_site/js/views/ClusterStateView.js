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

var ClusterStateView = Backbone.View.extend({

    initialize: function() {

        var _view = this;
        _view.clear();

        var indicesStatus = _view.model.get("indicesStatus");
        var clusterState = _view.model.get("clusterState");

        if (indicesStatus && clusterState) {
            // both are present, we can register handler
            _view.registerChangeCheckHandler();
        } else {
            // else make sure to fire handler as soon as both are available
            _view.model.on("change:indicesStatus", function(model) {
                if (_view.model.get("clusterState")) {
                    _view.registerChangeCheckHandler();
                }
            });
            _view.model.on("change:clusterState", function(model) {;
                if (_view.model.get("indicesStatus")) {
                    _view.registerChangeCheckHandler();
                }
            });
        }
    },

    registerChangeCheckHandler: function() {
        var _view = this;
        _view.render();
        _view.model.get("dispatcher").on("newClusterState", _view.redrawIfChanged, _view);
        _view.model.get("dispatcher").on("newIndicesStatus", _view.redrawIfChanged, _view);
    },

    redrawIfChanged: function() {
        var _view = this;
        // TODO redraw only if change...
        _view.render();
    },

    render: function() {
        var _view = this;
        _view.emptyElement();

        var indicesStatus = _view.model.get("indicesStatus");
        var theLatestIndicesStatus = (indicesStatus ? indicesStatus.at(indicesStatus.length-1) : undefined);
        var clusterState = _view.model.get("clusterState");

        if (clusterState && clusterState.length > 0) {

            var theLatest = clusterState.at(clusterState.length-1);
//            console.log(theLatest.toJSON());
            if (theLatest) {

                var packData = {
                    name: theLatest.get("cluster_name"),
                    children: []
                };

                var nodes = theLatest.get("nodes");

                for (var nodeId in theLatest.get("routing_nodes").nodes) {

                    var node = {
                        name: nodes[nodeId].name,
                        children: [],
                        master: (nodeId == theLatest.get("master_node") ? true : false)
                    };

                    for (var shardCnt in theLatest.get("routing_nodes").nodes[nodeId]) {

                        var shard = theLatest.get("routing_nodes").nodes[nodeId][shardCnt];

                        node.children.push({

                            name: shard.index,
                            size: _view.getIndexShardSize(theLatestIndicesStatus, shard.index, shard.shard, nodeId),

                            // optional
                            primary: shard.primary,
                            relocating_node: shard.relocating_node,
                            shard: shard.shard,
                            state: shard.state

                        });
                    };

                    packData.children.push(node);
                }

//                console.log("pack", packData);

                var width = 600,
                    height = 600,
                    format = d3.format(",d"),
                    span = 5;

                var pack = d3.layout.pack()
                     .size([width - (span*2), height - (span*2)])
                     .value(function(d) { return d.size; });

                var vis = d3.select("#clusterChart").append("svg")
                     .attr("width", width)
                     .attr("height", height)
                     .attr("class", "pack")
                   .append("g")
                     .attr("transform", "translate("+span+", "+span+")");

                var node = vis.data([packData]).selectAll("g.node")
                       .data(pack.nodes)
                     .enter().append("g")
                       .attr("class", function(d){
                            if (d.children) {
                                if (d.master) {
                                    return "master node";
                                } else {
                                    return "node";
                                }
                            } else {
                                if (d.primary) {
                                    return "primary leaf node";
                                } else {
                                    return "leaf node";
                                }
                            }
                       })
                       .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

                node.append("title")
                   .text(function(d) { return d.name + (d.children ? "" : ": " + format(d.size)); });

                node.append("circle")
                   .attr("r", function(d) { return d.r; });

                node.filter(function(d) { return d.children && d != undefined}).append("text")
                    .attr("text-anchor", "middle")
                    .attr("dy", function(d){ return -d.r+3; })
                    .text(function(d) { return d.name; });

                node.filter(function(d) { return !d.children; }).append("text")
                   .attr("text-anchor", "middle")
                   .attr("dy", ".3em")
                   .text(function(d) { return (d.name+" ["+ d.shard+"]").substring(0, d.r / 3); });

            }
        }

    },

    // try to extract shard size in bytes, otherwise returns 1
    getIndexShardSize: function(theLatestIndicesStatus, indexName, shard, nodeId) {
        if (theLatestIndicesStatus) {
            var indices = theLatestIndicesStatus.get("indices");
            var _shards = indices[indexName].shards[shard];
            for (var _shard in _shards) {
                if (_shards[_shard].routing.node == nodeId) {
                    return _shards[_shard].index.size_in_bytes;
                }
            }
        }
        return 1;
    },

    emptyElement: function() {
        var _view = this;
        _view.$el.empty();
    },

    clear: function() {
        var _view = this;
        // TODO off all events from initialize()
        _view.model.get("dispatcher").off("newClusterState", _view.redrawIfChanged);
        _view.model.get("dispatcher").off("newIndicesStatus", _view.redrawIfChanged);
        _view.emptyElement();
    }
});
