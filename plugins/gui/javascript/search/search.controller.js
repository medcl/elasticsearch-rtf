(function () {
    'use strict';

    angular
        .module('guiapp.search')
        .controller('SearchCtrl', SearchCtrl);

    SearchCtrl.$inject = ['$scope','elastic', 'configuration', 'aggregateBuilder', '$modal', 'queryStorage'];

    function SearchCtrl($scope, elastic, configuration, aggregateBuilder, $modal, queryStorage) {
        var vm = this;
        vm.isCollapsed = true; // Configuration div
        vm.configure = {};
        vm.fields = [];
        vm.search = {};
        vm.search.advanced = {};
        vm.search.advanced.searchFields = [];
        vm.search.aggs = {};
        vm.search.selectedAggs = [];
        vm.configError = "";
        vm.results = [];
        vm.aggs = [];
        vm.tokensPerField = [];
        vm.metaResults = {};

        // initialize pagination
        vm.currentPage = 1;
        vm.maxSize = 5;
        vm.numPages = 0;
        vm.pageSize = 10;
        vm.totalItems = 0;

        vm.addFilter = addFilter;
        vm.addRangeFilter = addRangeFilter;
        vm.addSearchField = addSearchField;
        vm.changePage = changePage;
        vm.checkSelectedAggregate = checkSelectedAggregate;
        vm.checkSelectedRangeAggregate = checkSelectedRangeAggregate;
        vm.doSearch = doSearch;
        vm.init = init;
        vm.loadQuery = loadQuery;
        vm.obtainAggregateByKey = obtainAggregateByKey;
        vm.openDialog = openDialog;
        vm.removeFilter = removeFilter;
        vm.removeRangeFilter = removeRangeFilter;
        vm.removeSearchField = removeSearchField;
        vm.restartSearch = restartSearch;
        vm.removeAggregateField = removeAggregateField;
        vm.saveQuery = saveQuery;
        vm.showAnalysis = showAnalysis;

        activate();

        function activate() {
            init();
        }

        function changePage () {
            vm.doSearch();
        }

        function init () {
            vm.configure.title = configuration.configuration.title;
            vm.configure.description = configuration.configuration.description;

            elastic.fields([], [], function (data) {
                vm.fields = data;
                if (!vm.configure.title) {
                    if (vm.fields.title) {
                        vm.configure.title = "title";
                    }
                }

                if (!vm.configure.description && vm.fields.description) {
                    vm.configure.description = "description";
                }
            });

            $scope.$watchCollection('vm.configure', function() {
                configuration.changeConfiguration(vm.configure);
            }, true);
        }

        function restartSearch() {
            vm.currentPage = 1;
            vm.numPages = 0;
            vm.pageSize = 10;
            vm.totalItems = 0;
            vm.tokensPerField = [];
            vm.doSearch();
        }

        function doSearch () {
            if ((!(vm.configure.title)) || (!(vm.configure.description))) {
                vm.configError = "Please configure the title and description in the configuration at the top of the page.";
            } else {
                vm.configError = "";
            }

            var query = {};
            query.index = "";
            query.body = {};

            query.size = vm.pageSize;
            query.from = (vm.currentPage - 1) * vm.pageSize;

            query.body.aggs = aggregateBuilder.build(vm.search.aggs);
            var filter = filterChosenAggregatePart();
            if (filter) {
                query.body.query = {"filtered": {"query": searchPart(), "filter": filter}};
            } else {
                query.body.query = searchPart();
            }

            elastic.doSearch(query, function (results) {
                vm.results = results.hits;
                vm.aggs = results.aggregations;
                vm.numPages = Math.ceil(results.hits.total / vm.pageSize);
                vm.totalItems = results.hits.total;

                vm.metaResults.totalShards = results._shards.total;
                if (results._shards.failed > 0) {
                    vm.metaResults.failedShards = results._shards.failed;
                    vm.metaResults.errors = [];
                    angular.forEach(results._shards.failures, function (failure) {
                        vm.metaResults.errors.push(failure.index + " - " + failure.reason);
                    });

                }
            }, handleErrors);
        }

        function addSearchField () {
            var searchField = {};
            searchField.field = vm.search.advanced.newField;
            searchField.text = vm.search.advanced.newText;
            vm.search.advanced.searchFields.push(searchField);
        }

        function removeSearchField(index) {
            vm.search.advanced.searchFields.splice(index, 1);
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
            var modalInstance = $modal.open(opts);
            modalInstance.result.then(function (result) {
                if (result) {
                    vm.search.aggs[result.name] = result;
                }
            }, function () {
                // Nothing to do here
            });
        }

        function removeAggregateField(name) {
            delete vm.search.aggs[name];
        }

        function saveQuery() {
            queryStorage.saveSearch(angular.copy(vm.search));
        }

        function loadQuery() {
            queryStorage.loadSearch(function (data) {
                vm.search = angular.copy(data);
            });
        }

        function addFilter(key, value) {
            if (!vm.search.selectedAggs) {
                vm.search.selectedAggs = [];
            }
            vm.search.selectedAggs.push({"key": key, "value": value});
            vm.doSearch();
        }

        function addRangeFilter(key, from, to) {
            if (!vm.search.selectedAggs) {
                vm.search.selectedAggs = [];
            }
            vm.search.selectedAggs.push({"key": key, "from": from, "to": to});
            vm.doSearch();
        }

        function checkSelectedAggregate(key, value) {
            if (!vm.search.selectedAggs) {
                return false;
            }
            for (var i = 0; i < vm.search.selectedAggs.length; i++) {
                var selectedAggregate = vm.search.selectedAggs;
                if (selectedAggregate[i].key === key && selectedAggregate[i].value === value) {
                    return true;
                }
            }
            return false;
        }

        function checkSelectedRangeAggregate(key, from, to) {
            if (!vm.search.selectedAggs) {
                return false;
            }
            for (var i = 0; i < vm.search.selectedAggs.length; i++) {
                var selectedAggregate = vm.search.selectedAggs;
                if (selectedAggregate[i].key === key && selectedAggregate[i].from === from && selectedAggregate[i].to === to) {
                    return true;
                }
            }
            return false;
        }

        function removeFilter(key, value) {
            if (!vm.search.selectedAggs) {
                return;
            }
            for (var i = 0; i < vm.search.selectedAggs.length; i++) {
                var selectedAggregate = vm.search.selectedAggs;
                if (selectedAggregate[i].key === key && selectedAggregate[i].value === value) {
                    vm.search.selectedAggs.splice(i, 1);
                }
            }
            vm.doSearch();
        }

        function removeRangeFilter(key, from, to) {
            if (!vm.search.selectedAggs) {
                return;
            }
            for (var i = 0; i < vm.search.selectedAggs.length; i++) {
                var selectedAggregate = vm.search.selectedAggs;
                if (selectedAggregate[i].key === key && selectedAggregate[i].from === from && selectedAggregate[i].to === to) {
                    vm.search.selectedAggs.splice(i, 1);
                }
            }
            vm.doSearch();
        }

        function obtainAggregateByKey(key) {
            for (var i = 0; i < vm.search.aggs.length; i++) {
                var currentAggregate = vm.search.aggs[i];
                if (currentAggregate.field === key) {
                    return currentAggregate;
                }
            }
            return null;
        }

        function showAnalysis(index, type, id) {
            vm.tokensPerField = {"id": index + type + id};
            elastic.documentTerms(index, type, id, function (result) {
                vm.tokensPerField.tokens = result;
            });
        }

        function searchPart() {
            var executedQuery;
            if (vm.search.doAdvanced && vm.search.advanced.searchFields.length > 0) {
                var tree = {};
                for (var i = 0; i < vm.search.advanced.searchFields.length; i++) {
                    var searchField = vm.search.advanced.searchFields[i];
                    var fieldForSearch = vm.fields[searchField.field];
                    recurseTree(tree, searchField.field, searchField.text);
                    if (fieldForSearch.nestedPath) {
                        defineNestedPathInTree(tree, fieldForSearch.nestedPath, fieldForSearch.nestedPath);
                    }
                }
                executedQuery = constructQuery(tree);

            } else if (vm.search.simple && vm.search.simple.length > 0) {
                executedQuery = {
                    "simple_query_string": {
                        "query": vm.search.simple,
                        "fields": ["_all"],
                        "analyzer": "snowball"
                    }
                };
            } else {
                executedQuery = {"matchAll": {}};
            }

            return executedQuery;
        }

        function constructQuery(tree) {
            var props = Object.getOwnPropertyNames(tree);
            var boolQuery = {};
            boolQuery.bool = {};
            boolQuery.bool.must = [];
            for (var i = 0; i < props.length; i++) {
                var prop = props[i];
                if (tree[prop] instanceof Object) {
                    boolQuery.bool.must.push(constructQuery(tree[prop]));
                } else if (!(prop.substring(0, 1) === "_")) {
                    var fieldName = prop;
                    if (tree._nested) {
                        fieldName = tree._nested + "." + fieldName;
                    }
                    var matchQuery = {};
                    matchQuery[fieldName] = tree[prop];
                    boolQuery.bool.must.push({"match": matchQuery});
                }
            }

            var returnQuery;
            if (tree._nested) {
                var nestedQuery = {};
                nestedQuery.nested = {};
                nestedQuery.nested.path = tree._nested;
                nestedQuery.nested.query = boolQuery;
                returnQuery = nestedQuery;
            } else {
                returnQuery = boolQuery;
            }

            return returnQuery;
        }

        function defineNestedPathInTree(tree, path, nestedPath) {
            var pathItems = path.split(".");
            if (pathItems.length > 1) {
                defineNestedPathInTree(tree[pathItems[0]], pathItems.splice(1).join("."), nestedPath);
            } else {
                tree[path]._nested = nestedPath;
            }

        }

        function recurseTree(tree, newKey, value) {
            var newKeys = newKey.split(".");

            if (newKeys.length > 1) {
                if (!tree.hasOwnProperty(newKeys[0])) {
                    tree[newKeys[0]] = {};
                }
                recurseTree(tree[newKeys[0]], newKeys.splice(1).join("."), value);
            } else {
                if (!tree.hasOwnProperty(newKey)) {
                    tree[newKey] = value;
                }
            }
        }


        function filterChosenAggregatePart() {
            if (vm.search.selectedAggs && vm.search.selectedAggs.length > 0) {
                var filterQuery = {};
                var selectedAggs = vm.search.selectedAggs;
                var filters = [];
                for (var i = 0; i < selectedAggs.length; i++) {
                    var aggregate = vm.search.aggs[selectedAggs[i].key];
                    var aggregateType = aggregate.aggsType;
                    if (aggregateType === "term") {
                        var termFilter = {"term": {}};
                        termFilter.term[vm.search.aggs[selectedAggs[i].key].field] = selectedAggs[i].value;
                        filters.push(termFilter);
                    } else if (aggregateType === "datehistogram") {
                        var fromDate = new Date(selectedAggs[i].value);
                        if (aggregate.interval === 'year') {
                            fromDate.setFullYear(fromDate.getFullYear() + 1);
                        } else if (aggregate.interval === 'month') {
                            fromDate.setMonth(fromDate.getMonth() + 1);
                        } else if (aggregate.interval === 'week') {
                            fromDate.setDate(fromDate.getDate() + 7);
                        } else if (aggregate.interval === 'day') {
                            fromDate.setDate(fromDate.getDate() + 1);
                        } else if (aggregate.interval === 'hour') {
                            fromDate.setHours(fromDate.getHours() + 1);
                        } else if (aggregate.interval === 'minute') {
                            fromDate.setMinutes(fromDate.getMinutes() + 1);
                        }
                        var rangeFilter = {"range": {}};
                        rangeFilter.range[vm.search.aggs[selectedAggs[i].key].field] = {
                            "from": selectedAggs[i].value,
                            "to": fromDate.getTime()
                        };
                        filters.push(rangeFilter);
                    } else if (aggregateType === "histogram") {
                        var rangeFilter = {"range": {}};
                        var currentAgg = vm.search.aggs[selectedAggs[i].key];
                        rangeFilter.range[currentAgg.field] = {
                            "from": selectedAggs[i].value,
                            "to": selectedAggs[i].value + currentAgg.interval - 1
                        };
                        filters.push(rangeFilter);
                    } else if (aggregateType === "range") {
                        var rangeFilter = {"range": {}};
                        var currentAgg = vm.search.aggs[selectedAggs[i].key];
                        rangeFilter.range[currentAgg.field] = {
                            "from": selectedAggs[i].from,
                            "to": selectedAggs[i].to
                        };
                        filters.push(rangeFilter);
                    }
                }
                filterQuery.and = filters;

                return filterQuery;
            }
            return null;
        }

        function handleErrors(errors) {
            vm.metaResults.failedShards = 1;
            vm.metaResults.errors = [];
            if (errors.message && typeof errors.message === "object") {
                if (errors.message.hasOwnProperty('message')) {
                    vm.metaResults.errors.push(errors.message.message);
                }
            } else {
                vm.metaResults.errors.push(errors.message);
            }
        }
    }
})();
