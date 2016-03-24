(function () {
    'use strict';

    angular
        .module('guiapp.snapshot')
        .controller('CreateSnapshotCtrl', CreateSnapshotCtrl);

    CreateSnapshotCtrl.$inject = ['$modalInstance'];

    function CreateSnapshotCtrl($modalInstance) {
        var csVm = this;
        csVm.dialog = {"includeGlobalState": true, "ignoreUnavailable": false};

        csVm.close = close;

        function close(result) {
            $modalInstance.close(result);
        }
    }
})();
