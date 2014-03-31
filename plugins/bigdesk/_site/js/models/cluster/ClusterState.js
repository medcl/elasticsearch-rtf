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
 * REST end point: _cluster/state/nodes,routing_table?human=true
 * @see <a href="http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster-state.html">cluster state</a>
 */

var ClusterStateTimestamp = Backbone.Model;

var ClusterState = Backbone.Collection.extend({

    model: ClusterStateTimestamp,

    url: function() {
        return '/_cluster/state/nodes,routing_table?human=true';
    },

    parse: function(data) {
        // add key
        data.id = new Date().getTime();
        return data;
    },

    add: function(models, options) {
        delete options.silent;
        if (options && options.now && options.storeSize) {
            var iterator = function(clusterStateTimestamp) {
                return !(clusterStateTimestamp.id < (options.now - options.storeSize));
            };

            var rejected = this.reject(iterator);
            if (rejected.length > 0) {
                this.remove(rejected, options);
            }
        }
        var parentCall = Backbone.Collection.prototype.add.call(this, models, options);

        // custom trigger: collection has been updated
        this.trigger("clusterStateUpdated", {});

        return parentCall;
    },

    // make sure models are ordered by time
    comparator: function(model) {
        return model.id;
    }
});

