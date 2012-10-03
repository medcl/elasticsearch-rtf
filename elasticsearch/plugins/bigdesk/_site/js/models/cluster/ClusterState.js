// full _cluster/state response, http://www.elasticsearch.org/guide/reference/api/admin-cluster-state.html

var ClusterStateTimestamp = Backbone.Model;

var ClusterState = Backbone.Collection.extend({

    model: ClusterStateTimestamp,

    url: function() {
        return '/_cluster/state';
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

