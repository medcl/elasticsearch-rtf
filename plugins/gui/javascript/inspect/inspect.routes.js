(function() {
    'use strict';
    angular
        .module('guiapp.inspect')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/inspect/:index/:type/:id', {
                templateUrl: 'partials/inspect.html',
                controller: 'InspectCtrl',
                controllerAs: 'vm'
            })
            .when('/inspect', {
                templateUrl: 'partials/inspect.html',
                controller: 'InspectCtrl',
                controllerAs: 'vm'
            });
    }
})();