(function() {
    'use strict';

    angular
        .module('guiapp')
        .config(ExceptionConfig);

    ExceptionConfig.$inject = ['$provide'];

    function ExceptionConfig($provide) {
        $provide.decorator('$exceptionHandler', ExtendExceptionHandler);
    }

    ExtendExceptionHandler.$inject = ['$delegate','$log'];

    function ExtendExceptionHandler($delegate,$log) {
        return function(exception, cause) {
            $delegate(exception, cause);
            var errorData = {
                exception: exception,
                cause: cause
            };

            $log.error(exception.msg);
        };
    }
})();