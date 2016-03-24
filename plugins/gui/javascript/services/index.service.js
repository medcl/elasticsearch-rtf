(function () {
    'use strict';

    // TODO jettro: This feels so wrong to pass data between app and directive.

    angular
        .module('guiapp.services')
        .factory('indexService', IndexService);

    function IndexService() {
        return {
            name: "unknown",
            numreplicas: 0
        };
    }
})();
