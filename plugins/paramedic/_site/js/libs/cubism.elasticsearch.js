// # Cubism.ElasticSearch #
//
// `cubism.elasticsearch` is an extension for the
// [_Cubism.js_](http://square.github.com/cubism/) visualization platform
// to display statistics from the _ElasticSearch_
// ["Nodes Stats API"](http://www.elasticsearch.org/guide/reference/api/admin-cluster-nodes-stats.html).
//
// ## Usage ##
//
// Setup a Cubism context, and pass it to the `cubism.elasticsearch` function:
//
//     var context       = cubism.context(),
//         elasticsearch = cubism.elasticsearch(context, {host: "http://localhost:9200"}, function() {...})
//
// Use the `metric` function to return a specific metric from a _ElasticSearch_ node in the callback function:
//
//     this.metric("os.cpu.user")
//
// By default, metric is returned from the first node (`0`).
//
// You may use the node's ID or a number giving it's position:
//
//     this.metric("os.cpu.user", "USNEtnCWQW-5oG3Gf9J8Hg")
//     this.metric("os.cpu.user", 0)
//
// You can use any valid path in the JSON returned from the _ElasticSearch_:
//
//     var basic_metrics = [
//       this.metric("os.cpu.user"),
//       this.metric("process.cpu.percent"),
//       this.metric("fs.data[0].disk_reads")
//       // ...
//     ]
//
// Pass the returned metrics as the `data` collection to the _horizon_ chart
// (https://github.com/square/cubism/wiki/Horizon#wiki-_horizon):
//
//     var context = cubism.context(),
//         elasticsearch = cubism.elasticsearch(context, {host: "http://localhost:9200"}, function() {
//           chart.selectAll(".horizon")
//             .data([elasticsearch.metric("os.cpu.user"]), function(d) { return d.toString(); })
//            .enter().append("div")
//             .attr("class", "horizon")
//             .call(context.horizon())
//         });
//
//
// Use the `metrics` function to return an array with the specified metric from all nodes in the cluster:
//
//     this.metrics("os.cpu.user")
//
// To display metrics from all nodes, simply pass them as the `data` collection:
//
//     var context = cubism.context(),
//         elasticsearch = cubism.elasticsearch(context, {host: "http://localhost:9200"}, function() {
//           chart.selectAll(".horizon")
//             .data(elasticsearch.metrics("os.cpu.user"), function(d) { return d.toString(); })
//            .enter().append("div")
//             .attr("class", "horizon")
//             .call(context.horizon())
//           chart.selectAll(".horizon")
//             .data(elasticsearch.metrics("process.cpu.percent"), function(d) { return d.toString(); })
//            .enter().append("div")
//             .attr("class", "horizon")
//             .call(context.horizon())
//         });
//
// Supposed you have a convenience function to add a metric to the chart, such as,
//
//     // Function to add new chart
//     //
//     chart.add = function(metrics) {
//       chart.selectAll(".horizon")
//         .data(metrics, function(d) { return d.toString(); })
//        .enter().append("div")
//         .attr("class", "horizon")
//         .call(context.horizon())
//       return chart;
//     };
//
// then adding a new metric is simply a matter of pasing it the result of `elasticsearch.metrics()` function:
//
//     var context = cubism.context(),
//         elasticsearch = cubism.elasticsearch(context, {host: "http://localhost:9200"}, function() {
//           chart.add( elasticsearch.metrics("os.cpu.user") )
//           chart.add( elasticsearch.metrics("process.cpu.percent") )
//           // ...
//         });
//

var cubism = ('undefined' == typeof cubism) ? {} : cubism;

// An ElasticSearch extension for Cubism.js
//
// Arguments
// ---------
//
// * `context`  -- The Cubism.js context [https://github.com/square/cubism/wiki/Context]
// * `options`  -- Options (eg. ElasticSearch URL)
// * `callback` -- Callback to execute after loading cluster info (eg. adding charts)
//
// Usage
// -----
//
//     var context = cubism.context(),
//
//         elasticsearch = cubism.elasticsearch(
//           context,
//
//           {host: "http://localhost:9200"},
//
//           function() {
//
//             chart.selectAll(".horizon")
//
//               // Overall CPU (user)
//               //
//               .data(elasticsearch.metrics("os.cpu.user"), function(d) { return d.toString(); })
//
//              .enter().append("div")
//               .attr("class", "horizon")
//               .call(context.horizon())
//
//             chart.selectAll(".horizon")
//
//               // CPU consumed by ElasticSearch
//               //
//               .data(elasticsearch.metrics("process.cpu.percent"), function(d) { return d.toString(); })
//
//              .enter().append("div")
//               .attr("class", "horizon")
//             .call(context.horizon())
//
//             chart.selectAll(".horizon")
//
//               // Number of documents on a specific node
//               //
//               .data([elasticsearch.metric("indices.docs.count", "USNEtnCWQW-5oG3Gf9J8Hg"]),
//                     function(d) { return d.toString(); })
//
//              .enter().append("div")
//               .attr("class", "horizon")
//               .call(context.horizon())
//         });
//
cubism.elasticsearch = function(context, options, callback) {
  if (!context)       throw new Error("Please pass a valid Cubism context instance as the first argument");

  options = options || {}
  if (!options.host)  options.host = "http://localhost:9200";

  var source  = {},
      context = context,
      initialized_metrics = {};

      source.cluster = {};
      source.node_names = {};

  // Returns a function, which will return data for the Cubism horizon chart callbacks.
  //
  var __cubism_metric_callback = function(node, expression) {
    return function(start, stop, step, callback) {
      var  values    = [],
           value     = 0,
           start     = +start,
           stop      = +stop,
           metric_id = node.id+'-'+expression

      d3.json(source.url(), function(data) {
        if (!data)                return callback(new Error("Unable to load data from ElasticSearch!"))
        if (!data.nodes[node.id]) return callback(new Error("Unable to find node " + node.id + "!"))

        var value     = eval("data.nodes['"+node.id+"']." + expression) // data.nodes[<NAME>].os.cpu.user
        // console.log(expression + ': ' + value)

        // Cubism.js expects a value for every "slot" based on the `start` and `stop` parameters, because
        // it assumes a backend such as [_Graphite_](https://github.com/square/cubism/wiki/Graphite),
        // which is able to return values stored over time.
        //
        // In _ElasticSearch_, we don't have any data stored: we poll the API repeatedly.
        //
        // On first call, Cubism.js calls the metric callback function with a large `start` and `stop` gap,
        // based on the `step` and `size` values of your chart. This would spoil the chart with a useless
        // "thick colored line".
        //
        // So: if we have already initialized this metric, push the same value to all the "slots",
        // because this is what Cubism.js expects...
        if (initialized_metrics[metric_id]) {
          while (start < stop) {
            start += step;
            values.push(value);
          }
        }
        // ... otherwise mark this metric as initialized and fill the empty / "historical" slots with empty values.
        else {
          initialized_metrics[metric_id] = true;
          while (start < (stop - step)) {
            start += step;
            values.push(NaN);
          }
          values.push(value);
        }

        callback(null, values)
      });
    }
  }

  // Load information about ElasticSearch nodes from the Nodes Info API
  // [http://www.elasticsearch.org/guide/reference/api/admin-cluster-nodes-info.html]
  //
  d3.json(options.host + "/_nodes", function(cluster) {
    source.cluster   = cluster
    source.node_names = d3.keys(cluster.nodes)

    // Returns a metric for specific node
    //
    // Arguments
    // ---------
    //
    // * `expression` -- A valid path in the ElasticSearch JSON response (eg. `os.cpu.user`)
    // * `n`          -- A node specification. Can be either node ID (eg. `USNEtnCWQW-5oG3Gf9J8Hg`),
    //                   or a number giving position in response (eg. `0`)
    //
    // For usage, see documentation for `cubism.elasticsearch`
    //
    source.metric = function(expression, n) {
      var n         = n || 0,
          node_id   = ("number" == typeof n) ? source.node_names[n] : n,
          node      = source.cluster.nodes[node_id];

      var metric = context.metric(__cubism_metric_callback(node, expression), expression + " [" + node.name + "]");

      return metric;
    };

    // Returns a metric across all nodes
    //
    // Arguments
    // ---------
    //
    // * `expression` -- A valid path in the ElasticSearch JSON response (eg. `os.cpu.user`)
    //
    // For usage, see documentation for `cubism.elasticsearch`
    //
    source.metrics = function(expression) {
      var metrics = [],
          ordered_nodes = [];
      for ( var n in source.cluster.nodes )
          { var o = source.cluster.nodes[n]; o.id = n; ordered_nodes.push(o) }

      ordered_nodes = ordered_nodes.sort(function(a,b) {
        if (a.name < b.name) return -1;
        if (a.name > b.name) return 1;
        return 0;
      });

      ordered_nodes.forEach( function(node) {
        var metric = context.metric(__cubism_metric_callback(node, expression), expression + " [" + node.name + "]");
        metrics.push(metric)
      })

      return metrics;
    };

    callback.call(source)
  })

  source.toString = function() { return options.host };
  source.url      = function() { return options.host + "/_nodes/stats?all" };

  return source;
};
