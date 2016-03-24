(function () {
    'use strict';

    angular
        .module('guiapp.snapshot')
        .controller('CreateSnapshotRepositoryCtrl', CreateSnapshotRepositoryCtrl);

    CreateSnapshotRepositoryCtrl.$inject = ['$modalInstance'];

    function CreateSnapshotRepositoryCtrl($modalInstance) {
        var csrVm = this;
        csrVm.dialog = {};

        csrVm.close = close;

        function close(result) {
            $modalInstance.close(result);
        }

    }
})();
