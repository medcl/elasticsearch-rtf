(function() {
    'use strict';
        var guiapp = angular.module('guiapp',
            [
                'ngRoute',
                'guiapp.filters',
                'guiapp.directives',
                'ui.bootstrap',
                'elasticsearch',
                'gridshore.c3js.chart',
                'guiapp.services',
                'guiapp.dashboard',
                'guiapp.navbar',
                'guiapp.search',
                'guiapp.aggregatedialog',
                'guiapp.snapshot',
                'guiapp.nodeinfo',
                'guiapp.graph',
                'guiapp.inspect',
                'guiapp.monitoring',
                'guiapp.notification',
                'guiapp.suggestion',
                'guiapp.whereshards',
                'guiapp.query'
            ]);

    guiapp.config(['$routeProvider', function ($routeProvider) {
        $routeProvider.when('/about', {templateUrl: 'partials/about.html'});
        $routeProvider.otherwise({redirectTo: '/dashboard'});
    }]);

    guiapp.value('localStorage', window.localStorage);

    //guiapp.factory('$exceptionHandler',['$injector', function($injector) {
    //    return function(exception, cause) {
    //        console.log(exception);
    //        var errorHandling = $injector.get('errorHandling');
    //        errorHandling.add(exception.message);
    //        throw exception;
    //    };
    //}]);

})();