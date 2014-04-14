$(document).ready(function () {
	(function($) {



	var sort_by = function(field, reverse, primer){
	   var key = function (x) {return primer ? primer(x[field]) : x[field]};
	   return function (a,b) {
		   var A = key(a), B = key(b);
		   return (A < B ? -1 : (A > B ? 1 : 0)) * [1,-1][+!!reverse];
	   }
	}

	function log10(val) {
		return Math.log(val) / Math.LN10;
	}

		var global = {};
		global.homeTemplate = Handlebars.compile($("#home-template").html());
		global.indicesTemplate = Handlebars.compile($("#indices-template").html());
		global.graphTemplate = Handlebars.compile($("#graph-template").html());
		global.host = window.location.host;
		global.graphs = [];
		global.previousSegments = {};
		global.loaded = false;
		global.refreshInterval = 500;


		var app = Sammy("body", function() {

			this.use('Handlebars', 'hb');

			////////////////////////////////////////
			this.helpers({

				initPage: function() {
					var context = this,
						acceptedParams = ['host', 'refreshInterval'];

					$.each(acceptedParams, function(index, key) {
						var value = context.params[key];
						if (value) {
							global[key] = value;
							$('#' + key).val(value);
						}
					});

					clearTimeout(global.pollID);

					if (global.loaded == false) {
						context.loadIndices();
						context.jq_pauseButton();
						context.jq_refreshInterval();
            					context.jq_changeHostButton();
            					$("#host").val(global.host);
						global.loaded = true;
					}
				},

				jq_pauseButton: function() {
					$("#pause").click(function(e) {
						if($(this).hasClass('btn-danger') == true) {
							global.pause = true;
							$(this).text("Unpause");
						} else {
							global.pause = false;
							$(this).text("Pause");
						}
						$(this).toggleClass('btn-danger btn-success');
					});
				},

        			jq_changeHostButton: function() {
				  var context = this;
			          $("#changeHost").click(function(e) {
				    global.host = $("#host").val().replace(/http:\/\//g,"");
				    global.host = global.host.replace(/\/$/g, "");

				    context.loadIndices();
			          });
			        },

				jq_refreshInterval: function() {
					$("#changeRefresh").click(function(e) {
						global.refreshInterval = $("#refreshInterval").val();
					});
				},

				loadIndices: function() {

					var context = this;

					var loadOptions = 	{type: 'get', dataType: 'json'};
					var stateOptions = "?filter_metadata=true&filter_blocks=true";
					context.load("//" + global.host + "/_cluster/state" + stateOptions, loadOptions)
						.then(function(state) {
							context.cluster_name = state.cluster_name;
							context.master_node = state.master_node;
							context.indices = [];
							$.each(state.routing_table.indices, function (index, v) {
								context.indices.push(index.toString());
							});

							return context;
						})
						.render(global.indicesTemplate)
						.replace("#indices");
				},


				poll: function(index) {

					//Kill caching for all subsequent caching requests
					$.ajaxSetup ({
						cache: false
					});

					var formattedIndex = index;

					if (typeof index === 'undefined') {
						formattedIndex = "/";
					} else {
						formattedIndex += "/";
					}

					var context = this;

					global.pollID = setTimeout(function(){

						if (global.pause == true) {
							context.poll(index);
							return;
						}

						//console.log("Poll: " + index);
						$.getJSON("//" + global.host + "/" + formattedIndex + "_segments/", function(data) {
							var segments = {};

							$.each(data.indices[index].shards, function (shardKey, shardValue) {
								$.each(shardValue, function(shardKeyPR, shardValuePR) {

									var divId = "node_" + shardValuePR.routing.node + "_" + shardKey;

									if (typeof segments[divId] === 'undefined')
										segments[divId] = [];

									segments[divId].push(['Segment ID', 'Fully Synced', 'Committed', 'Uncommitted', 'Deleted Docs']);
									//	 flushed
									$.each(shardValuePR.segments, function (k,v) {

											//bit of math to normalize our values, since Google Charts doesn't do stacked log scales.
											var total = v.num_docs + v.deleted_docs;
											var deleted = 1 + log10(total) - log10(v.num_docs);

											if (deleted == 1)
												deleted = 0;
											else if (!isFinite(deleted))
												deleted = 0;

											//artificially boost num_docs by one, so you can see very small segments
											v.num_docs += 1;

											//fully committed/flushed and in memory
											if (v.search === true && v.committed === true)
												segments[divId].push([k, v.num_docs, 0, 0, deleted]);

											//Lucene Committed to disk
											else if (v.search === false && v.committed === true) {
												segments[divId].push([k, 0, v.num_docs, 0, deleted]);
												//console.log('v.search === true && v.committed === false');
											}

											//Resident in NRT IndexReader (in memory), not Lucene Committed yet
											else if (v.search === true && v.committed === false){
												segments[divId].push([k, 0, 0, v.num_docs,  deleted]);
												//console.log(v);
											}

											//After reading the ES source, this option does not appear possible
											//else if (v.search === false && v.committed === false)
											//	segments[divId].push([k, 0, 0, 0, v.num_docs, deleted]);

									});
								});
							});

							if (segments !== {}) {
								$.each(segments, function (divId, segmentList) {
									segmentList = segmentList.sort(function(a,b) {
										//we can do this because only one of these values will be >0 due to
										//the quirky need to abuse Google Charts for multicolor
										var docsA = a[1] + a[2] + a[3];
										var docsB = b[1] + b[2] + b[3];
										return parseInt(docsB) - parseInt(docsA);
									});

									global.graphs[divId].setData(segmentList);
									global.graphs[divId].drawChart();


								});
							}


						})
            .always(function() { context.poll(index); });
					},global.refreshInterval);

				},
			});
			///////////////////////////////////////////// End Helpers


			this.get('#/', function(context) {

				context.initPage();


				context.render(global.homeTemplate)
				.replace("#content")
			});

			this.get('#/:index/', function(context) {

				context.initPage();

				var targetIndex = context.params.index;

				var loadOptions = 	{type: 'get', dataType: 'json'};
				var stateOptions = "?filter_metadata=true&filter_blocks=true";
				context.load("//" + global.host + "/_cluster/state" + stateOptions, loadOptions)
					.then(function(state) {

						context.cluster_name = state.cluster_name;
						context.master_node = state.master_node;

						context.nodes = {};
						$.each(state.routing_table.indices[targetIndex].shards, function (shardId, shard) {
							$.each(shard, function(prId, pr) {
								if (typeof context.nodes[pr.node] === 'undefined') {
									context.nodes[pr.node] = new Array();
								}

								//css ids can't start with numbers, prepend with "node"
								context.nodes[pr.node].push( {id: "node_" + pr.node + "_" + shardId,
															node: pr.node,
															index: pr.index,
															primary: pr.primary} );

							});




						});


						return context;
					})
					.render(global.graphTemplate)
					.replace("#content")
					.then(function() {
						$.each(context.nodes, function (nodeId,node) {
							$.each(node, function (k, div) {
								global.graphs[div.id] = getGrapher();
								global.graphs[div.id].init(div.id);
							});
						});

						context.poll(targetIndex);
					});
			});

		});

	app.run('#/');

	})(jQuery);
});
