(function() {
    'use strict';
    angular
        .module('guiapp.query')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/query', {
                templateUrl: 'partials/query.html',
                controller: 'QueryCtrl',
                controllerAs: 'vm'
            });
    }
})();