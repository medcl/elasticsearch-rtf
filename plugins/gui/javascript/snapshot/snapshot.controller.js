(function () {
    'use strict';

    angular.module('guiapp.snapshot')
        .controller('SnapshotCtrl', SnapshotCtrl);

    SnapshotCtrl.$inject = ['$scope', 'elastic', '$modal'];

    function SnapshotCtrl($scope,elastic, $modal) {
        var vm = this;
        vm.repositories = [];
        vm.selectedRepository = "";
        vm.snapshots = [];
        vm.snapshotsStatus = false;

        vm.listSnapshots = listSnapshots;
        vm.selectRepository = selectRepository;
        vm.deleteRepository = deleteRepository;
        vm.listrepositories = listRepositories;
        vm.removeSnapshot = removeSnapshot;
        vm.removeSnapshotFromRepository = removeSnapshotFromRepository;
        vm.restoreSnapshot = restoreSnapshot;
        vm.openCreateSnapshot = openCreateSnapshot;
        vm.openCreateSnapshotRepository = openCreateSnapshotRepository;

        activate();

        $scope.$watch('vm.selectedRepository', function () {
            listSnapshots();
        });

        function activate() {
            listRepositories();
        }

        function listRepositories() {
            elastic.snapshotRepositories(function (data) {
                vm.repositories = data;
            });
        }

        function selectRepository(name) {
            vm.selectedRepository = name;
        }

        function deleteRepository(name) {
            elastic.deleteRepository(name, function (data) {
                if (vm.selectedRepository === name) {
                    vm.selectedRepository = "";
                }
                listRepositories();
            });
        }

        function listSnapshots() {
            if (vm.selectedRepository !== "") {
                elastic.obtainSnapshotStatus(function (snapshots) {
                    if (snapshots.length > 0) {
                        vm.snapshotsStatus = true;
                        vm.snapshots = snapshots;

                    } else {
                        elastic.obtainSnapshots(vm.selectedRepository, function (snapshots) {
                            vm.snapshotsStatus = false;
                            vm.snapshots = snapshots;
                        });
                    }
                });
            }
        }

        function removeSnapshot(snapshot) {
            elastic.removeSnapshot(vm.selectedRepository, snapshot, function () {
                listSnapshots();
            });
        }

        function removeSnapshotFromRepository(repository, snapshot) {
            elastic.removeSnapshot(repository, snapshot, function () {
                listSnapshots();
            });
        }

        function restoreSnapshot(snapshot) {
            elastic.restoreSnapshot(vm.selectedRepository, snapshot, function () {
                listSnapshots();
            });
        }

        function openCreateSnapshot() {
            var opts = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                templateUrl: 'template/dialog/createsnapshot.html',
                controller: 'CreateSnapshotCtrl',
                controllerAs: 'csVm'
            };
            var modalInstance = $modal.open(opts);
            modalInstance.result.then(function (result) {
                if (result) {
                    var newSnapshot = {};
                    newSnapshot.repository = vm.selectedRepository;
                    if (result.name) {
                        newSnapshot.snapshot = result.name;
                    } else {
                        var now = moment().format("YYYYMMDDHHmmss");
                        newSnapshot.snapshot = result.prefix + "-" + now;
                    }
                    newSnapshot.indices = result.indices;
                    newSnapshot.ignoreUnavailable = result.ignoreUnavailable;
                    newSnapshot.includeGlobalState = result.includeGlobalState;
                    elastic.createSnapshot(newSnapshot, function () {
                        listSnapshots();
                    });
                }
            }, function () {
                // Nothing to do here
            });
        }

        function openCreateSnapshotRepository() {
            var opts = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                templateUrl: 'template/dialog/createsnapshotrepository.html',
                controller: 'CreateSnapshotRepositoryCtrl',
                controllerAs: 'csrVm'
            };
            var modalInstance = $modal.open(opts);
            modalInstance.result.then(function (result) {
                if (result) {
                    elastic.createRepository(result, function () {
                        listRepositories();
                        vm.selectedRepository = "";
                    });
                }
            }, function () {
                // Nothing to do here
            });
        }
    }
})();
