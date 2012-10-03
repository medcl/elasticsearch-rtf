// _cluster/health

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

