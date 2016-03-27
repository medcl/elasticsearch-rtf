(function () {
    'use strict';
    angular
        .module('guiapp.navbar')
        .controller('NavbarCtrl', NavbarCtrl);

    NavbarCtrl.$inject = ['$timeout', '$modal', 'elastic', 'configuration'];


    function NavbarCtrl($timeout, $modal, elastic, configuration) {
        var vm = this;
        vm.statusCluster = {};
        vm.serverUrl = elastic.obtainServerAddress();
        vm.configureServerUrl = false;
        vm.configure = configuration;

        var items = [];

        vm.addItem = addItem;
        vm.changeServerUrl = changeServerUrl;
        vm.initNavbar = initNavbar;
        vm.openDialog = openDialog;
        vm.select = select;
        vm.selectByUrl = selectByUrl;

        doCheckStatus();

        function addItem(item) {
            items.push(item);
        }

        function select(item) {
            angular.forEach(items, function (item) {
                item.selected = false;
            });
            item.selected = true;
        }

        function selectByUrl(url) {
            angular.forEach(items, function (item) {
                if (item.link == url.split("/")[1]) {
                    select(item);
                }
            });
        }

        function changeServerUrl() {
            elastic.changeServerAddress(vm.serverUrl);
            configuration.excludedIndexes = vm.configure.excludedIndexes;
        }

        function initNavbar() {
            doCheckStatus();
        }

        function openDialog() {
            var opts = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                templateUrl: 'template/dialog/config.html',
                controller: 'ConfigDialogCtrl',
                controllerAs: 'confVm',
                resolve: {fields: function () {
                    return angular.copy(configuration);
                } }};
            var modalInstance = $modal.open(opts);
            modalInstance.result.then(function (result) {
                if (result) {
                    elastic.changeServerAddress(result.serverUrl);
                    configuration.changeConfiguration(angular.copy(result));
                }
            }, function () {
                // Nothing to do here
            });
        }

        function doCheckStatus() {
            elastic.clusterStatus(function (message, status) {
                vm.statusCluster.message = message;
                vm.statusCluster.state = status;
            });
            $timeout(function () {
                doCheckStatus();
            }, 5000); // wait 5 seconds before calling it again
        }
    }
})();