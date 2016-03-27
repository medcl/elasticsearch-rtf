(function() {
    'use strict';
    angular
        .module('guiapp.graph')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/graph', {
                templateUrl: 'partials/graph.html',
                controller: 'GraphCtrl',
                controllerAs: 'vm'
            });
    }
})();
