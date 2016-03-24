(function () {
    'use strict';

    angular.module('guiapp')
        .controller('WhereShardsCtrl', WhereShardsCtrl);

    WhereShardsCtrl.$inject = ['$timeout', 'elastic'];

    function WhereShardsCtrl($timeout, elastic) {
        var vm = this;
        vm.shardsInfo = {};
        vm.nodeInfo = {};

        activate();

        function activate() {
            obtainShardsInfo();
        }

        function obtainShardsInfo() {
            elastic.obtainShards(function (nodeInfo, data) {
                var nodes = {};
                angular.forEach(data, function (shards, indexName) {
                    angular.forEach(shards.shards, function (shardArray, shardKey) {
                        angular.forEach(shardArray, function (shard) {
                            var desc;
                            if (shard.primary) {
                                desc = " (P)";
                            } else {
                                desc = " (R)";
                            }
                            if (!nodes[shard.node]) {
                                nodes[shard.node] = {};
                            }
                            if (!nodes[shard.node][indexName]) {
                                nodes[shard.node][indexName] = [];
                            }
                            nodes[shard.node][indexName].push(shard.shard + desc)
                        });
                    });
                });
                vm.nodeInfo = nodeInfo;
                vm.shardsInfo = nodes;
            });
            $timeout(function () {
                obtainShardsInfo();
            }, 5000);
        }
    }
})();
