(function () {
    'use strict';

    angular
        .module('guiapp.services')
        .factory('configuration', LocalStorageService);

    LocalStorageService.$inject = ['$rootScope', 'localStorage', '$location'];

    function LocalStorageService($rootScope, localStorage, $location) {
        var LOCAL_STORAGE_ID = 'es-config';

        var configuration = {};

        var service = {
            configuration: configuration,
            loadConfiguration: loadConfiguration,
            changeConfiguration: changeConfiguration
        };

        return service;

        function loadConfiguration() {
            var configurationString = localStorage[LOCAL_STORAGE_ID];
            if (configurationString) {
                doChangeConfiguration(JSON.parse(configurationString));
            } else {
                var host;
                if ($location.host() == 'www.gridshore.nl') {
                    host = "http://localhost:9200";
                } else {
                    host = $location.protocol() + "://" + $location.host() + ":" + $location.port();
                }

                doChangeConfiguration({
                    title: undefined,
                    description: undefined,
                    excludedIndexes: undefined,
                    includedIndexes: undefined,
                    serverUrl: host
                });
            }
        }

        function changeConfiguration(configuration) {
            doChangeConfiguration(configuration);
            localStorage[LOCAL_STORAGE_ID] = JSON.stringify(service.configuration);
        }

        function doChangeConfiguration(configuration) {
            if (configuration.title && configuration.title.length > 0) {
                service.configuration.title = configuration.title;
            }
            if (configuration.description && configuration.description.length > 0) {
                service.configuration.description = configuration.description;
            }
            if (configuration.excludedIndexes && configuration.excludedIndexes.length > 0) {
                service.configuration.excludedIndexes = configuration.excludedIndexes;
            }
            if (configuration.includedIndexes && configuration.includedIndexes.length > 0) {
                service.configuration.includedIndexes = configuration.includedIndexes;
            }
            if (configuration.serverUrl && configuration.serverUrl.length > 0) {
                service.configuration.serverUrl = configuration.serverUrl;
            }
        }
    }
})();
