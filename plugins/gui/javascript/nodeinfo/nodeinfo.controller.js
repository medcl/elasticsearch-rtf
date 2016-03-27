(function () {
    'use strict';

    angular
        .module('guiapp.nodeinfo')
        .controller('NodeInfoCtrl', NodeInfoCtrl);

    NodeInfoCtrl.$inject = ['elastic', '$routeParams'];

    function NodeInfoCtrl(elastic, $routeParams) {
        var vm = this;

        var nodeId = $routeParams.nodeId;

        activate();

        function activate() {
            elastic.nodeInfo(nodeId, function (data) {
                vm.nodes = data;
            });
        }
    }
})();
