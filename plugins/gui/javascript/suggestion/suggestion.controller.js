(function () {
    'use strict';

    angular.module('guiapp.suggestion')
        .controller('SuggestionCtrl', SuggestionCtrl);

    SuggestionCtrl.$inject = ['$scope', 'elastic'];

    function SuggestionCtrl($scope, elastic) {
        var vm = this;

        vm.suggest = {};
        vm.suggest.index = '';
        vm.suggest.field = '';
        vm.suggest.query = '';
        vm.suggest.min_word_length = 3;
        vm.suggest.prefix_length = 1;

        vm.sourcedata = {};
        vm.sourcedata.indices = [];
        vm.sourcedata.fields = [];

        vm.results = {};

        vm.unbind = {};
        vm.unbind.indicesScope = function () {};

        vm.doSuggest = doSuggest;
        vm.loadIndices = loadIndices;
        vm.loadFields = loadFields;

        activate();

        function activate() {
            loadIndices();
        }

        function doSuggest () {
            var request = {
                index: vm.suggest.index.name,
                field: vm.suggest.field,
                query: vm.suggest.query,
                min_word_length: vm.suggest.min_word_length,
                prefix_length: vm.suggest.prefix_length
            };

            elastic.suggest(request, function (result) {
                vm.results = result;
            });
        }

        function loadIndices () {
            vm.unbind.indicesScope();
            elastic.indexes(function (data) {
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        vm.sourcedata.indices[i] = {"name": data[i]};
                    }
                    vm.unbind.indicesScope = $scope.$watch('vm.suggest.index', vm.loadFields, true);
                } else {
                    vm.sourcedata.indices = [];
                    vm.sourcedata.fields = [];
                }
            });
        }

        function loadFields() {
            var selectedIndices = [];
            if (vm.suggest.index) {
                selectedIndices.push(vm.suggest.index.name);
            }

            var selectedTypes = [];

            elastic.fields(selectedIndices, selectedTypes, function (data) {
                vm.sourcedata.fields = data;
            });
        }
    }
})();
