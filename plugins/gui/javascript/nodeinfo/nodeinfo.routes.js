(function() {
    'use strict';
    angular
        .module('guiapp.nodeinfo')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/node/:nodeId', {
                templateUrl: 'partials/node.html',
                controller: 'NodeInfoCtrl',
                controllerAs: 'vm'
            });
    }
})();