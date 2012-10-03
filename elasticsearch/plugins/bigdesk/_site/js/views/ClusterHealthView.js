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
                "<br>Status: <span style='background-color: "+health.get("status")+"'>" + health.get("status") +"</span>");
        }
        return this;
    },

    clear: function() {
        // TODO off all events from initialize()
        $(this.el).html("No cluster connected.");
    }
});
