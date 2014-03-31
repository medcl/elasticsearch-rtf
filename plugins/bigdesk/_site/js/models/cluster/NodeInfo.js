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
 * REST end point: _nodes/{nodeId}?human=true
 * @see <a href="http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/cluster.html">cluster nodes</a>
 */

var NodeInfo = Backbone.Model.extend({

    url: function() {
        return '/_nodes/' + this.get("nodeId") + '?human=true';
    },

    validate: function(attrs) {
        if (!attrs.nodeId) {
//            return "nodeId must be set"; // not working correctly, see fetch()
        }
    },

    parse: function(data) {
        var nodeId = this.get("nodeId");
        if (data.nodes && data.nodes[nodeId]) {
            var _data = data.nodes[nodeId];
            _data.id = nodeId;
//            console.log(_data);
            return _data;
        }
    },

    fetch: function(options){
        if (options.nodeId) {
            this.set({nodeId: options.nodeId});
        } else {
            // this should be handled in initialize() but that breaks URI, not sure why...???
            throw "nodeId must be set";
        }
        return Backbone.Model.prototype.fetch.call(this, options);
    }

});


