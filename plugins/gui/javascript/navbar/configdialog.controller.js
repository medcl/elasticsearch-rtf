(function () {
    'use strict';

    angular
        .module('guiapp.navbar')
        .controller('ConfigDialogCtrl', ConfigDialogCtrl);

    ConfigDialogCtrl.$inject = ['$modalInstance', 'configuration'];

    function ConfigDialogCtrl($modalInstance, configuration) {
        var confVm = this;
        confVm.configuration = {};
        confVm.close = close;

        activate();

        function activate() {
            confVm.configuration.serverUrl = configuration.configuration.serverUrl;
            confVm.configuration.excludedIndexes = configuration.configuration.excludedIndexes;
            confVm.configuration.includedIndexes = configuration.configuration.includedIndexes;
        }


        function close () {
            $modalInstance.close(confVm.configuration);
        }
    }
})();