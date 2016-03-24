(function() {
    'use strict';
    angular
        .module('guiapp.dashboard')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/dashboard', {
                templateUrl: 'partials/dashboard.html',
                controller: 'DashboardCtrl',
                controllerAs: 'vm'
            });
    }
})();
