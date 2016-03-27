(function() {
    'use strict';
    angular
        .module('guiapp.monitoring')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/tools/monitoring', {
                templateUrl: 'partials/monitoring.html',
                controller: 'MonitoringCtrl',
                controllerAs: 'vm'
            });
    }
})();