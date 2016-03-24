(function() {
    'use strict';
    angular
        .module('guiapp.search')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/search', {
                templateUrl: 'partials/search.html',
                controller: 'SearchCtrl',
                controllerAs: 'vm'
            });
    }
})();