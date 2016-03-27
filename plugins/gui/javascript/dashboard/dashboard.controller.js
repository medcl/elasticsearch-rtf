(function () {
    'use strict';

    angular
        .module('guiapp.dashboard')
        .controller('DashboardCtrl', DashboardController);

    DashboardController.$inject = ['$scope','elastic','$modal','indexService'];

    function DashboardController($scope,elastic, $modal, indexService) {
        var vm = this;
        vm.health = {};
        vm.nodes = [];
        vm.plugins = [];
        vm.serverUrl = "";

        vm.closeIndex = closeIndex;
        vm.openIndex = openIndex;
        vm.openChangeReplicas = openChangereplicas;
        vm.removeIndex = removeIndex;

        // TODO jettro: replace with initialisation code according to guideline
        $scope.$on('$viewContentLoaded', function () {
            indexDetails();
            refreshData();
        });

        // Implementations
        function closeIndex(index) {
            elastic.closeIndex(index, function () {
                indexDetails();
            });
        }

        function openIndex (index) {
            elastic.openIndex(index, function () {
                indexDetails();
            });
        }

        function openChangereplicas(index) {
            // TODO jettro: I think this is wrong, need to use a setter function.
            indexService.name = index.name;
            if (!isNaN(parseInt(index.numReplicas)) && isFinite(index.numReplicas)) {
                indexService.numReplicas = parseInt(index.numReplicas);
            }

            var opts = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                templateUrl: 'template/dialog/numreplicas.html',
                controller: 'ChangeNumReplicasCtrl',
                controllerAs: 'cnrVm',
                resolve: {
                    fields: function () {
                        return angular.copy(indexService);
                    }
                }
            };
            var modalInstance = $modal.open(opts);
            modalInstance.result.then(function (result) {
                if (result) {
                    elastic.changeReplicas(result.name, result.numReplicas, function () {
                        indexDetails();
                    });
                }
            }, function () {
                // Nothing to do here
            });
        }

        function removeIndex(index) {
            elastic.removeIndex(index, function () {
                indexDetails();
            });
        }

        function indexDetails() {
            elastic.indexesDetails(function (data) {
                vm.indices = data;
            });
        }

        function refreshData() {
            vm.serverUrl = elastic.obtainServerAddress();

            elastic.clusterHealth(function (data) {
                vm.health = data;
            });

            elastic.clusterNodes(function (data) {
                vm.nodes = data;
            });
        }

    }
})();