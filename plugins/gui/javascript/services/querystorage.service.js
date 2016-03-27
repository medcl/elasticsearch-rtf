(function() {
    'use strict';

    angular
    .module('guiapp.services')
    .factory('queryStorage', QueryStorage);

    QueryStorage.$inject=['localStorage'];

    function QueryStorage(localStorage) {
        var LOCAL_STORAGE_ID_QUERY = 'es-query';
        var LOCAL_STORAGE_ID_SEARCH = 'es-search';

        var service = {
            loadQuery: loadQuery,
            saveQuery: saveQuery,
            loadSearch: loadSearch,
            saveSearch: saveSearch
        };

        return service;

        function loadQuery (callback) {
            var query = localStorage[LOCAL_STORAGE_ID_QUERY];
            callback(JSON.parse(query));
        }

        function saveQuery(query) {
            localStorage[LOCAL_STORAGE_ID_QUERY] = JSON.stringify(query);
        }

        function loadSearch (callback) {
            var search = localStorage[LOCAL_STORAGE_ID_SEARCH];
            callback(JSON.parse(search));
        }

        function saveSearch(search) {
            localStorage[LOCAL_STORAGE_ID_SEARCH] = JSON.stringify(search);
        }
    }

})();
