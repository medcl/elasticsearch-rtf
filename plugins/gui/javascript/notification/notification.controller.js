(function () {
    'use strict';

    angular.module('guiapp.notification')
        .controller('NotificationCtrl', NotificationCtrl);

    NotificationCtrl.$inject = ['$rootScope', '$timeout'];

    function NotificationCtrl($rootScope, $timeout) {
        var vm = this;
        vm.alerts = {};

        $rootScope.$on('msg:notification', notify);


        function notify (event, type, message) {
            var id = Math.random().toString(36).substring(2, 5);
            vm.alerts[id] = {type: type, message: message};

            $timeout(function () {
                delete vm.alerts[id];
            }, 10000);
        }
    }

})();
