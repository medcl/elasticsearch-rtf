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

var SelectedClusterNodeView = Backbone.View.extend({

    el: "#selectedClusterNode",

//    initialize: function() {
//        console.log("initialize",this);
//    },

    nodeId: function() {
        return this.options.nodeId;
    },

    render: function() {

        // Input is an array of objects having two properties: timestamp and value.
        // It update both properties timestamp and value and removes the first item.
        var normalizedDeltaToSeconds = function(items) {
            for (var i=(items.length - 1); i > 0 ; i--) {
                // delta value
                items[i].value -= items[i-1].value;
                // normalize value to seconds
                items[i].value = items[i].value / (
                    ( items[i].timestamp - items[i-1].timestamp ) <= 1000 ? 1 :
                        ( items[i].timestamp - items[i-1].timestamp ) / 1000
                    );
                // avg timestamp
                items[i].timestamp = Math.round( ( items[i].timestamp + items[i].timestamp ) / 2 );
            }
            items.shift();
        };

        var delta = function(items) {
            for (var i=(items.length - 1); i > 0 ; i--) {
                items[i].value -= items[i-1].value;
            }
            items.shift();
        };

        var _view = this;
        var nodeInfoModel = this.model.get("nodeInfo");
        var dispatcher = this.model.get("dispatcher");

        nodeInfoModel.fetch({

            nodeId: this.options.nodeId,
            success: function(model, response) {

                var selectedNodeInfo = response;
                var selectedNodeId = _view.options.nodeId;

                dispatcher.trigger("onAjaxResponse", response.cluster_name, "Node > Info", response);

                _view.renderNodeDetail(model);

                // Create all charts

                var chart_fileDescriptors = bigdesk_charts.fileDescriptors.chart(d3.select("#svg_fileDescriptors"));
                var chart_channels = bigdesk_charts.channels.chart(d3.select("#svg_channels"));
                var chart_jvmThreads = bigdesk_charts.jvmThreads.chart(d3.select("#svg_jvmThreads"));
                var chart_jvmHeapMem = bigdesk_charts.jvmHeapMem.chart(d3.select("#svg_jvmHeapMem"));
                var chart_jvmNonHeapMem = bigdesk_charts.jvmNonHeapMem.chart(d3.select("#svg_jvmNonHeapMem"));
                var chart_jvmGC = bigdesk_charts.jvmGC.chart(d3.select("#svg_jvmGC"));
				var chart_threadpoolSearch = bigdesk_charts.threadpoolSearch.chart(d3.select("#svg_threadpoolSearch"));
				var chart_threadpoolIndex = bigdesk_charts.threadpoolIndex.chart(d3.select("#svg_threadpoolIndex"));
				var chart_threadpoolBulk = bigdesk_charts.threadpoolBulk.chart(d3.select("#svg_threadpoolBulk"));
				var chart_threadpoolRefresh = bigdesk_charts.threadpoolRefresh.chart(d3.select("#svg_threadpoolRefresh"));
                var chart_osCpu = bigdesk_charts.osCpu.chart(d3.select("#svg_osCpu"));
                var chart_osMem = bigdesk_charts.osMem.chart(d3.select("#svg_osMem"));
                var chart_osSwap = bigdesk_charts.osSwap.chart(d3.select("#svg_osSwap"));
                var chart_osLoadAvg = bigdesk_charts.osLoadAvg.chart(d3.select("#svg_osLoadAvg"));
                var chart_indicesSearchReqs = bigdesk_charts.indicesSearchReqs.chart(d3.select("#svg_indicesSearchReqs"));
                var chart_indicesSearchTime = bigdesk_charts.indicesSearchTime.chart(d3.select("#svg_indicesSearchTime"));
                var chart_indicesGetReqs = bigdesk_charts.indicesGetReqs.chart(d3.select("#svg_indicesGetReqs"));
                var chart_indicesGetTime = bigdesk_charts.indicesGetTime.chart(d3.select("#svg_indicesGetTime"));
                var chart_indicesIndexingReqs = bigdesk_charts.indicesIndexingReqs.chart(d3.select("#svg_indicesIndexingReqs"));
                var chart_indicesCacheSize = bigdesk_charts.indicesCacheSize.chart(d3.select("#svg_indicesCacheSize"));
                var chart_indicesCacheEvictions = bigdesk_charts.indicesCacheEvictions.chart(d3.select("#svg_indicesCacheEvictions"));
                var chart_indicesIndexingTime = bigdesk_charts.indicesIndexingTime.chart(d3.select("#svg_indicesIndexingTime"));
                var chart_processCPU_time = bigdesk_charts.processCPU_time.chart(d3.select("#svg_processCPU_time"));

                var chart_processCPU_pct = null;
                    // sigar & AWS check
                    if (selectedNodeInfo.nodes[selectedNodeId].os.cpu) {
                        chart_processCPU_pct = bigdesk_charts.processCPU_pct.chart(d3.select("#svg_processCPU_pct"),
                                            ( +selectedNodeInfo.nodes[selectedNodeId].os.cpu.total_cores * 100 )+ "%" );
                    } else {
                        chart_processCPU_pct = bigdesk_charts.not_available.chart(d3.select("#svg_processCPU_pct"));
                    }

                var chart_processMem = bigdesk_charts.processMem.chart(d3.select("#svg_processMem"));
                var chart_transport_txrx = bigdesk_charts.transport_txrx.chart(d3.select("#svg_transport_txrx"));
                var charts_disk_reads_writes_cnt = {};
                var charts_disk_reads_writes_size = {};


                var nodesStatsCollection = _view.model.get("nodesStats");

                // function to update all node stats charts
                var updateCharts = function() {

                    // should the charts be animated?
                    var animatedCharts = $("#animatedCharts").prop("checked");
                    if (!animatedCharts) { animatedCharts = false; }

                    // get stats for selected node
                    var stats = [];
                    var stats_the_latest = undefined;

                    _.defer(function(){
                        stats = nodesStatsCollection.map(function(snapshot){
                            if (snapshot.get("nodes").get(_view.nodeId()))
                                return {
                                    id: snapshot.id, // this is timestamp
                                    node: snapshot.get("nodes").get(_view.nodeId()).toJSON()
                                }
                        });

                        stats = _.filter(stats, function(item){ return (item!=undefined)});

                        stats_the_latest = stats[stats.length - 1];

                        dispatcher.trigger("onNewData", "the latest node stats:", stats_the_latest);

                    });

                    // --------------------------------------------
                    // Channels

                    _.defer(function(){
                        var opened_http_channels = bigdesk_charts.channels.series1(stats);
                        var opened_transport_server_channels = bigdesk_charts.channels.series2(stats);

                        var theLatestTotalOpened = stats[stats.length-1].node.http.total_opened;

                        try { chart_channels.animate(animatedCharts).update(opened_http_channels, opened_transport_server_channels); } catch (ignore) {}

                        if (opened_http_channels.length > 0) {
                            $("#open_http_channels").text(opened_http_channels[opened_http_channels.length-1].value);
                        }
                        if (opened_transport_server_channels.length > 0) {
                            $("#open_transport_channels").text(opened_transport_server_channels[opened_transport_server_channels.length-1].value);
                        }
                        if (theLatestTotalOpened) {
                            $("#total_opened_http_channels").text(theLatestTotalOpened);
                        }
                    });

                    // --------------------------------------------
                    // JVM Info

                    _.defer(function(){
                        if (stats_the_latest && stats_the_latest.node) {
                            $("#jvm_uptime").text(stats_the_latest.node.jvm.uptime);
                        } else {
                            $("#jvm_uptime").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // JVM Threads

                    _.defer(function(){
                        var jvm_threads_count = bigdesk_charts.jvmThreads.series1(stats);
                        var jvm_threads_peak_count = bigdesk_charts.jvmThreads.series2(stats);

                        try { chart_jvmThreads.animate(animatedCharts).update(jvm_threads_count, jvm_threads_peak_count); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#jvm_threads_peak").text(stats_the_latest.node.jvm.threads.peak_count);
                            $("#jvm_threads_count").text(stats_the_latest.node.jvm.threads.count);
                        } else {
                            $("#jvm_threads_peak").text("n/a");
                            $("#jvm_threads_count").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // JVM GC

                    _.defer(function(){
                        var jvm_gc_young_collection_count_delta = bigdesk_charts.jvmGC.series1(stats);
                        var jvm_gc_old_collection_count_delta = bigdesk_charts.jvmGC.series2(stats);
                        var jvm_gc_both_collection_time_delta = bigdesk_charts.jvmGC.series3(stats);
                        if (jvm_gc_old_collection_count_delta.length > 1 && jvm_gc_young_collection_count_delta.length > 1 && jvm_gc_both_collection_time_delta.length > 1) {

                            delta(jvm_gc_old_collection_count_delta);
                            delta(jvm_gc_young_collection_count_delta);
                            delta(jvm_gc_both_collection_time_delta);

                            try {
								chart_jvmGC.animate(animatedCharts).update(
									jvm_gc_young_collection_count_delta,
									jvm_gc_old_collection_count_delta,
									jvm_gc_both_collection_time_delta);
							} catch (ignore) {}
                        }

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#jvm_gc_time").text(
								stats_the_latest.node.jvm.gc.collectors.old.collection_time_in_millis + "ms / " + stats_the_latest.node.jvm.gc.collectors.young.collection_time_in_millis + "ms"
							);
                            $("#jvm_gc_count").text(
								stats_the_latest.node.jvm.gc.collectors.old.collection_count + " / " + stats_the_latest.node.jvm.gc.collectors.young.collection_count
							);
                        } else {
                            $("#jvm_gc_time").text("n/a");
                            $("#jvm_gc_count").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // JVM Heap Mem

                    _.defer(function(){
                        var jvm_heap_used_mem= bigdesk_charts.jvmHeapMem.series1(stats);
                        var jvm_heap_committed_mem= bigdesk_charts.jvmHeapMem.series2(stats);

                        try { chart_jvmHeapMem.animate(animatedCharts).update(jvm_heap_used_mem, jvm_heap_committed_mem); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#jvm_heap_mem_committed").text(stats_the_latest.node.jvm.mem.heap_committed);
                            $("#jvm_heap_mem_used").text(stats_the_latest.node.jvm.mem.heap_used);
                        } else {
                            $("#jvm_heap_mem_committed").text("n/a");
                            $("#jvm_heap_mem_used").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // JVM Non Heap Mem

                    _.defer(function(){
                        var jvm_non_heap_used_mem= bigdesk_charts.jvmNonHeapMem.series1(stats);
                        var jvm_non_heap_committed_mem= bigdesk_charts.jvmNonHeapMem.series2(stats);

                        try { chart_jvmNonHeapMem.animate(animatedCharts).update(jvm_non_heap_used_mem, jvm_non_heap_committed_mem); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#jvm_non_heap_mem_committed").text(stats_the_latest.node.jvm.mem.non_heap_committed);
                            $("#jvm_non_heap_mem_used").text(stats_the_latest.node.jvm.mem.non_heap_used);
                        } else {
                            $("#jvm_non_heap_mem_committed").text("n/a");
                            $("#jvm_non_heap_mem_used").text("n/a");
                        }
                    });

					// --------------------------------------------
					// Threadpool Search

                    _.defer(function(){
                        var threadpool_search_count = bigdesk_charts.threadpoolSearch.series1(stats);
                        var threadpool_search_peak = bigdesk_charts.threadpoolSearch.series2(stats);
                        var threadpool_search_queue = bigdesk_charts.threadpoolSearch.series3(stats);

                        try { chart_threadpoolSearch.animate(animatedCharts).update(threadpool_search_count, threadpool_search_peak, threadpool_search_queue); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#tp_search_count").text(stats_the_latest.node.thread_pool.search.active);
                            $("#tp_search_peak").text(stats_the_latest.node.thread_pool.search.largest);
                            $("#tp_search_queue").text(stats_the_latest.node.thread_pool.search.queue);
                        } else {
                            $("#tp_search_count").text("n/a");
                            $("#tp_search_peak").text("n/a");
                            $("#tp_search_queue").text("n/a");
                        }
                    });

					// --------------------------------------------
					// Threadpool Index

                    _.defer(function(){
                        var threadpool_index_count = bigdesk_charts.threadpoolIndex.series1(stats);
                        var threadpool_index_peak = bigdesk_charts.threadpoolIndex.series2(stats);
                        var threadpool_index_queue = bigdesk_charts.threadpoolIndex.series3(stats);

                        try { chart_threadpoolIndex.animate(animatedCharts).update(threadpool_index_count, threadpool_index_peak, threadpool_index_queue); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#tp_index_count").text(stats_the_latest.node.thread_pool.index.active);
                            $("#tp_index_peak").text(stats_the_latest.node.thread_pool.index.largest);
                            $("#tp_index_queue").text(stats_the_latest.node.thread_pool.index.queue);
                        } else {
                            $("#tp_index_count").text("n/a");
                            $("#tp_index_peak").text("n/a");
                            $("#tp_index_queue").text("n/a");
                        }
                    });

					// --------------------------------------------
					// Threadpool Bulk

                    _.defer(function(){
                        var threadpool_bulk_count = bigdesk_charts.threadpoolBulk.series1(stats);
                        var threadpool_bulk_peak = bigdesk_charts.threadpoolBulk.series2(stats);
                        var threadpool_bulk_queue = bigdesk_charts.threadpoolBulk.series3(stats);

                        try { chart_threadpoolBulk.animate(animatedCharts).update(threadpool_bulk_count, threadpool_bulk_peak, threadpool_bulk_queue); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#tp_bulk_count").text(stats_the_latest.node.thread_pool.bulk.active);
                            $("#tp_bulk_peak").text(stats_the_latest.node.thread_pool.bulk.largest);
                            $("#tp_bulk_queue").text(stats_the_latest.node.thread_pool.bulk.queue);
                        } else {
                            $("#tp_bulk_count").text("n/a");
                            $("#tp_bulk_peak").text("n/a");
                            $("#tp_bulk_queue").text("n/a");
                        }
                    });

					// --------------------------------------------
					// Threadpool Refresh

                    _.defer(function(){
                        var threadpool_refresh_count = bigdesk_charts.threadpoolRefresh.series1(stats);
                        var threadpool_refresh_peak = bigdesk_charts.threadpoolRefresh.series2(stats);
                        var threadpool_refresh_queue = bigdesk_charts.threadpoolRefresh.series3(stats);

                        try { chart_threadpoolRefresh.animate(animatedCharts).update(threadpool_refresh_count, threadpool_refresh_peak, threadpool_refresh_queue); } catch (ignore) {}

                        if (stats_the_latest && stats_the_latest.node) {
                            $("#tp_refresh_count").text(stats_the_latest.node.thread_pool.refresh.active);
                            $("#tp_refresh_peak").text(stats_the_latest.node.thread_pool.refresh.largest);
                            $("#tp_refresh_queue").text(stats_the_latest.node.thread_pool.refresh.queue);
                        } else {
                            $("#tp_refresh_count").text("n/a");
                            $("#tp_refresh_peak").text("n/a");
                            $("#tp_refresh_queue").text("n/a");
                        }
                    });


                    // --------------------------------------------
                    // OS Info

                    _.defer(function(){
                        if (stats_the_latest && stats_the_latest.node) {
                            $("#os_uptime").text(stats_the_latest.node.os.uptime);
                        } else {
                            $("#os_uptime").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // OS CPU

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.os && stats_the_latest.node.os.cpu) {

                            var os_cpu_sys = bigdesk_charts.osCpu.series1(stats);
                            var os_cpu_user = bigdesk_charts.osCpu.series2(stats);
                            var os_cpu_idle = bigdesk_charts.osCpu.series3(stats);

                            try { chart_osCpu.animate(animatedCharts).update(os_cpu_sys, os_cpu_user, os_cpu_idle); } catch (ignore) {}

                            $("#os_cpu_user").text(stats_the_latest.node.os.cpu.user + "%");
                            $("#os_cpu_sys").text(stats_the_latest.node.os.cpu.sys + "%");
                        } else {
                            chart_osCpu = bigdesk_charts.not_available.chart(chart_osCpu.svg());
                            $("#os_cpu_user").text("n/a");
                            $("#os_cpu_sys").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // OS Mem

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.os && stats_the_latest.node.os.mem) {

                            var os_mem_actual_used = bigdesk_charts.osMem.series1(stats);
                            var os_mem_actual_free = bigdesk_charts.osMem.series2(stats);

                            try { chart_osMem.animate(animatedCharts).update(os_mem_actual_used, os_mem_actual_free); } catch (ignore) {}

                            $("#os_mem_free").text(stats_the_latest.node.os.mem.actual_free);
                            $("#os_mem_used").text(stats_the_latest.node.os.mem.actual_used);
                        } else {
                            chart_osMem = bigdesk_charts.not_available.chart(chart_osMem.svg());
                            $("#os_mem_free").text("n/a");
                            $("#os_mem_used").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // OS swap

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.os && stats_the_latest.node.os.swap) {

                            var os_swap_used = bigdesk_charts.osSwap.series1(stats);
                            var os_swap_free = bigdesk_charts.osSwap.series2(stats);

                            try { chart_osSwap.animate(animatedCharts).update(os_swap_used, os_swap_free); } catch (ignore) {}

                            $("#os_swap_free").text(stats_the_latest.node.os.swap.free);
                            $("#os_swap_used").text(
                                // https://github.com/elasticsearch/elasticsearch/issues/1804
                                stats_the_latest.node.os.swap.used == undefined ? "n/a" :
                                stats_the_latest.node.os.swap.used
                            );
                        } else {
                            chart_osSwap = bigdesk_charts.not_available.chart(chart_osSwap.svg());
                            $("#os_swap_free").text("n/a");
                            $("#os_swap_used").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // OS load average

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.os && stats_the_latest.node.os.load_average) {

                            var os_loadAvg_0 = bigdesk_charts.osLoadAvg.series1(stats);
                            var os_loadAvg_1 = bigdesk_charts.osLoadAvg.series2(stats);
                            var os_loadAvg_2 = bigdesk_charts.osLoadAvg.series3(stats);

                            try { chart_osLoadAvg.animate(animatedCharts).update(os_loadAvg_0, os_loadAvg_1, os_loadAvg_2); } catch (ignore) {}

                            $("#os_load_0").text(stats_the_latest.node.os.load_average["0"]);
                            $("#os_load_1").text(stats_the_latest.node.os.load_average["1"]);
                            $("#os_load_2").text(stats_the_latest.node.os.load_average["2"]);
                        } else {
                            chart_osLoadAvg = bigdesk_charts.not_available.chart(chart_osLoadAvg.svg());
                            $("#os_load_0").text("n/a");
                            $("#os_load_1").text("n/a");
                            $("#os_load_2").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Indices

                    _.defer(function(){
                        if (stats_the_latest && stats_the_latest.node) {
                            $("#indices_docs_count").text(stats_the_latest.node.indices.docs.count);
                            $("#indices_docs_deleted").text(stats_the_latest.node.indices.docs.deleted);
                            $("#indices_store_size").text(stats_the_latest.node.indices.store.size);
                            $("#indices_flush_total").text(stats_the_latest.node.indices.flush.total + ", " + stats_the_latest.node.indices.flush.total_time);
                            $("#indices_refresh_total").text(stats_the_latest.node.indices.refresh.total + ", " + stats_the_latest.node.indices.refresh.total_time);
                        } else {
                            $("#indices_docs_count").text("n/a");
                            $("#indices_docs_deleted").text("n/a");
                            $("#indices_store_size").text("n/a");
                            $("#indices_flush_total").text("n/a");
                            $("#indices_refresh_total").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Indices: search requests

                    _.defer(function(){
                        var indices_fetch_reqs = bigdesk_charts.indicesSearchReqs.series1(stats);
                        var indices_query_reqs = bigdesk_charts.indicesSearchReqs.series2(stats);

                        if (indices_fetch_reqs.length > 1 && indices_query_reqs.length > 1) {

                            normalizedDeltaToSeconds(indices_fetch_reqs);
                            normalizedDeltaToSeconds(indices_query_reqs);

                            try { chart_indicesSearchReqs.animate(animatedCharts).update(indices_fetch_reqs, indices_query_reqs); } catch (ignore) {}

                            $("#indices_search_query_reqs").text(stats_the_latest.node.indices.search.query_total);
                            $("#indices_search_fetch_reqs").text(stats_the_latest.node.indices.search.fetch_total);
                        }
                    });

                    // --------------------------------------------
                    // Indices: search time

                    _.defer(function(){
                        var indices_fetch_time = bigdesk_charts.indicesSearchTime.series1(stats);
                        var indices_query_time = bigdesk_charts.indicesSearchTime.series2(stats);

                        if (indices_fetch_time.length > 1 && indices_query_time.length > 1) {

                            normalizedDeltaToSeconds(indices_fetch_time);
                            normalizedDeltaToSeconds(indices_query_time);

                            try { chart_indicesSearchTime.animate(animatedCharts).update(indices_fetch_time, indices_query_time); } catch (ignore) {}

                            $("#indices_search_query_time").text(stats_the_latest.node.indices.search.query_time);
                            $("#indices_search_fetch_time").text(stats_the_latest.node.indices.search.fetch_time);
                        }
                    });

                    // --------------------------------------------
                    // Indices: get requests

                    _.defer(function(){
                        var indices_get_reqs = bigdesk_charts.indicesGetReqs.series1(stats);
                        var indices_missing_reqs = bigdesk_charts.indicesGetReqs.series2(stats);
                        var indices_exists_reqs = bigdesk_charts.indicesGetReqs.series3(stats);

                        if (indices_get_reqs.length > 1 && indices_missing_reqs.length > 1 && indices_exists_reqs.length > 1) {

                            normalizedDeltaToSeconds(indices_get_reqs);
                            normalizedDeltaToSeconds(indices_missing_reqs);
                            normalizedDeltaToSeconds(indices_exists_reqs);

                            try { chart_indicesGetReqs.animate(animatedCharts).update(indices_get_reqs, indices_missing_reqs, indices_exists_reqs); } catch (ignore) {}

                            $("#indices_get_reqs").text(stats_the_latest.node.indices.get.total);
                            $("#indices_exists_reqs").text(stats_the_latest.node.indices.get.exists_total);
                            $("#indices_missing_reqs").text(stats_the_latest.node.indices.get.missing_total);
                        }
                    });

                    // --------------------------------------------
                    // Indices: get time

                    _.defer(function(){
                        var indices_get_time = bigdesk_charts.indicesGetTime.series1(stats);
                        var indices_missing_time = bigdesk_charts.indicesGetTime.series2(stats);
                        var indices_exists_time = bigdesk_charts.indicesGetTime.series3(stats);

                        if (indices_get_time.length > 1 && indices_missing_time.length > 1 && indices_exists_time.length > 1) {

                            normalizedDeltaToSeconds(indices_get_time);
                            normalizedDeltaToSeconds(indices_missing_time);
                            normalizedDeltaToSeconds(indices_exists_time);

                            try { chart_indicesGetTime.animate(animatedCharts).update(indices_get_time, indices_missing_time, indices_exists_time); } catch (ignore) {}

                            $("#indices_get_time").text(stats_the_latest.node.indices.get.get_time);
                            $("#indices_exists_time").text(stats_the_latest.node.indices.get.exists_time);
                            $("#indices_missing_time").text(stats_the_latest.node.indices.get.missing_time);
                        }
                    });

                    // --------------------------------------------
                    // Indices: indexing requests

                    _.defer(function(){
                        var indices_indexing_index_reqs = bigdesk_charts.indicesIndexingReqs.series1(stats);
                        var indices_indexing_delete_reqs = bigdesk_charts.indicesIndexingReqs.series2(stats);

                        if (indices_indexing_index_reqs.length > 1 && indices_indexing_delete_reqs.length > 1) {

                            normalizedDeltaToSeconds(indices_indexing_index_reqs);
                            normalizedDeltaToSeconds(indices_indexing_delete_reqs);

                            try { chart_indicesIndexingReqs.animate(animatedCharts).update(indices_indexing_index_reqs, indices_indexing_delete_reqs); } catch (ignore) {}

                            $("#indices_indexing_delete_reqs").text(stats_the_latest.node.indices.indexing.delete_total);
                            $("#indices_indexing_index_reqs").text(stats_the_latest.node.indices.indexing.index_total);
                        }
                    });

                    // --------------------------------------------
                    // Indices: indexing time

                    _.defer(function(){
                        var indices_indexing_index_time = bigdesk_charts.indicesIndexingTime.series1(stats);
                        var indices_indexing_delete_time = bigdesk_charts.indicesIndexingTime.series2(stats);

                        if (indices_indexing_index_time.length > 1 && indices_indexing_delete_time.length > 1) {

                            normalizedDeltaToSeconds(indices_indexing_index_time);
                            normalizedDeltaToSeconds(indices_indexing_delete_time);

                            try { chart_indicesIndexingTime.animate(animatedCharts).update(indices_indexing_index_time, indices_indexing_delete_time); } catch (ignore) {}

                            $("#indices_indexing_delete_time").text(stats_the_latest.node.indices.indexing.delete_time);
                            $("#indices_indexing_index_time").text(stats_the_latest.node.indices.indexing.index_time);
                        }
                    });

                    // --------------------------------------------
                    // Indices: cache size

                    _.defer(function(){
                        var indices_cache_field_size = bigdesk_charts.indicesCacheSize.series1(stats);
                        var indices_cache_filter_size = bigdesk_charts.indicesCacheSize.series2(stats);
                        var indices_id_cache_size = bigdesk_charts.indicesCacheSize.series3(stats);

                        try { chart_indicesCacheSize.animate(animatedCharts)
							.update(indices_cache_field_size, indices_cache_filter_size, indices_id_cache_size);
						} catch (ignore) {}

                        if (stats_the_latest.node && stats_the_latest.node.indices && stats_the_latest.node.indices.filter_cache) {
                            $("#indices_filter_cache_size").text(stats_the_latest.node.indices.filter_cache.memory_size);
                            $("#indices_field_cache_size").text(stats_the_latest.node.indices.fielddata.memory_size);
                            $("#indices_id_cache_size").text(stats_the_latest.node.indices.id_cache.memory_size);
                        } else {
                            $("#indices_filter_cache_size").text("n/a");
                            $("#indices_field_cache_size").text("n/a");
                            $("#indices_id_cache_size").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Indices: cache evictions

                    _.defer(function(){
                        var indices_cache_field_evictions = bigdesk_charts.indicesCacheEvictions.series1(stats);
                        var indices_cache_filter_evictions = bigdesk_charts.indicesCacheEvictions.series2(stats);

                        if (indices_cache_field_evictions.length > 1 && indices_cache_filter_evictions.length > 1) {

                            normalizedDeltaToSeconds(indices_cache_field_evictions);
                            normalizedDeltaToSeconds(indices_cache_filter_evictions);

                            try { chart_indicesCacheEvictions.animate(animatedCharts).update(indices_cache_field_evictions, indices_cache_filter_evictions); } catch (ignore) {}

                            $("#indices_filter_cache_evictions").text(stats_the_latest.node.indices.filter_cache.evictions);
                            $("#indices_field_cache_evictions").text(stats_the_latest.node.indices.fielddata.evictions);

                        }
                    });

                    // --------------------------------------------
                    // Indices: cache filter count

//                    _.defer(function(){
//                        if (stats_the_latest.node && stats_the_latest.node.indices && stats_the_latest.node.indices.cache) {
//                            $("#indices_cache_filter_size").text(stats_the_latest.node.indices.cache.filter_count);
//                        } else {
//                            $("#indices_cache_filter_size").text("n/a");
//                        }
//                    });

                    // --------------------------------------------
                    // Process: CPU time (in millis)

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.process && stats_the_latest.node.process.cpu) {

                            var calcType = $("#process_time_avg_calc_type").find(":selected").val();

                            var process_cpu_time_user_delta = bigdesk_charts.processCPU_time.series1(stats);
                            var process_cpu_time_sys_delta = bigdesk_charts.processCPU_time.series2(stats);

                            if (process_cpu_time_sys_delta.length > 1 && process_cpu_time_user_delta.length > 1) {

                                if (calcType == "weighted") {
                                    normalizedDeltaToSeconds(process_cpu_time_user_delta);
                                    normalizedDeltaToSeconds(process_cpu_time_sys_delta);
                                } else {
                                    delta(process_cpu_time_user_delta);
                                    delta(process_cpu_time_sys_delta);
                                }

                                try { chart_processCPU_time.animate(animatedCharts).update(process_cpu_time_user_delta, process_cpu_time_sys_delta); } catch (ignore) {}
                            }

                            $("#process_cpu_time_sys").text(stats_the_latest.node.process.cpu.sys_in_millis + "ms");
                            $("#process_cpu_time_user").text(stats_the_latest.node.process.cpu.user_in_millis + "ms");
                        } else {
                            chart_processCPU_time = bigdesk_charts.not_available.chart(chart_processCPU_time.svg());
                            $("#process_cpu_time_sys").text("n/a");
                            $("#process_cpu_time_user").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Process: file descriptors

                    _.defer(function(){
                        var open_file_descriptors = bigdesk_charts.fileDescriptors.series1(stats);
                        var max_file_descriptors = open_file_descriptors.slice(0).map(function(snapshot){
                            return {
                                timestamp: +snapshot.timestamp,
                                value: +selectedNodeInfo.nodes[selectedNodeId].process.max_file_descriptors
                            }
                        });

                        try { chart_fileDescriptors.animate(animatedCharts).update(open_file_descriptors, max_file_descriptors); } catch (ignore) {}

                        if (open_file_descriptors.length > 0) {
                            $("#open_file_descriptors").text(open_file_descriptors[open_file_descriptors.length-1].value);
                        }
                    });

                    // --------------------------------------------
                    // Process: CPU percentage

                    _.defer(function(){

                        var _total_cores = null;

                        // sigar & AWS check
                        if (selectedNodeInfo.nodes[selectedNodeId].os.cpu) {
                            _total_cores = selectedNodeInfo.nodes[selectedNodeId].os.cpu.total_cores;
                        } else {
                            _total_cores = 1;
                        }

                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.process && stats_the_latest.node.process.cpu) {

                            var process_cpu_pct = bigdesk_charts.processCPU_pct.series1(stats);

                            // TODO do not show this second series if total_cores value is unknown
                            var process_cpu_max = process_cpu_pct.map(function(item){
                                return {
                                    timestamp: item.timestamp,
                                    value: ( 100 * _total_cores )
                                }
                            });

                            try { chart_processCPU_pct.animate(animatedCharts).update(process_cpu_pct, process_cpu_max); } catch (ignore) {}

                            $("#process_cpu_pct_total").text((_total_cores * 100) + "%");
                            $("#process_cpu_pct_process").text(stats_the_latest.node.process.cpu.percent + "%");
                        } else {
                            chart_processCPU_pct = bigdesk_charts.not_available.chart(chart_processCPU_pct.svg());
                            $("#process_cpu_pct_total").text("n/a");
                            $("#process_cpu_pct_process").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Process: Mem

                    _.defer(function(){
                        // sigar & AWS check
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.process && stats_the_latest.node.process.mem) {

                            var process_mem_share = bigdesk_charts.processMem.series1(stats);
                            var process_mem_resident = bigdesk_charts.processMem.series2(stats);
                            var process_mem_total_virtual = bigdesk_charts.processMem.series3(stats);

                            try { chart_processMem.animate(animatedCharts).update(process_mem_share, process_mem_resident, process_mem_total_virtual); } catch (ignore) {}

                            $("#process_mem_total_virtual").text(stats_the_latest.node.process.mem.total_virtual);
                            $("#process_mem_resident").text(stats_the_latest.node.process.mem.resident);
                            $("#process_mem_share").text(stats_the_latest.node.process.mem.share);
                        } else {
                            chart_processMem = bigdesk_charts.not_available.chart(chart_processMem.svg());
                            $("#process_mem_total_virtual").text("n/a");
                            $("#process_mem_resident").text("n/a");
                            $("#process_mem_share").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // Transport: Tx Rx

                    _.defer(function(){

                        var calcType = $("#transport_avg_calc_type").find(":selected").val();

                        var transport_tx_delta = bigdesk_charts.transport_txrx.series1(stats);
                        var transport_rx_delta = bigdesk_charts.transport_txrx.series2(stats);

                        if (transport_tx_delta.length > 1 && transport_rx_delta.length > 1) {

                            if (calcType == "weighted") {
                                normalizedDeltaToSeconds(transport_tx_delta);
                                normalizedDeltaToSeconds(transport_rx_delta);
                            } else {
                                delta(transport_tx_delta);
                                delta(transport_rx_delta);
                            }

                            try { chart_transport_txrx.animate(animatedCharts).update(transport_tx_delta, transport_rx_delta); } catch (ignore) {}
                        }
                        var _t = stats_the_latest.node.transport;
                        if (_t && _t.rx_size && _t.tx_size && _t.rx_count != undefined && _t.tx_count != undefined) {
                            $("#transport_rx_size").text(stats_the_latest.node.transport.rx_size);
                            $("#transport_tx_size").text(stats_the_latest.node.transport.tx_size);
                            $("#transport_rx_count").text(stats_the_latest.node.transport.rx_count);
                            $("#transport_tx_count").text(stats_the_latest.node.transport.tx_count);
                        } else {
                            chart_transport_txrx = bigdesk_charts.not_available.chart(chart_transport_txrx.svg());
                            $("#transport_rx_size").text("n/a");
                            $("#transport_tx_size").text("n/a");
                            $("#transport_rx_count").text("n/a");
                            $("#transport_tx_count").text("n/a");
                        }
                    });

                    // --------------------------------------------
                    // File system:

                    _.defer(function(){
                        if (stats_the_latest && stats_the_latest.node && stats_the_latest.node.fs && stats_the_latest.node.fs.data && stats_the_latest.node.fs.data.length > 0) {

                            var fs_section = $("#FileSystemSection");
                            var _fs_data_info = $("#fs_data_info");
                            _fs_data_info.empty();

                            var keys = _.keys(stats_the_latest.node.fs.data).sort();

                            if (keys.length > 0) {
                                for (var i = 0; i < keys.length; i++) {

                                    var fs_data = stats_the_latest.node.fs.data[keys[i]];
                                    // we need to keep key value for mustache processing
                                    fs_data.key = [keys[i]];
                                    var _fd_element = $("#fd_data_"+keys[i]);

                                    if (_fd_element.length == 0) {

                                        // render the row
                                        var fsInfo = Mustache.render(templates.selectedClusterNode.fsDataInfoTemplate, fs_data);
                                        var fsInfo_cnt = Mustache.render(templates.selectedClusterNode.fsDataInfo_cntTemplate, fs_data);
                                        var fsInfo_size = Mustache.render(templates.selectedClusterNode.fsDataInfo_sizeTemplate, fs_data);

                                        var fsp_data = _view.make("p", {}, fsInfo);
                                        var fsp_charts = _view.make("p", {},
                                            "<div style='overflow: auto;'>" +
                                                "<svg width='100%' height='160'>" +
                                                    "<svg id='svg_fsChart_cnt_"+keys[i]+"' clip_id='clip_fsChart_cnt_"+keys[i]+"' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                                                    "<svg id='svg_fsChart_size_"+keys[i]+"' clip_id='clip_fsChart_size_"+keys[i]+"' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                                                "</svg>" +
                                                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + fsInfo_cnt + "</div>" +
                                                "<div width='46.5%' style='margin-left: 54%;'>" + fsInfo_size + "</div>" +
                                            "</div>"
                                        );

                                        var fsCol_data = _view.make("div", {"class":"sixcol"});
                                        var fsCol_charts = _view.make("div", {"class":"sixcol last"});

                                        var rowFsInfo = _view.make("div", {"class":"row nodeDetail", "id":"fd_data_" + keys[i]});

                                        $(rowFsInfo).append(fsCol_data, fsCol_charts);
                                        $(fsCol_data).append(fsp_data);
                                        $(fsCol_charts).append(fsp_charts);

                                        fs_section.after(rowFsInfo);

                                        charts_disk_reads_writes_cnt[keys[i]] = bigdesk_charts.disk_reads_writes_cnt.chart(d3.select("#svg_fsChart_cnt_"+keys[i]));
                                        charts_disk_reads_writes_size[keys[i]] = bigdesk_charts.disk_reads_writes_size.chart(d3.select("#svg_fsChart_size_"+keys[i]));
                                    }

                                    $("#fs_disk_free_"+keys[i]).text(fs_data.free);
                                    $("#fs_disk_available_"+keys[i]).text(fs_data.available);

                                    // sigar & AWS check
                                    if (fs_data.disk_writes != undefined && fs_data.disk_reads != undefined) {
                                        var read_cnt_delta = bigdesk_charts.disk_reads_writes_cnt.series1(stats, keys[i]);
                                        var write_cnt_delta = bigdesk_charts.disk_reads_writes_cnt.series2(stats, keys[i]);

                                        if ( read_cnt_delta.length > 1 && write_cnt_delta.length > 1 ) {

    //                                        delta(read_cnt_delta);
    //                                        delta(write_cnt_delta);
                                            normalizedDeltaToSeconds(read_cnt_delta);
                                            normalizedDeltaToSeconds(write_cnt_delta);

                                            try { charts_disk_reads_writes_cnt[keys[i]].animate(animatedCharts).update(read_cnt_delta, write_cnt_delta); } catch (ignore) {}
                                        }

                                        $("#fs_disk_writes_"+keys[i]).text(fs_data.disk_writes);
                                        $("#fs_disk_reads_"+keys[i]).text(fs_data.disk_reads);
                                    } else {
                                        charts_disk_reads_writes_cnt[keys[i]] = bigdesk_charts.not_available.chart(charts_disk_reads_writes_cnt[keys[i]].svg());
                                        $("#fs_disk_writes_"+keys[i]).text("n/a");
                                        $("#fs_disk_reads_"+keys[i]).text("n/a");
                                    }

                                    // sigar & AWS check
                                    if (fs_data.disk_write_size && fs_data.disk_read_size) {
                                        var read_size_delta = bigdesk_charts.disk_reads_writes_size.series1(stats, keys[i]);
                                        var write_size_delta = bigdesk_charts.disk_reads_writes_size.series2(stats, keys[i]);

                                        if ( read_size_delta.length > 1 && write_size_delta.length > 1 ) {

    //                                        delta(read_size_delta);
    //                                        delta(write_size_delta);
                                            normalizedDeltaToSeconds(read_size_delta);
                                            normalizedDeltaToSeconds(write_size_delta);

                                            try { charts_disk_reads_writes_size[keys[i]].animate(animatedCharts).update(read_size_delta, write_size_delta); } catch (ignore) {}
                                        }

                                        $("#fs_disk_write_size_"+keys[i]).text(fs_data.disk_write_size);
                                        $("#fs_disk_read_size_"+keys[i]).text(fs_data.disk_read_size);
                                    } else {
                                        charts_disk_reads_writes_size[keys[i]] = bigdesk_charts.not_available.chart(charts_disk_reads_writes_size[keys[i]].svg());
                                        $("#fs_disk_write_size_"+keys[i]).text("n/a");
                                        $("#fs_disk_read_size_"+keys[i]).text("n/a");
                                    }
                                }
                            } else {
                                // delete all fs info
                            }
                        } else {
                            $("#fs_data_info").text("No data info available");
                        }
                    });
                };

                // add custom listener for the collection to update UI and charts on changes
                nodesStatsCollection.on("nodesStatsUpdated", function(){
                    updateCharts();
                });

                // update charts right now, do not wait for the nearest execution
                // of update interval to show the charts to the user
                updateCharts();
            }
        });
    },

    renderNodeDetail: function(model) {

        // Node info
        var jsonModel = model.toJSON();

        var selectedNodeInfo = Mustache.render(templates.selectedClusterNode.selectedNodeInfoTemplate, jsonModel);

        var p1 = this.make("p", {}, selectedNodeInfo);
        var col1 = this.make("div", {"class":"twelvecol last"});
        var rowSelectedNode = this.make("div", {"class":"row nodeDetail"});

        $(rowSelectedNode).append(col1);
        $(col1).append(p1);

        // HTTP & Transport Title

        var transportTitleP = this.make("p", {}, "<h2>HTTP & Transport</h2>");
        var transportTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowTransportTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowTransportTitle).append(transportTitleCol);
        $(transportTitleCol).append(transportTitleP);

        // HTTP & Transport

        var channels = Mustache.render(templates.selectedClusterNode.channelsTemplate, {});
        var transportRxTx = Mustache.render(templates.selectedClusterNode.transportRxTx, {});

        var avgTransportCalcType = Mustache.render(templates.avgCalculationType, { id: "transport_avg_calc_type" });
        transportRxTx = transportRxTx.replace("<!--#-->", avgTransportCalcType);

        var selectedNodeHTTP = Mustache.render(templates.selectedClusterNode.selectedNodeHTTPTemplate, jsonModel);
        var selectedNodeTransport = Mustache.render(templates.selectedClusterNode.selectedNodeTransportTemplate, jsonModel);

        var desp1 = this.make("p", {}, selectedNodeHTTP);
        var desp2 = this.make("p", {}, selectedNodeTransport);
        var desp3 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_channels' clip_id='clip_channels' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_transport_txrx' clip_id='clip_transport_txrx' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>"+channels+"</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>"+transportRxTx+"</div>" +
            "</div>"
        );

        var desCol1 = this.make("div", {"class":"threecol"});
        var desCol2 = this.make("div", {"class":"threecol"});
        var desCol3 = this.make("div", {"class":"sixcol last"});

        var rowTransportCharts = this.make("div", {"class":"row nodeDetail"});
        $(rowTransportCharts).append(desCol1, desCol2, desCol3);
        $(desCol1).append(desp1);
        $(desCol2).append(desp2);
        $(desCol3).append(desp3);

        // JVM title

        var jvmTitleP = this.make("p", {}, "<h2>JVM</h2>");
        var jvmTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowJvmTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowJvmTitle).append(jvmTitleCol);
        $(jvmTitleCol).append(jvmTitleP);

        // JVM detail row

        var jvmInfo1 = Mustache.render(templates.selectedClusterNode.jvmInfoTemplate1, jsonModel.jvm);
        var jvmInfo2 = Mustache.render(templates.selectedClusterNode.jvmInfoTemplate2, jsonModel.jvm);

        var jvmp1 = this.make("p", {}, jvmInfo1);
        var jvmp2 = this.make("p", {}, jvmInfo2);

        var jvmCol1 = this.make("div", {"class":"fourcol"});
        var jvmCol2 = this.make("div", {"class":"eightcol last"});

        var rowJvmInfo = this.make("div", {"class":"row nodeDetail", "id":"jvmInfo"});

        $(rowJvmInfo).append(jvmCol1, jvmCol2);
        $(jvmCol1).append(jvmp1);
        $(jvmCol2).append(jvmp2);

        // JVM row for charts

        var jvmHeapMem = Mustache.render(templates.selectedClusterNode.jvmHeapMem, jsonModel);
        var jvmNonHeapMem = Mustache.render(templates.selectedClusterNode.jvmNonHeapMem, jsonModel);

        var jvmpCharts1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_jvmHeapMem' clip_id='clip_jvmHeapMem' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_jvmNonHeapMem' clip_id='clip_jvmNonHeapMem' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + jvmHeapMem + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + jvmNonHeapMem + "</div>" +
            "</div>"
        );

        var jvmThreads = Mustache.render(templates.selectedClusterNode.jvmThreads, jsonModel);
        var jvmGC = Mustache.render(templates.selectedClusterNode.jvmGC, jsonModel);

        var jvmpCharts2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_jvmThreads' clip_id='clip_jvmThreads' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_jvmGC' clip_id='clip_jvmGC' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + jvmThreads + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + jvmGC + "</div>" +
            "</div>"
        );

        var jvmColCharts1 = this.make("div", {"class":"sixcol"});
        var jvmColCharts2 = this.make("div", {"class":"sixcol last"});

        var rowJvmCharts = this.make("div", {"class":"row nodeDetail"});

        $(rowJvmCharts).append(jvmColCharts1, jvmColCharts2);
        $(jvmColCharts1).append(jvmpCharts1);
        $(jvmColCharts2).append(jvmpCharts2);

        // ThreadPool title

        var tpTitleP = this.make("p", {}, "<h2>Thread Pools</h2>");
        var tpTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowtpTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowtpTitle).append(tpTitleCol);
        $(tpTitleCol).append(tpTitleP);

		// Threadpool row for charts

        var tpSearch = Mustache.render(templates.selectedClusterNode.threadPoolSearch, jsonModel);
        var tpIndex = Mustache.render(templates.selectedClusterNode.threadPoolIndex, jsonModel);

        var tppCharts1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_threadpoolSearch' clip_id='clip_threadpoolSearch' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_threadpoolIndex' clip_id='clip_threadpoolIndex' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + tpSearch + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + tpIndex + "</div>" +
            "</div>"
        );

		var tpBulk = Mustache.render(templates.selectedClusterNode.threadPoolBulk, jsonModel);
        var tpRefresh = Mustache.render(templates.selectedClusterNode.threadPoolRefresh, jsonModel);

        var tppCharts2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_threadpoolBulk' clip_id='clip_threadpoolBulk' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_threadpoolRefresh' clip_id='clip_threadpoolRefresh' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + tpBulk + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + tpRefresh + "</div>" +
            "</div>"
        );

        var tpColCharts1 = this.make("div", {"class":"sixcol"});
        var tpColCharts2 = this.make("div", {"class":"sixcol last"});

        var rowTpCharts = this.make("div", {"class":"row nodeDetail"});

        $(rowTpCharts).append(tpColCharts1, tpColCharts2);
        $(tpColCharts1).append(tppCharts1);
        $(tpColCharts2).append(tppCharts2);

        // OS title

        var osTitleP = this.make("p", {}, "<h2>OS</h2>");
        var osTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowOsTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowOsTitle).append(osTitleCol);
        $(osTitleCol).append(osTitleP);

        // OS detail row

        var osInfo1 = Mustache.render(templates.selectedClusterNode.osInfoTemplate1, jsonModel.os);
        var osInfo2 = Mustache.render(templates.selectedClusterNode.osInfoTemplate2, jsonModel.os);

        var osp1 = this.make("p", {}, osInfo1);
        var osp2 = this.make("p", {}, osInfo2 );

        var osCol1 = this.make("div", {"class":"fourcol"});
        var osCol2 = this.make("div", {"class":"eightcol last"});

        var rowOSInfo = this.make("div", {"class":"row nodeDetail", "id":"osInfo"});

        $(rowOSInfo).append(osCol1, osCol2);
        $(osCol1).append(osp1);
        $(osCol2).append(osp2);

        // OS row for charts

        var osCpu = Mustache.render(templates.selectedClusterNode.osCpu, jsonModel);
        var osMem = Mustache.render(templates.selectedClusterNode.osMem, jsonModel);

        var osCharts1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_osCpu' clip_id='clip_osCpu' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_osMem' clip_id='clip_osMem' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + osCpu + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + osMem + "</div>" +
            "</div>"
        );

        var osSwap = Mustache.render(templates.selectedClusterNode.osSwap, jsonModel);
        var osLoad = Mustache.render(templates.selectedClusterNode.osLoad, jsonModel);

        var osCharts2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_osSwap' clip_id='clip_osSwap' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_osLoadAvg' clip_id='clip_osLoadAvg' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + osSwap + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + osLoad + "</div>" +
            "</div>"
        );

        var osColCharts1 = this.make("div", {"class":"sixcol"});
        var osColCharts2 = this.make("div", {"class":"sixcol last"});

        var rowOsCharts = this.make("div", {"class":"row nodeDetail"});

        $(rowOsCharts).append(osColCharts1, osColCharts2);
        $(osColCharts1).append(osCharts1);
        $(osColCharts2).append(osCharts2);

        // Process title

        var processTitleP = this.make("p", {}, "<h2>Process</h2>");
        var processTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowProcessTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowProcessTitle).append(processTitleCol);
        $(processTitleCol).append(processTitleP);

        // Process chart row

        var fileDescriptors = Mustache.render(templates.selectedClusterNode.fileDescriptorsTemplate, jsonModel);
        var processMem = Mustache.render(templates.selectedClusterNode.process_MemTemplate, jsonModel);

        var processCharts1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_fileDescriptors' clip_id='clip_fileDescriptors' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_processMem' clip_id='clip_processMem' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + fileDescriptors + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + processMem + "</div>" +
            "</div>"
        );

        var processCPU_time = Mustache.render(templates.selectedClusterNode.process_CPU_timeTemplate, jsonModel);
        var processCPU_pct = Mustache.render(templates.selectedClusterNode.process_CPU_pctTemplate, jsonModel);

        var avgProcessTimeCalcType = Mustache.render(templates.avgCalculationType, { id: "process_time_avg_calc_type" });
        processCPU_time = processCPU_time.replace("<!--#-->", avgProcessTimeCalcType);

        var processCharts2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_processCPU_time' clip_id='clip_processCPU_time' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_processCPU_pct' clip_id='clip_processCPU_pct' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + processCPU_time + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + processCPU_pct + "</div>" +
            "</div>"
        );

        var processColCharts1 = this.make("div", {"class":"sixcol"});
        var processColCharts2 = this.make("div", {"class":"sixcol last"});
        var rowProcessCharts = this.make("div", {"class":"row nodeDetail"});

        $(rowProcessCharts).append(processColCharts1, processColCharts2);
        $(processColCharts1).append(processCharts1);
        $(processColCharts2).append(processCharts2);

        // Indices title

        var indicesTitleP = this.make("p", {}, "<h2>Indices</h2>");
        var indicesTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowIndicesTitle = this.make("div", {"class":"row nodeDetail newSection"});

        $(rowIndicesTitle).append(indicesTitleCol);
        $(indicesTitleCol).append(indicesTitleP);

        // Indices info row

        var indicesInfo1 = Mustache.render(templates.selectedClusterNode.indices1Template1, {});
        var indicesInfo2 = Mustache.render(templates.selectedClusterNode.indices1Template2, {});
        var indicesInfo3 = Mustache.render(templates.selectedClusterNode.indices1Template3, {});
        var indicesInfoP1 = this.make("p", {}, indicesInfo1);
        var indicesInfoP2 = this.make("p", {}, indicesInfo2);
        var indicesInfoP3 = this.make("p", {}, indicesInfo3);

        var indicesInfoCol1 = this.make("div", {"class":"threecol"});
        var indicesInfoCol2 = this.make("div", {"class":"threecol"});
        var indicesInfoCol3 = this.make("div", {"class":"sixcol last"});

        var rowIndicesInfo = this.make("div", {"class":"row nodeDetail"});

        $(rowIndicesInfo).append(indicesInfoCol1, indicesInfoCol2, indicesInfoCol3);
        $(indicesInfoCol1).append(indicesInfoP1);
        $(indicesInfoCol2).append(indicesInfoP2);
        $(indicesInfoCol3).append(indicesInfoP3);

        // Indices charts row #1

        var indicesSearchReqs = Mustache.render(templates.selectedClusterNode.indicesSearchReqsTemplate, jsonModel);
        var indicesSearchTime = Mustache.render(templates.selectedClusterNode.indicesSearchTimeTemplate, jsonModel);

        var indicesCharts1p1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_indicesSearchReqs' clip_id='clip_indicesSearchReqs' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_indicesSearchTime' clip_id='clip_indicesSearchTime' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + indicesSearchReqs + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + indicesSearchTime + "</div>" +
            "</div>"
        );

        var indicesGetReqs = Mustache.render(templates.selectedClusterNode.indicesGetReqsTemplate, jsonModel);
        var indicesGetTime = Mustache.render(templates.selectedClusterNode.indicesGetTimeTemplate, jsonModel);

        var indicesCharts1p2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_indicesGetReqs' clip_id='clip_indicesGetReqs' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_indicesGetTime' clip_id='clip_indicesGetTime' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + indicesGetReqs + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + indicesGetTime + "</div>" +
            "</div>"
        );

        var indicesCharts1Col1 = this.make("div", {"class":"sixcol"});
        var indicesCharts1Col2 = this.make("div", {"class":"sixcol last"});

        var rowIndicesCharts1 = this.make("div", {"class":"row nodeDetail"});
        $(rowIndicesCharts1).append(indicesCharts1Col1, indicesCharts1Col2);
        $(indicesCharts1Col1).append(indicesCharts1p1);
        $(indicesCharts1Col2).append(indicesCharts1p2);

        // Indices charts row #2

        var indicesCacheSize = Mustache.render(templates.selectedClusterNode.indicesCacheSizeTemplate, jsonModel);
        var indicesCacheEvictions = Mustache.render(templates.selectedClusterNode.indicesCacheEvictionsTemplate, jsonModel);

        var indicesCharts2p1 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_indicesCacheSize' clip_id='clip_indicesCacheSize' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_indicesCacheEvictions' clip_id='clip_indicesCacheEvictions' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + indicesCacheSize + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + indicesCacheEvictions + "</div>" +
            "</div>"
        );

        var indicesIndexingReqs = Mustache.render(templates.selectedClusterNode.indicesIndexingReqsTemplate, jsonModel);
        var indicesIndexingTime = Mustache.render(templates.selectedClusterNode.indicesIndexingTimeTemplate, jsonModel);

        var indicesCharts2p2 = this.make("p", {},
            "<div style='overflow: auto;'>" +
                "<svg width='100%' height='160'>" +
                    "<svg id='svg_indicesIndexingReqs' clip_id='clip_indicesIndexingReqs' width='46.5%' height='100%' x='0' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                    "<svg id='svg_indicesIndexingTime' clip_id='clip_indicesIndexingTime' width='46.5%' height='100%' x='54%' y='0' preserveAspectRatio='xMinYMid' viewBox='0 0 270 160'/>" +
                "</svg>" +
                "<div width='46.5%' style='margin-left: 0%; float: left;'>" + indicesIndexingReqs + "</div>" +
                "<div width='46.5%' style='margin-left: 54%;'>" + indicesIndexingTime + "</div>" +
            "</div>"
        );

        var indicesCharts2Col1 = this.make("div", {"class":"sixcol"});
        var indicesCharts2Col2 = this.make("div", {"class":"sixcol last"});

        var rowIndicesCharts2 = this.make("div", {"class":"row nodeDetail"});
        $(rowIndicesCharts2).append(indicesCharts2Col1, indicesCharts2Col2);
        $(indicesCharts2Col1).append(indicesCharts2p1);
        $(indicesCharts2Col2).append(indicesCharts2p2);

        // File system title

        var fsTitleP = this.make("p", {}, "<h2>File system</h2>");
        var fsTitleCol = this.make("div", {"class":"twelvecol last"});
        var rowFsTitle = this.make("div", {"class":"row nodeDetail newSection", "id":"FileSystemSection"});

        $(rowFsTitle).append(fsTitleCol);
        $(fsTitleCol).append(fsTitleP);

        this.$el.parent().append(

            rowSelectedNode,

            rowJvmTitle,
            rowJvmInfo,
            rowJvmCharts,

			rowtpTitle,
			rowTpCharts,

            rowOsTitle,
            rowOSInfo,
            rowOsCharts,

            rowProcessTitle,
            rowProcessCharts,

            rowTransportTitle,
            rowTransportCharts,

            rowIndicesTitle,
            rowIndicesInfo,
            rowIndicesCharts1,
            rowIndicesCharts2,

            rowFsTitle

        );
    },

    clear: function() {
        this.$el.parent().find("div.row.nodeDetail").remove();

    },

    destroy: function() {

        // remove custom listeners first
        var nodesStatsCollection = this.model.get("nodesStats");
        nodesStatsCollection.off("nodesStatsUpdated");

        this.clear();
        this.undelegateEvents();
    }
});
