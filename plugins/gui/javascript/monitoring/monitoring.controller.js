(function() {
    'use strict';

    angular.module('guiapp.monitoring')
        .controller('MonitoringCtrl', MonitoringCtrl);

    MonitoringCtrl.$inject = ['elastic', '$interval'];

    function MonitoringCtrl(elastic, $interval) {
        var vm = this;
        vm.dataNodes = [];
        vm.columnsNodes = [{"id": "num-nodes", "type": "line", "name": "Number of nodes"}];
        vm.datax = {"id": "x"};

        vm.dataShards = [];
        vm.columnsShards = [{"id": "num-shards-primary", "type": "line", "name": "Primary"},
            {"id": "num-shards-active", "type": "line", "name": "Active"},
            {"id": "num-shards-relocating", "type": "line", "name": "Relocating"},
            {"id": "num-shards-initializing", "type": "line", "name": "Initializing"},
            {"id": "num-shards-unassigned", "type": "line", "name": "Unassigned"}];
        vm.dataxShards = {"id": "xShards"};

        vm.numPoints = 10;
        vm.lengthDelay = 5000;

        var timerLoadNodes;
        vm.loadNodes = function () {
            timerLoadNodes = $interval(function () {
                elastic.clusterNodes(function (data) {
                    if (vm.dataNodes.length >= vm.numPoints) {
                        vm.dataNodes = vm.dataNodes.splice(1, vm.numPoints);
                    }
                    vm.dataNodes.push({"x": new Date(), "num-nodes": Object.keys(data).length});
                });

                elastic.clusterHealth(function (data) {
                    if (vm.dataShards.length >= vm.numPoints) {
                        vm.dataShards = vm.dataShards.splice(1, vm.numPoints);
                    }
                    vm.dataShards.push({
                        "xShards": new Date(),
                        "num-shards-primary": data.active_primary_shards,
                        "num-shards-active": data.active_shards,
                        "num-shards-relocating": data.relocating_shards,
                        "num-shards-initializing": data.initializing_shards,
                        "num-shards-unassigned": data.unassigned_shards
                    });
                });

            }, vm.lengthDelay);
        };

        vm.loadNodes();
        // TODO add stop function
    }
})();
