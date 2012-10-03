var bigdesk_charts = {
    default: {
        width: 270,
        height: 160
    }
};

bigdesk_charts.not_available = {

    chart: function(element) {
        return chartNotAvailable()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .svg(element).show();
    }
};

bigdesk_charts.fileDescriptors = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "File Descriptors",
                series1: "Open",
                series2: "Max",
                margin_left: 5,
                margin_bottom: 6,
                width: 60})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.open_file_descriptors
            }
        })
    }
};

bigdesk_charts.channels = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Channels",
                series1: "HTTP",
                series2: "Transport",
                margin_left: 5,
                margin_bottom: 6,
                width: 80})
            .svg(element);
    },

    series1: function(stats){
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.http.current_open
            }
        })
    },

    series2: function(stats){
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.transport.server_open
            }
        })
    }
};

bigdesk_charts.jvmThreads = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Threads",
                series1: "Count",
                series2: "Peak",
                margin_left: 5,
                margin_bottom: 6,
                width: 60})
            .svg(element);
    },

    series1: function(stats){
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.threads.count
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.threads.peak_count
            }
        })
    }
};

bigdesk_charts.jvmHeapMem = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Heap Mem",
                series1: "Used",
                series2: "Committed",
                margin_left: 5,
                margin_bottom: 6,
                width: 85})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.mem.heap_used_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.mem.heap_committed_in_bytes
            }
        })
    }
};

bigdesk_charts.jvmNonHeapMem = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Non-Heap Mem",
                series1: "Used",
                series2: "Committed",
                margin_left: 5,
                margin_bottom: 6,
                width: 85})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.mem.non_heap_used_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.mem.non_heap_committed_in_bytes
            }
        })
    }
};

bigdesk_charts.jvmGC = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "GC (Δ)",
                series1: "Count",
                series2: "Time (sec)",
                margin_left: 5,
                margin_bottom: 6,
                width: 85})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.gc.collection_count
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.jvm.timestamp,
                value: +snapshot.node.jvm.gc.collection_time_in_millis / 1000
            }
        })
    }
};

bigdesk_charts.osCpu = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "CPU (%)",
                series1: "Sys",
                series2: "User",
                margin_left: 5,
                margin_bottom: 6,
                width: 55})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: +snapshot.node.os.cpu.sys
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: (+snapshot.node.os.cpu.user + +snapshot.node.os.cpu.sys)
            }
        })
    },

    series3: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: 100
            }
        })
    }
};

bigdesk_charts.osMem = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Mem",
                series1: "Used",
                series2: "Free",
                margin_left: 5,
                margin_bottom: 6,
                width: 55})
            .svg(element);
    },

    series1: function(stats) {
        return  stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: +snapshot.node.os.mem.actual_used_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: ((+snapshot.node.os.mem.actual_free_in_bytes) + (+snapshot.node.os.mem.actual_used_in_bytes))
            }
        })
    }
};

bigdesk_charts.osSwap = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Swap",
                series1: "Used",
                series2: "Free",
                margin_left: 5,
                margin_bottom: 6,
                width: 55})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value:
                    // https://github.com/elasticsearch/elasticsearch/issues/1804
                    snapshot.node.os.swap.used_in_bytes == undefined ? 0 :
                        +snapshot.node.os.swap.used_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: +snapshot.node.os.swap.free_in_bytes +
                    // https://github.com/elasticsearch/elasticsearch/issues/1804
                    ( snapshot.node.os.swap.used_in_bytes == undefined ? 0 :
                        +snapshot.node.os.swap.used_in_bytes )
            }
        })
    }
};

bigdesk_charts.osLoadAvg = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Load Average",
                series1: "0",
                series2: "1",
                series3: "2",
                margin_left: 5,
                margin_bottom: 6,
                width: 40})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: + snapshot.node.os.load_average["0"]
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: + snapshot.node.os.load_average["1"]
            }
        })
    },

    series3: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.os.timestamp,
                value: + snapshot.node.os.load_average["2"]
            }
        })
    }
};

bigdesk_charts.indicesSearchReqs = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Search requests per second (Δ)",
                series1: "Fetch",
                series2: "Query",
                margin_left: 5,
                margin_bottom: 6,
                width: 60})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.search.fetch_total
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.search.query_total
            }
        })
    }
};

bigdesk_charts.indicesSearchTime = {

    chart: function(element) {
        return  timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Search time per second (Δ)",
                series1: "Fetch",
                series2: "Query",
                margin_left: 5,
                margin_bottom: 6,
                width: 60})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.search.fetch_time_in_millis
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.search.query_time_in_millis
            }
        })
    }
};

bigdesk_charts.indicesGetReqs = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Get requests per second (Δ)",
                series1: "Missing",
                series2: "Exists",
                series3: "Get",
                margin_left: 5,
                margin_bottom: 6,
                width: 65})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.total
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.missing_total
            }
        })
    },

    series3: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.exists_total
            }
        })
    }
};

bigdesk_charts.indicesGetTime = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Get time per second (Δ)",
                series1: "Missing",
                series2: "Exists",
                series3: "Get",
                margin_left: 5,
                margin_bottom: 6,
                width: 65})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.time_in_millis
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.missing_time_in_millis
            }
        })
    },

    series3: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.get.exists_time_in_millis
            }
        })
    }
};

bigdesk_charts.indicesIndexingReqs = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Indexing requests per second (Δ)",
                series1: "Index",
                series2: "Delete",
                margin_left: 5,
                margin_bottom: 6,
                width: 65})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.indexing.index_total
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.indexing.delete_total
            }
        })
    }
};

bigdesk_charts.indicesIndexingTime = {
    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Indexing time per second (Δ)",
                series1: "Index",
                series2: "Delete",
                margin_left: 5,
                margin_bottom: 6,
                width: 65})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.indexing.index_time_in_millis
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.indexing.delete_time_in_millis
            }
        })
    }
};

bigdesk_charts.indicesCacheSize = {
    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Cache size",
                series1: "Field",
                series2: "Filter",
                margin_left: 5,
                margin_bottom: 6,
                width: 65
            })
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.cache.field_size_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.cache.filter_size_in_bytes
            }
        })
    }
};

bigdesk_charts.indicesCacheEvictions = {
    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Cache evictions (Δ)",
                series1: "Field",
                series2: "Filter",
                margin_left: 5,
                margin_bottom: 6,
                width: 65
            })
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.cache.field_evictions
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.indices.cache.filter_evictions
            }
        })
    }
};

bigdesk_charts.processCPU_time = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "CPU time (Δ)",
                series1: "User",
                series2: "Sys",
                margin_left: 5,
                margin_bottom: 6,
                width: 45})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.cpu.user_in_millis
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.cpu.sys_in_millis
            }
        })
    }
};

bigdesk_charts.processCPU_pct = {

    chart: function(element, series2_label) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "CPU (%)",
                series1: "process",
                series2: series2_label,
                margin_left: 5,
                margin_bottom: 6,
                width: 65})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.cpu.percent
            }
        })
    }

};

bigdesk_charts.processMem = {

    chart: function(element) {
        return timeAreaChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Mem",
                series1: "share",
                series2: "resident",
                series3: "total virtual",
                margin_left: 5,
                margin_bottom: 6,
                width: 100})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.mem.share_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.mem.resident_in_bytes
            }
        })
    },

    series3: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.process.timestamp,
                value: +snapshot.node.process.mem.total_virtual_in_bytes
            }
        })
    }
};

bigdesk_charts.transport_txrx = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Transport size (Δ)",
                series1: "Tx",
                series2: "Rx",
                margin_left: 5,
                margin_bottom: 6,
                width: 40})
            .svg(element);
    },

    series1: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.transport.tx_size_in_bytes
            }
        })
    },

    series2: function(stats) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.id,
                value: +snapshot.node.transport.rx_size_in_bytes
            }
        })
    }
};

bigdesk_charts.disk_reads_writes_cnt = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "# of Reads & Writes (Δ)",
                series1: "Reads",
                series2: "Writes",
                margin_left: 5,
                margin_bottom: 6,
                width: 70})
            .svg(element);
    },

    series1: function(stats, fs_key) {
        return  stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.fs.timestamp,
                value: +snapshot.node.fs.data[fs_key].disk_reads
            }
        })
    },

    series2: function(stats, fs_key) {
        return  stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.fs.timestamp,
                value: +snapshot.node.fs.data[fs_key].disk_writes
            }
        })
    }
};

bigdesk_charts.disk_reads_writes_size = {

    chart: function(element) {
        return timeSeriesChart()
            .width(bigdesk_charts.default.width).height(bigdesk_charts.default.height)
            .legend({
                caption: "Read & Write size (Δ)",
                series1: "Read",
                series2: "Write",
                margin_left: 5,
                margin_bottom: 6,
                width: 70})
            .svg(element);
    },

    series1: function(stats, fs_key) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.fs.timestamp,
                value: +snapshot.node.fs.data[fs_key].disk_read_size_in_bytes
            }
        })
    },

    series2: function(stats, fs_key) {
        return stats.map(function(snapshot){
            return {
                timestamp: +snapshot.node.fs.timestamp,
                value: +snapshot.node.fs.data[fs_key].disk_write_size_in_bytes
            }
        })
    }
};