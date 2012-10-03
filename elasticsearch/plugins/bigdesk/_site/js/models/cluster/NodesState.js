// just nodes from _cluster/state

var NodeState = Backbone.Model.extend({
    defaults: {
        master: false
    }
});

var NodesState = Backbone.Collection.extend({

    model: NodeState,

    url: function() {
        var flags = ["filter_routing_table", "filter_metadata", "filter_blocks"];
        var query = flags.join("=true&")+"=true";
        return '/_cluster/state?'+query;
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
