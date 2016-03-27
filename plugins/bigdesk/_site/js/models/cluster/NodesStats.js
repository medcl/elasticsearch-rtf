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
 * REST end point: _nodes/stats?human=true
 * @see <a href="http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster-nodes-stats.html">nodes statistics<a/>
 */

var NodeStats = Backbone.Model;

var NodeStatsCollection = Backbone.Collection.extend({
    model: NodeStats
});

var NodeStatsTimestamp = Backbone.Model.extend({
    initialize: function(attributes){
        var nodes = attributes.nodes;
        var nodeIds = _.keys(nodes);
        var nodeValues = _.values(nodes);
        for (var i = 0; i < nodeIds.length; i++) {
            nodeValues[i].id = nodeIds[i];
        }
        this.set({nodes: new NodeStatsCollection(nodeValues)});
        this.set("id", new Date().getTime());
    }
});

var NodesStats = Backbone.Collection.extend({
    model: NodeStatsTimestamp,
    url: function() {
        return '/_nodes/stats?human=true';
    },
    parse: function(response) {
        delete response.cluster_name;
        return response;
    },

    // Here comes the backbone hack:
    //
    // Cluster health status is fetched using {add:true} option, which means that it will always
    // add incoming data, but we also need to remove data that are older then storeSize threshold.
    //
    // So we call fetch with {silent:true}, then we override add method in which we remove {silent}
    // from the options and "delegate to parent" to trigger the 'add' event. When we remove old data,
    // we call remove method which triggers 'remove' event.
    // As a result we can subscribe to NodesStats collection on 'add' and 'remove' events which will be
    // fired correctly only for those items that are added or removed.
    //
    // Also note that when we call the fetch we inject some additional metadata into options: now, storeSize.
    // Probably that is the way how to go about this in backbone.
    //
    // Theoretically we would not need to use {silent:true} and omit "delegation to parent". But this
    // way we have finer control over the flow and we can theoretically decide not to add incoming data
    // in the future which will allow us to control triggering 'add' event correctly.
    //
    add: function(models, options) {
        delete options.silent;
        if (options && options.now && options.storeSize) {
            var iterator = function(nodeStatsTimestamp) {
                return !(nodeStatsTimestamp.id < (options.now - options.storeSize));
            };

            var rejected = this.reject(iterator);
            if (rejected.length > 0) {
                this.remove(rejected, options);
            }
        }
        var parentCall = Backbone.Collection.prototype.add.call(this, models, options);

        // custom trigger: collection has been updated
        this.trigger("nodesStatsUpdated", {});

        return parentCall;
    },

    // make sure models are ordered by time (in case AJAX responses are returned in wrong order)
    comparator: function(model) {
        return model.id;
    }
});


