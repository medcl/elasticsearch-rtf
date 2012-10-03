// full _all/_status response, http://www.elasticsearch.org/guide/reference/api/admin-indices-status.html

var IndicesStatusTimestamp = Backbone.Model;

var IndicesStatus = Backbone.Collection.extend({

    model: IndicesStatusTimestamp,

    url: function() {
        // TODO 'recovery' and 'snapshot' status
        return '/_all/_status';
    },

    parse: function(data) {
        // add key
        data.id = new Date().getTime();
        return data;
    },

    add: function(models, options) {
        delete options.silent;
        if (options && options.now && options.storeSize) {
            var iterator = function(indicesStatusTimestamp) {
                return !(indicesStatusTimestamp.id < (options.now - options.storeSize));
            };

            var rejected = this.reject(iterator);
            if (rejected.length > 0) {
                this.remove(rejected, options);
            }
        }
        var parentCall = Backbone.Collection.prototype.add.call(this, models, options);

        // custom trigger: collection has been updated
        this.trigger("indicesStatusUpdated", {});

        return parentCall;
    },

    // make sure models are ordered by time
    comparator: function(model) {
        return model.id;
    }

});