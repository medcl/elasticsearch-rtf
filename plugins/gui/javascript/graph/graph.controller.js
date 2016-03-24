(function () {
    'use strict';

    angular
        .module('guiapp')
        .controller('GraphCtrl', GraphCtrl);

    GraphCtrl.$inject = ['$modal', 'elastic', 'aggregateBuilder', '$log'];

    function GraphCtrl($modal, elastic, aggregateBuilder, $log) {
        var vm = this;
        vm.indices = [];
        vm.types = [];
        vm.fields = [];
        vm.results = [];
        vm.columns = [];
        //vm.aggregate;

        vm.loadIndices = loadIndices;
        vm.loadTypes = loadTypes();
        vm.loadFields = loadFields;
        vm.openDialog = openDialog;
        vm.executeQuery = executeQuery;


        activate();
        function activate() {
            loadIndices();
            loadTypes();
            loadFields();
        }

        function loadIndices() {
            elastic.indexes(function (data) {
                vm.indices = data;
            });
        }

        function loadTypes() {
            elastic.types([], function (data) {
                vm.types = data;
            });
        }

        function loadFields() {
            elastic.fields([], [], function (data) {
                vm.fields = data;
            });
        }

        function openDialog() {
            var opts = {
                backdrop: true,
                keyboard: true,
                backdropClick: true,
                templateUrl: 'template/dialog/aggregate.html',
                controller: 'AggregateDialogCtrl',
                controllerAs: 'adVm',
                resolve: {
                    fields: function () {
                        return angular.copy(vm.fields)
                    }
                }
            };
            var d = $modal.open(opts);
            d.result.then(function (result) {
                if (result) {
                    vm.aggregate = result;
                    executeQuery();
                }
            });
        }

        function executeQuery() {
            var query = createQuery();

            elastic.doSearch(query, function (results) {
                if (vm.aggregate.aggsType === "term") {
                    vm.columns = [];
                    var result = {};
                    angular.forEach(results.aggregations[vm.aggregate.name].buckets, function (bucket) {
                        vm.columns.push({
                            "id": bucket.key,
                            "type": "pie",
                            "name": bucket.key + "[" + bucket.doc_count + "]"
                        });
                        result[bucket.key] = bucket.doc_count;
                    });
                    vm.results = [result];
                } else if (vm.aggregate.aggsType === "datehistogram") {
                    vm.columns = [
                        {"id": "doc_count", "type": "line", "name": "documents"}
                    ];
                    vm.xaxis = {"id": "key"};
                    vm.results = results.aggregations[vm.aggregate.name].buckets;
                } else {
                    vm.columns = [
                        {"id": "doc_count", "type": "bar", "name": "documents"}
                    ];
                    vm.xaxis = {"id": "key"};
                    vm.results = results.aggregations[vm.aggregate.name].buckets;
                }
            }, function (errors) {
                $log.error(errors);
            });
        }

        function createQuery() {
            var query = {};
            query.index = "";
            query.body = {};
            query.size = 0;
            query.body.query = {"matchAll": {}};
            var aggregations = [];
            aggregations.push(vm.aggregate);
            query.body.aggs = aggregateBuilder.build(aggregations);

            return query;
        }
    }
})();
