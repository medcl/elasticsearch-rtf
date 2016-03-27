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

var ClusterHealthView = Backbone.View.extend({

    initialize: function() {

        var _view = this;
        _view.clear();

        var health = _view.model.get("health");
        if (health) {
            // First, try to bind to event if health model is already there...
            _view.registerHealthChangeHandler(health, _view);
        } else {
            // ... if the model is not available yet (because it is loaded via AJAX) then
            // wait for it to be loaded to bind to its events.
            this.model.on("change:health",
                function(model){
                    var health = model.get("health");
                    _view.registerHealthChangeHandler(health, _view);
                });
        }
    },

    registerHealthChangeHandler: function(health, _view) {
        health.on("change:status", function(){
            _view.render();
        });

        health.on("change:number_of_nodes", function(){
            _view.render();
        });
    },

    render: function() {
        var health = this.model.get("health");
        if (health) {
            $(this.el).html(
                "Cluster: " + health.get("cluster_name") +
                "<br>Number of nodes: " + health.get("number_of_nodes") +
                "<br>Status: <span class='clusterStatus " + health.get("status") + "'>" + health.get("status") +"</span>");
        }
        return this;
    },

    clear: function() {
        // TODO off all events from initialize()
        $(this.el).html("No cluster connected.");
    }
});
