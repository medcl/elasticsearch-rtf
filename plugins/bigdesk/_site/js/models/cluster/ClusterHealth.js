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
 * REST end point: _cluster/health
 * @see <a href="http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster-health.html">cluster health</a>
 */

var ClusterHealth = Backbone.Model.extend({

    url: function() { return '/_cluster/health'; },

    parse: function(data) {
        // we do not need all data for now
        // let's get just the basic info and nodes level data
        var model = {};
        model.cluster_name = data.cluster_name;
        model.status = data.status;
        model.timed_out = data.timed_out;
        model.number_of_nodes = data.number_of_nodes;
        model.number_of_data_nodes = data.number_of_data_nodes;
        return model;
    }
});

