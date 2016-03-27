(function() {
    'use strict';
    angular
        .module('guiapp.suggestion')
        .config(config);

    config.$inject = ['$routeProvider'];

    function config($routeProvider) {
        $routeProvider
            .when('/tools/suggestions', {
                templateUrl: 'partials/suggestions.html',
                controller: 'SuggestionCtrl',
                controllerAs: 'vm'
            });
    }
})();