// _cluster/nodes/{nodeId}

var NodeInfo = Backbone.Model.extend({

    url: function() {
        return '/_cluster/nodes/' + this.get("nodeId") + '?all=true';
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


