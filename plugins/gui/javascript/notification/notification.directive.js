(function () {
    'use strict';

    angular.module('guiapp.notification')
        .directive('guiappnotification', notificationDirective);

    function notificationDirective() {
        var directive = {
            restrict: 'E',
            transclude: true,
            controller: 'NotificationCtrl',
            controllerAs: 'vm',
            templateUrl: 'template/notification/notification.html',
            replace: true
        };

        return directive;
    }

})();