(function() {
    'use strict';

    angular
        .module('guiapp.services')
        .factory('IKWORDNIETGEBRUIKT', ServerConfig);

    ServerConfig.$inject = ['$location'];

    function ServerConfig(location) {
        var service = {
            host:"",
            initHost: initHost
        };
        return service;

        function initHost() {
            if (location.host() == 'www.gridshore.nl') {
                service.host = "http://localhost:9200";
            } else {
                service.host = location.protocol() + "://" + location.host() + ":" + location.port();
            }
        }
    }

})();
