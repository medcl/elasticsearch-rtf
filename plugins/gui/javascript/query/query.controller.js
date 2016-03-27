(function () {
    'use strict';

    angular.module('guiapp.query')
        .controller('QueryCtrl', QueryCtrl);

    QueryCtrl.$inject = ['$scope', '$modal', '$location', 'elastic', 'aggregateBuilder', 'queryStorage'];

    function QueryCtrl($scope, $modal, $location, elastic, aggregateBuilder, queryStorage) {
        var vm = this;
        vm.fields = [];
        vm.createdQuery = "";

        vm.queryResults = [];
        vm.aggsResults = [];
        vm.metaResults = {};
        vm.queryFactory = {};
        vm.unbind = {};
        vm.unbind.indicesScope = function () {
        };
        vm.unbind.typesScope = function () {
        };

        vm.changePage = changePage;
        vm.restartSearch = restartSearch;
        vm.loadIndices = loadIndices;
        vm.loadTypes = loadTypes;
        vm.loadFields = loadFields;
        vm.addQueryField = addQueryField;
        vm.addAllQueryFields = addAllQueryFields;
        vm.removeQueryField = removeQueryField;
        vm.addSearchField = addSearchField;
        vm.removeSearchField = removeSearchField;
        vm.removeAggregateField = removeAggregateField;
        vm.executeQuery = executeQuery;
        vm.resetQuery = resetQuery;
        vm.changeQuery = changeQuery;
        vm.openDialog = openDialog;
        vm.saveQuery = saveQuery;
        vm.loadQuery = loadQuery;
        vm.inspect = inspect;


        activate();

        function activate() {
            initQuery();
            initPagination();

            loadIndices();

            $scope.$watchCollection('vm.query', function () {
                changeQuery();
            });
        }

        function initQuery() {
            vm.query = {};
            vm.query.term = "";
            vm.query.chosenFields = [];
            vm.query.aggs = {};
            vm.query.indices = {};
            vm.query.types = {};
            vm.query.advanced = {};
            vm.query.advanced.searchFields = [];
            vm.query.advanced.newType = 'or';
            vm.query.advanced.newText = null;
            vm.query.advanced.newField = null;
            vm.query.multiSearch = false;
        }

        function initPagination() {
            vm.currentPage = 1;
            vm.maxSize = 5;
            vm.numPages = 0;
            vm.pageSize = 10;
            vm.totalItems = 0;
        }

        function changePage() {
            executeQuery();
        }

        function restartSearch() {
            vm.currentPage = 1;
            vm.numPages = 0;
            vm.pageSize = 10;
            vm.totalItems = 0;
            vm.executeQuery();
        }

        /* Functions to retrieve values used to created the query */
        function loadIndices() {
            vm.unbind.indicesScope();
            elastic.indexes(function (data) {
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        vm.query.indices[data[i]] = {"name": data[i], "state": false};
                    }
                    vm.unbind.indicesScope = $scope.$watch('vm.query.indices', vm.loadTypes, true);
                } else {
                    vm.query.indices = {};
                }
            });
        }

        function loadTypes() {
            vm.query.types = {};
            var selectedIndices = [];
            angular.forEach(vm.query.indices, function (index) {
                if (index.state) {
                    selectedIndices.push(index.name);
                }
            });
            vm.unbind.typesScope();
            elastic.types(selectedIndices, function (data) {
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        vm.query.types[data[i]] = {"name": data[i], "state": false};
                    }
                    vm.unbind.typesScope = $scope.$watch('vm.query.types', vm.loadFields, true);
                } else {
                    vm.query.types = {};
                }
            });
        }

        function loadFields() {
            var selectedIndices = [];
            angular.forEach(vm.query.indices, function (index) {
                if (index.state) {
                    selectedIndices.push(index.name);
                }
            });

            var selectedTypes = [];
            angular.forEach(vm.query.types, function (type) {
                if (type.state) {
                    selectedTypes.push(type.name);
                }
            });
            elastic.fields(selectedIndices, selectedTypes, function (data) {
                vm.fields = data;
            });
        }

        /* Function to change the input for the query to be executed */
        function addQueryField() {
            var i = vm.query.chosenFields.indexOf(vm.queryFactory.addField);
            if (i == -1) {
                vm.query.chosenFields.push(vm.queryFactory.addField);
            }
            changeQuery();
        }

        function addAllQueryFields() {
            angular.forEach(vm.fields, function (value, key) {
                vm.query.chosenFields.push(key);
            });
            changeQuery();
        }

        function removeQueryField(index) {
            vm.query.chosenFields.splice(index, 1);
            changeQuery();
        }

        function addSearchField() {
            var searchField = {};
            searchField.field = vm.query.advanced.newField;
            searchField.text = vm.query.advanced.newText;
            searchField.type = vm.query.advanced.newType;
            vm.query.advanced.searchFields.push(searchField);
        }

        function removeSearchField(index) {
            vm.query.advanced.searchFields.splice(index, 1);
        }

        function removeAggregateField(name) {
            delete vm.query.aggs[name];
            changeQuery();
        }

        /* Functions to create, reset and execute the query */
        function executeQuery() {
            changeQuery();
            var request = createQuery();
            vm.metaResults = {};

            elastic.doSearch(request, function (results) {
                vm.queryResults = results.hits;
                vm.aggsResults = results.aggregations;
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
            }, function (errors) {
                vm.metaResults.failedShards = 1;
                vm.metaResults.errors = [];
                vm.metaResults.errors.push(errors.error);
            });
        }

        function resetQuery() {
            loadIndices();

            initQuery();
            initPagination();

            changeQuery();
            vm.query.type = "or";
        }

        function changeQuery() {
            vm.createdQuery = JSON.stringify(createQuery().body, null, 2);
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
                    vm.query.aggs[result.name] = result;
                    changeQuery();
                }
            });
        }

        function saveQuery() {
            queryStorage.saveQuery(angular.copy(vm.query));
        }

        function loadQuery() {
            queryStorage.loadQuery(function (data) {
                vm.query = angular.copy(data);
                changeQuery();
            });
        }

        function inspect(doc) {
            $location.path("/inspect/" + doc._index + "/" + doc._type + "/" + doc._id);
        }

        function createQuery() {
            var query = {};
            query.index = "";
            query.body = {};
            query.body.query = {};

            query.size = vm.pageSize;
            query.from = (vm.currentPage - 1) * vm.pageSize;

            var chosenIndices = [];
            angular.forEach(vm.query.indices, function (value) {
                if (value.state) {
                    chosenIndices.push(value.name);
                }
            });
            query.index = chosenIndices.toString();

            var chosenTypes = [];
            angular.forEach(vm.query.types, function (value) {
                if (value.state) {
                    chosenTypes.push(value.name);
                }
            });
            query.type = chosenTypes.toString();

            if (vm.query.chosenFields.length > 0) {
                query.fields = vm.query.chosenFields.toString();
            }
            if (vm.query.multiSearch && vm.query.advanced.searchFields.length > 0) {
                var tree = {};
                for (var i = 0; i < vm.query.advanced.searchFields.length; i++) {
                    var searchField = vm.query.advanced.searchFields[i];
                    var fieldForSearch = vm.fields[searchField.field];
                    recurseTree(tree, searchField.field, searchField.text, searchField.type);
                    if (fieldForSearch.nestedPath) {
                        defineNestedPathInTree(tree, fieldForSearch.nestedPath, fieldForSearch.nestedPath);
                    }
                }
                query.body.query = constructQuery(tree);

            } else if (vm.query.term.length > 0) {
                var matchPart = {};
                matchPart.query = vm.query.term;
                if (vm.query.type === 'phrase') {
                    matchPart.type = "phrase";
                } else {
                    matchPart.operator = vm.query.type;
                }
                query.body.query.match = {"_all": matchPart};
            } else {
                query.body.query.matchAll = {};
            }

            query.body.aggs = aggregateBuilder.build(vm.query.aggs);

            query.body.explain = vm.query.explain;
            if (vm.query.highlight) {
                var highlight = {"fields": {}};
                angular.forEach(vm.query.chosenFields, function (value) {
                    highlight.fields[value] = {};
                });
                query.body.highlight = highlight;
            }
            return query;
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
                    matchQuery[fieldName] = {};
                    matchQuery[fieldName].query = tree[prop];
                    if (vm.query.type === 'phrase') {
                        matchQuery[fieldName].type = "phrase";
                    } else {
                        matchQuery[fieldName].operator = tree['_type_' + prop];
                    }
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

        function recurseTree(tree, newKey, value, type) {
            var newKeys = newKey.split(".");

            if (newKeys.length > 1) {
                if (!tree.hasOwnProperty(newKeys[0])) {
                    tree[newKeys[0]] = {};
                }
                recurseTree(tree[newKeys[0]], newKeys.splice(1).join("."), value, type);
            } else {
                if (!tree.hasOwnProperty(newKey)) {
                    tree[newKey] = value;
                    tree['_type_' + newKey] = type;
                }
            }
        }
    }
})();
