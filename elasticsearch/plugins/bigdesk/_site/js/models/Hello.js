// the only REST API that gives ES node version

var Hello = Backbone.Model.extend({
    url: function() { return '/'; }
});
