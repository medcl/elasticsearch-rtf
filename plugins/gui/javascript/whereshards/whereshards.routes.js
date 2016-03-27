(function() {
    'use strict';
    angular
        .module('guiapp.whereshards')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/tools/whereareshards', {
                templateUrl: 'partials/whereareshards.html',
                controller: 'WhereShardsCtrl',
                controllerAs: 'vm'
            });
    }
})();