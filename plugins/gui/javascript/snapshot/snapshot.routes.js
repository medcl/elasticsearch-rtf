(function() {
    'use strict';
    angular
        .module('guiapp.snapshot')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/tools/snapshots', {
                templateUrl: 'partials/snapshots.html',
                controller: 'SnapshotCtrl',
                controllerAs: 'vm'
            });
    }
})();