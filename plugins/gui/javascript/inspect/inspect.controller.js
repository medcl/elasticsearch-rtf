(function () {
    'use strict';


    angular
        .module('guiapp.inspect')
        .controller('InspectCtrl', InspectCtrl);

    InspectCtrl.$inject = ['$scope','$routeParams', '$location', 'elastic'];

    function InspectCtrl($scope, $routeParams, $location, elastic) {
        var vm = this;
        vm.inspect = {};
        vm.inspect.index = '';
        vm.inspect.type = '';
        vm.inspect.id = '';

        vm.sourcedata = {};
        vm.sourcedata.indices = [];
        vm.sourcedata.types = [];

        vm.doInspect = doInspect;
        vm.loadIndices = loadIndices;

        activate();

        function activate() {
            if ($routeParams.id && $routeParams.type && $routeParams.index) {
                vm.inspect.id = $routeParams.id;

                elastic.getDocument($routeParams.index,$routeParams.type,$routeParams.id, function (result) {
                    vm.result = result;
                }, function (errors) {
                    vm.metaResults = {};
                    vm.metaResults.failedShards = 1;
                    vm.metaResults.errors = [];
                    vm.metaResults.errors.push(errors.error);
                });
            }

            loadIndices();

            $scope.$watch('vm.inspect.index', function () {
                loadTypes();
            });

        }

        function doInspect() {
            $location.path("/inspect/" +
                vm.inspect.index.name +
                "/" + vm.inspect.type.name +
                "/" + vm.inspect.id);
        }

        function loadIndices() {
            elastic.indexes(function (data) {
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        vm.sourcedata.indices[i] = {"name": data[i]};
                        if ($routeParams.index && $routeParams.index == data[i]) {
                            vm.inspect.index = vm.sourcedata.indices[i];
                        }
                    }
                } else {
                    vm.sourcedata.indices = [];
                }
            });
        }

        function loadTypes() {
            elastic.types(vm.inspect.index, function (data) {
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        vm.sourcedata.types[i] = {"name": data[i]};
                        if ($routeParams.type && $routeParams.type == data[i]) {
                            vm.inspect.type = vm.sourcedata.types[i];
                        }
                    }
                } else {
                    vm.sourcedata.types = [];
                }
            });
        }
    }
})();
