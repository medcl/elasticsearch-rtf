(function () {
    'use strict';

    angular.module('guiapp.dashboard')
        .controller('ChangeNumReplicasCtrl', ChangeNumReplicasCtrl);

    ChangeNumReplicasCtrl.$inject = ['$modalInstance', 'indexService'];

    function ChangeNumReplicasCtrl($modalInstance, indexService) {
        var cnrVm = this;
        cnrVm.dialog = {
            "numReplicas": indexService.numReplicas,
            "name": indexService.name
        };

        cnrVm.close = close;

        function close (result) {
            $modalInstance.close(result);
        }

    }
})();