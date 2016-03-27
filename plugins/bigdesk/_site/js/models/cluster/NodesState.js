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

/**
 * REST end point: _cluster/state/nodes,master_node
 * @see <a href="http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster-state.html">cluster state</a>
 */

var NodeState = Backbone.Model.extend({
    defaults: {
        master: false
    }
});

var NodesState = Backbone.Collection.extend({

    model: NodeState,

    url: function() {
        return '/_cluster/state/nodes,master_node';
    },

    // Move important keys into values.
    parse: function(data) {
        var nodes = data.nodes;
        var masterId = data.master_node;
        nodes[masterId].master = true;
        var nodeIds = _.keys(nodes);
        var nodeValues = _.values(nodes);
        for (var i = 0; i < nodeIds.length; i++) {
            nodeValues[i].id = nodeIds[i];
        }
        return nodeValues;
    },

    // Keep nodes collection up to date.
    add: function(models, options) {
        var collection = this;
        delete options.silent;

        // add new nodes
        _.each(models, function(model){
            if (collection.get(model.id) == undefined) {
                Backbone.Collection.prototype.add.call(collection, model, options);
            } else {
                collection.get(model.id).set(model);
            }
        });

        // remove gone nodes
        var iterator = function(nodeState) {
            return (_.find(models, function(m){ return m.id == nodeState.id; }));
        };

        var rejected = collection.reject(iterator);
        collection.remove(rejected, options);
    },

    // return master node id if available, otherwise return empty string
    getMasterNodeId: function() {
        var masterNodeId = "";
        var collection = this;
        var masterNode = collection.find(function(node){
            return node.get("master");
        });
        if (masterNode) {
            masterNodeId = masterNode.id;
        }
        return masterNodeId;
    }
});
