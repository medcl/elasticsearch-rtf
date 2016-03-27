(function () {
    'use strict';
    angular
        .module('guiapp.services')
        .factory('errorHandling', ErrorHandlingService);

    ErrorHandlingService.$inject = ['$rootScope'];

    function ErrorHandlingService($rootScope) {
        var service = {
            add: add
        };

        return service;

        // Implementations
        function add(message) {
            var errorMessage;
            if (message && typeof message === "object") {
                if (message.hasOwnProperty('message')) {
                    errorMessage = message.message;
                }
            } else {
                errorMessage = message;
            }
            $rootScope.$broadcast('msg:notification', 'error', errorMessage);
        }
    }
})();

