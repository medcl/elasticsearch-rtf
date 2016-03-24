(function() {
    'use strict';
    angular
        .module('guiapp.services', ['elasticsearch'])
        .value('version', '2.0.0')
        .run(runBlock);

    runBlock.$inject = ['configuration'];
    function runBlock(configuration) {
        configuration.loadConfiguration();
    }
})();
