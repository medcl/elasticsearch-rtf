function l(m) { Ember.Logger.log(m); }

var App = Em.Application.create({
  name: "Paramedic",

  ready: function() {
    l(App.name + ' (re)loaded.')
    App.__initialize_page()
    App.__perform_refresh()
    App.__initialize_cubism()
    return this._super()
  },

  elasticsearch_url: function() {
    var href = window.location.href.toString()
    
    return /_plugin/.test(href) ? href.substring(0, href.indexOf('/_plugin/')) : "http://localhost:9200"
  }(),

  refresh_intervals : Ember.ArrayController.create({
    content: [
      {label: '1 sec',  value: 1000},
      {label: '5 sec',  value: 5000},
      {label: '15 sec', value: 15*1000},
      {label: '1 min',  value: 60*1000},
      {label: '5 min',  value: 5*60*1000},
      {label: '15 min', value: 15*60*1000}
    ]
  }),

  refresh_allowed: true,
  sounds_enabled:  false,

  __perform_refresh: function() {
    App.cluster.__perform_refresh()
    App.nodes.__perform_refresh()
    App.indices.__perform_refresh()
  },

  __initialize_cubism: function() {
    App.Cubism.setup()
  },

  __initialize_page: function() {
    $("link[rel=apple-touch-icon]").attr("href", App.apple_touch_icon_b64)
  }
});

App.refresh_interval = App.refresh_intervals.toArray()[1]

// ===== Models ===================================================================================

App.Cluster = Ember.Object.extend({
});

App.Node = Ember.Object.extend({
});

App.Index = Ember.Object.extend({
  url: function() {
    return App.elasticsearch_url + '/' + this.name + '/_search?pretty'
  }.property("name").cacheable(),

  closed: function() {
    return (this.state && this.state == 'close')
  }.property("state").cacheable()
});

App.Index.Shard = Ember.Object.extend({
});

// ===== Controllers ==============================================================================

App.cluster = Ember.Object.create({
  content: App.Cluster.create({}),

  refresh: function() {
    clearTimeout(App.cluster.poller)
    setTimeout(function() { App.set("refreshing", false) }, 1000)
    App.cluster.poller = setTimeout( function() { App.cluster.__perform_refresh() }, App.refresh_interval.value )
  },

  __perform_refresh: function() {
    if (!App.refresh_allowed) { return }
    var self = this;

    var __load_cluster_info = function(data) {
      App.cluster.setProperties(data)
      App.cluster.refresh();
    }

    App.set("refreshing", true)
    $.getJSON(App.elasticsearch_url+"/_cluster/health", __load_cluster_info);
  }
});

App.nodes = Ember.ArrayController.create({
  hidden: false,
  content: [],

  contains: function(item) {
    return (Ember.typeOf(item) == 'string') ? this.mapProperty('id').contains(item) : this._super();
  },

  refresh: function() {
    if (App.nodes.hidden) { return }

    clearTimeout(App.nodes.poller)
    setTimeout(function() { App.set("refreshing", false) }, 1000)
    App.nodes.poller = setTimeout( function() { App.nodes.__perform_refresh() }, App.refresh_interval.value )
  },

  __perform_refresh: function() {
    if (!App.refresh_allowed) { return }
    var self = this;

    var __load_nodes_info = function(data) {
      for (var node_id in data.nodes) {
        if ( !self.contains(node_id) ) self.addObject(App.Node.create({ id: node_id }))
        var node = self.findProperty("id", node_id)
                    .set("name",         data.nodes[node_id]['name'])
                    .set("hostname",     data.nodes[node_id]['hostname'])
                    .set("http_address", data.nodes[node_id]['http_address'])
                    .set("jvm_heap_max", data.nodes[node_id]['jvm']['mem']['heap_max'])
                    .set("start_time",   data.nodes[node_id]['jvm']['start_time'])
      }

      // Remove missing nodes from the collection
      // TODO: Use model instance identity, contains(), etc
      //
      self.forEach(function(item) {
        var loc = self.content.length || 0
        while(--loc >= 0) {
          var curObject = self.content.objectAt(loc)
          if ( item && !Ember.keys(data.nodes).contains(item.id) && curObject.id === item.id) {
            self.content.removeAt(loc)
          }
        }
      })

      App.nodes.refresh();
    };

    var __load_nodes_stats = function(data) {
      for (var node_id in data.nodes) {
        var node = self.findProperty("id", node_id)
        if (node) {
          node
            .set("disk", data.nodes[node_id]['indices']['store']['size'])
            .set("docs", data.nodes[node_id]['indices']['docs']['count'])
            .set("load", data.nodes[node_id]['os']['load_average'][0].toFixed(3))
            .set("cpu",  data.nodes[node_id]['process']['cpu']['percent'])
            .set("jvm_heap_used", data.nodes[node_id]['jvm']['mem']['heap_used'])
        }
      }
    };

    App.set("refreshing", true)
    $.getJSON(App.elasticsearch_url+"/_nodes?jvm", __load_nodes_info);
    $.getJSON(App.elasticsearch_url+"/_nodes/stats?indices&os&process&jvm", __load_nodes_stats);
  }
});

App.indices = Ember.ArrayController.create({
  hidden: false,
  content: [],

  contains: function(item) {
    return (Ember.typeOf(item) == 'string') ? this.mapProperty('name').contains(item) : this._super();
  },

  refresh: function() {
    if (App.indices.hidden) { return }

    clearTimeout(App.indices.poller)
    setTimeout(function() { App.set("refreshing", false) }, 1000)
    App.indices.poller = setTimeout( function() { App.indices.__perform_refresh() }, App.refresh_interval.value )
  },

  sorted: function() {
    return this.get("content")
             .toArray()
             .sort(function(a,b) { if (a.name < b.name) return -1; if (a.name > b.name) return 1; return 0; })
  }.property("content.@each").cacheable(),

  showDetail: function(event) {
    // l(event.context.name)
    // l(this)
    event.context.toggleProperty("show_detail")
  },

  __perform_refresh: function() {
    if (!App.refresh_allowed) { return }
    var self = this;

    var __load_cluster_state = function(data) {
      for (var index_name in data.metadata.indices) {
        // Mark master node
        //
        var master_node  = App.nodes.content.findProperty("id", data.master_node)
        if (master_node) master_node.set("master", true)

        // Create or find an index
        //
        if ( !self.contains(index_name) ) self.addObject(App.Index.create({ name: index_name }))
        var index = self.findProperty("name", index_name)

        // Update index properties
        //
        index
          .set("state", data.metadata.indices[index_name]['state'])

          .set("settings", Ember.Object.create({
            number_of_replicas: data.metadata.indices[index_name]['settings']['index.number_of_replicas'],
            number_of_shards:   data.metadata.indices[index_name]['settings']['index.number_of_shards']
          }))

          .set("aliases", data.metadata.indices[index_name]['aliases'])

        // Shards
        //
        var shards     = [],
                  primaries  = [],
                  replicas   = [],
                  unassigned = []

        index
          .set("shards", function() {
            if (data.routing_table.indices[index_name]) {

              for (var shard_name in data.routing_table.indices[index_name]['shards']) {

                data.routing_table.indices[index_name]['shards'][shard_name].forEach(function(s) {

                  var shard = App.Index.Shard.create({name: shard_name})
                  shard.set("state",   s.state)
                       .set("primary", s.primary)
                       .set("index",   s.index)
                       .set("node_id", s.node)
                       .set("relocating_node_id", s.relocating_node)

                  if (s.primary)             primaries .addObject(shard)
                  if (!s.primary && s.node)  replicas  .addObject(shard)
                  if (!s.primary && !s.node) unassigned.addObject(shard)
                });

              }
            }

            // Sort unassingned shards to series [0 .. n, 0 .. n]
            // [0, 0, 1, 1, 2, 2] becomes: [0, 1, 2, 0, 1, 2]
            //
            var unassigned_sorted = []
            unassigned_sorted.length = unassigned.length

            var num_shards   = primaries.length,
                num_replicas = unassigned.length/num_shards;

            for (var i = 0; i < num_shards; i++) {
              // Create slices: [0, 0]; [1, 1]; [2, 2]
              unassigned.slice(i*num_replicas, i*num_replicas+num_replicas).forEach(function(item,index) {
                // Position for first slices:  0, 3
                // Position for second slices: 1, 4
                // Position for third slices:  2, 5
                var position = i + num_shards * index
                unassigned_sorted[position] = item
              })
            };

            unassigned_sorted = unassigned_sorted.filter(function(i){return i != null})
            return shards.concat(primaries, replicas, unassigned_sorted)
          }())

          if (index.show_detail) {
            index.set("nodes", function() {
              var nodes = []
              if (data.routing_table.indices[index_name]) {
                for (var shard_name in data.routing_table.indices[index_name]['shards']) {

                  data.routing_table.indices[index_name]['shards'][shard_name].forEach(function(shard_data) {
                    if (shard_data.node) {

                      // Find the node
                      // var node = App.nodes.content.findProperty("id", shard_data.node)
                      var node = nodes.findProperty("id", shard_data.node)
                      if (!node) {
                        var node = App.Node.create( App.nodes.content.findProperty("id", shard_data.node) )
                        nodes.addObject(node)
                      }

                      // Initialize node.shards
                      if (node && !node.shards) node.set("shards", [])

                      // Find shard in index.shards
                      var shard = index.shards.find(function(item) {
                                    return item.name == shard_data.shard && item.node_id == shard_data.node && item.index == shard_data.index
                                  })

                      // Remove shard from node.shards
                      node.shards.forEach(function(item, index) {
                        if (item.name == shard_data.shard && item.node_id == shard_data.node && item.index == shard_data.index) {
                            node.shards.removeAt(index)
                        }
                      })

                      // Add (possibly updated) shard back into collection
                      if (shard) { node.shards.addObject(shard) }

                      node.set("shards", node.shards.sort(function(a,b) { return a.name > b.name; }))
                    }
                  });
                };
              }
              index.set("show_detail_loaded", true)
              return nodes
            }())
          }

        // Remove deleted indices from the collection
        // TODO: Use model instance identity for this
        //
        self.forEach(function(item) {
          // console.log(item.name)
          var loc = self.content.length || 0
          while(--loc >= 0) {
            var curObject = self.content.objectAt(loc)
            if ( item && !Ember.keys(data.metadata.indices).contains(item.name) && curObject.name === item.name) {
              self.content.removeAt(loc)
            }
          }
        })

      }
    };

    var __load_indices_stats = function(data) {
      App.cluster.set("docs_count",
                      data._all.primaries.docs ? data._all.primaries.docs.count : 0)

      var indices = data._all.indices || data.indices

      for (var index_name in indices) {
        var index = self.findProperty("name", index_name)
        if (!index) continue

        index
          .set("size", indices[index_name]['primaries']['store']['size'])
          .set("size_in_bytes", indices[index_name]['primaries']['store']['size_in_bytes'])
          .set("docs", indices[index_name]['primaries']['docs']['count'])
          .set("indexing", indices[index_name]['primaries']['indexing'])
          .set("search", indices[index_name]['primaries']['search'])
          .set("get", indices[index_name]['primaries']['get'])
      }
    };

    var __load_indices_status = function(data) {
      for (var index_name in data.indices) {
        var index = self.findProperty("name", index_name)
        if (!index) continue
        if (!index.show_detail) continue

        for (var shard_name in data.indices[index_name]['shards']) {
          // var shard = index.shards.findProperty("name", shard_name)

          data.indices[index_name]['shards'][shard_name].forEach(function(shard_data) {
            var shard = index.shards.find(function(item) {
                                  return item.name == shard_name && item.node_id == shard_data['routing']['node']
                                })
            // if (!shard) continue
            if (shard) {

              // l(shard_data)
              shard
                .set("size", shard_data.index.size)
                // .set("docs", shard_data.docs.num_docs)
              shard
                .set("recovery", function() {
                  var recovery_type = shard_data['peer_recovery'] ? 'peer_recovery' : 'gateway_recovery'

                  return {
                    stage:    shard_data[recovery_type].stage,
                    time:     shard_data[recovery_type].time,
                    progress: shard_data[recovery_type].index.progress,
                    size:     shard_data[recovery_type].index.size,
                    reused_size: shard_data[recovery_type].index.reused_size
                  }
                }())
            }
          });
        }
      }
    };

    App.set("refreshing", true)
    $.getJSON(App.elasticsearch_url+"/_cluster/state",        __load_cluster_state);
    $.getJSON(App.elasticsearch_url+"/_stats",                __load_indices_stats);
    $.getJSON(App.elasticsearch_url+"/_status?recovery=true", __load_indices_status);

    // Schedule next run
    //
    App.indices.refresh();
  }
});

// ===== Views ==================================================================================

App.toggleRefreshAllowedButton = Ember.View.create({
  text: 'Stop',

  toggle: function(event) {
    this.set("text", ( App.refresh_allowed == true ) ? 'Start' : 'Stop')
    App.toggleProperty("refresh_allowed")
  }
});

App.toggleChart = Ember.View.create({
  text: 'Hide',

  toggle: function(event) {
    var chart   = $("#chart"),
        visible = chart.is(":visible")

    this.set("text", visible ? 'Show' : 'Hide')
    visible ? chart.hide('fast') : chart.show('fast')
    App.nodes.refresh();
  }
});

App.toggleIndices = Ember.View.create({
  hidden: false,
  text:   'Hide',

  toggle: function(event) {
    this.set("text", this.get('hidden') ? 'Hide' : 'Show')
    this.toggleProperty('hidden')
    App.indices.toggleProperty('hidden')
    App.indices.refresh();
  }
});

App.toggleNodes = Ember.View.create({
  hidden: false,
  text:   'Hide',

  toggle: function(event) {
    this.set("text", this.get('hidden') ? 'Hide' : 'Show')
    this.toggleProperty('hidden')
    App.nodes.toggleProperty('hidden')
  }
});

// ===== Observers ==============================================================================

App.addObserver('elasticsearch_url', function(event) {
  // TODO: Use the `blur` event, so we're not trying to load partial URLs
  Ember.Logger.log("ElasticSearch URL changed to " + this.get("elasticsearch_url"))
  App.cluster.set("content", App.Cluster.create({}))
  App.nodes.set("content", [])
  App.indices.set("content", [])
  App.ready()
  App.Cubism.reset()
});

App.addObserver('refresh_interval', function() {
  Ember.Logger.log("Refresh interval changed to " + App.refresh_interval.label)
  App.ready()
});

App.addObserver('refresh_allowed', function() {
  App.refresh_allowed ? App.Cubism.start() : App.Cubism.stop()
  App.__perform_refresh()
});

App.nodes.addObserver('@each.name', function() {
  // Wait until we have node names...
  if ( !App.nodes.everyProperty("name") ) return;

  Ember.Logger.log("Nodes changed to: " + App.nodes.mapProperty("name").join("; "))
  App.Cubism.reset()
});

App.cluster.addObserver('cluster_name', function() {
  $('title').text('Paramedic | ' + this.get('cluster_name'))
});

App.cluster.addObserver('status', function() {
  if (App.get("sounds_enabled")) {
    // FIXME: When running as a plugin, audio won't play again when `var a = $('#alert-'+this.get("status"))[0]`
    var a = new Audio('audio/alert-'+this.get("status")+'.mp3')
    a.volume=0.7
    a.play()
  }
});

// ===== Helpers ================================================================================

Handlebars.registerHelper('number_with_delimiter', function(property) {
  var delimiter = ' '
    , value = (isNaN(this)) ? Ember.getPath(this, property) : this.toString();
  // console.log(this, property, value)
  // Credit: http://stackoverflow.com/a/2254896/95696
  return value ? value.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1"+delimiter) : value
});

// ===== Varia ==================================================================================

App.apple_touch_icon_b64 = "data:image/png;base64,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";
