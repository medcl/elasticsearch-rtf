(function () {
    'use strict';
    angular
        .module('guiapp.services')
        .factory('elastic', ElasticService);

    ElasticService.$inject = ['esFactory', 'configuration', '$rootScope', '$log'];

    function ElasticService(esFactory, configuration, $rootScope, $log) {
        var serverUrl = configuration.configuration.serverUrl;
        var statussus = {"green": "success", "yellow": "warning", "red": "error"};
        var es = createEsFactory();
        var activeIndexes = [];

        var service = {
            changeServerAddress: changeServerAddress,
            obtainServerAddress: function(){return serverUrl},
            clusterStatus: clusterStatus,
            clusterHealth: clusterHealth,
            clusterNodes: clusterNodes,
            obtainShards: obtainShards,
            nodeInfo: nodeInfo,
            indexes: indexes,
            removeIndex: removeIndex,
            openIndex: openIndex,
            closeIndex: closeIndex,
            indexesDetails: indexesDetails,
            types: types,
            documentTerms: documentTerms,
            fields: fields,
            changeReplicas: changeReplicas,
            snapshotRepositories: snapshotRepositories,
            createRepository: createRepository,
            deleteRepository: deleteRepository,
            obtainSnapshots: obtainSnapshots,
            obtainSnapshotStatus: obtainSnapshotStatus,
            removeSnapshot: removeSnapshot,
            restoreSnapshot: restoreSnapshot,
            createSnapshot: createSnapshot,
            doSearch: doSearch,
            suggest: suggest,
            getDocument: getDocument
        };

        // just to initialize the indices
        //indexes();

        return service;

        function changeServerAddress (serverAddress) {
            serverUrl = serverAddress;
            es = createEsFactory();
            indexes();
        }

        function clusterStatus (callback) {
            es.cluster.health({}).then(function (data) {
                var numClients = data.number_of_nodes - data.number_of_data_nodes;
                var msg = data.cluster_name + " [nodes: " + data.number_of_nodes + ", clients: " + numClients + "]";
                callback(msg, statussus[data.status]);
            }, function (reason) {
                broadcastError(reason);
                callback("No connection", "error");
            });
        }

        function clusterHealth(callback) {
            es.cluster.health().then(function (data) {
                callback(data);
            });
        }

        function clusterNodes (callback) {
            es.nodes.info().then(function (data) {
                callback(data.nodes);
            });
        }

        function obtainShards (callback) {
            es.cluster.state({"metric": ["routing_table", "nodes"]}).then(function (data) {
                callback(data.nodes, data.routing_table.indices);
            });
        }

        function nodeInfo(nodeId, callback) {
            es.nodes.info({"nodeId": nodeId, "human": true}).then(function (data) {
                callback(data.nodes[nodeId]);
            });
        }

        function indexes (callback) {
            es.cluster.state({"ignoreUnavailable": true}).then(function (data) {
                var indices = [];
                for (var index in data.metadata.indices) {
                    var ignored = indexIsNotIgnored(index);
                    if (indexIsNotIgnored(index)) {
                        indices.push(index);
                    }
                }
                activeIndexes = indices;
                if (callback) {
                    callback(indices);
                }
            });
        }

        function removeIndex(index, callback) {
            es.indices.delete({"index": index}).then(function (data) {
                callback();
            });
        }

        function openIndex(index, callback) {
            es.indices.open({"index": index}).then(function (data) {
                callback();
            });
        }

        function closeIndex (index, callback) {
            es.indices.close({"index": index}).then(function (data) {
                callback();
            });
        }

        function indexesDetails(callback) {
            es.indices.stats({"human": true, "recovery": false}).then(function (statusData) {
                var indexesStatus = statusData.indices;
                es.cluster.state({"metric": "metadata"}).then(function (stateData) {
                    var indexesState = stateData.metadata.indices;
                    var indices = [];
                    angular.forEach(indexesState, function (value, key) {
                        var newIndex = {};
                        newIndex.name = key;
                        if (value.state === 'open') {
                            if (indexesStatus[key]) {
                                newIndex.size = indexesStatus[key].total.store.size;
                                newIndex.numDocs = indexesStatus[key].total.docs.count;
                            } else {
                                newIndex.size = "unknown";
                                newIndex.numDocs = "unknown";
                            }
                            newIndex.state = true;
                            newIndex.numShards = value.settings.index.number_of_shards;
                            newIndex.numReplicas = value.settings.index.number_of_replicas
                        } else {
                            newIndex.state = false;
                        }
                        indices.push(newIndex);
                    });
                    callback(indices);
                });
            });
        }

        function types (selectedIndex, callback) {
            var mappingFilter = {};
            if (selectedIndex.length > 0) {
                mappingFilter.index = selectedIndex.toString();
            }
            es.indices.getMapping(mappingFilter).then(function (data) {
                var myTypes = [];
                for (var index in data) {
                    if (indexIsNotIgnored(index)) {
                        for (var type in data[index].mappings) {
                            if (myTypes.indexOf(type) == -1 && type != "_default_") {
                                myTypes.push(type);
                            }
                        }
                    }
                }
                callback(myTypes);
            });
        }

        function documentTerms (index, type, id, callback) {
            es.termvectors(
                {
                    "index": index,
                    "type": type,
                    "id": id,
                    "routing":id,
                    "body": {
                        "fields": ["*"],
                        "field_statistics": false,
                        "term_statistics": true
                    }
                })
                .then(function (result) {
                    var fieldTerms = {};
                    if (result.term_vectors) {
                        angular.forEach(result.term_vectors, function (value, key) {
                            var terms = [];
                            angular.forEach(value.terms, function (term, termKey) {
                                terms.push(termKey);
                            });
                            fieldTerms[key] = terms;
                        });
                        callback(fieldTerms);
                    }
                });
        }

        function fields (selectedIndex, selectedType, callback) {
            var mappingFilter = {};
            if (selectedIndex.length > 0) {
                mappingFilter.index = selectedIndex.toString();
            }
            if (selectedType.length > 0) {
                mappingFilter.type = selectedType.toString();
            }
            es.indices.getMapping(mappingFilter).then(function (data) {
                var myTypes = [];
                var myFields = {};
                for (var index in data) {
                    if (indexIsNotIgnored(index)) {
                        for (var type in data[index].mappings) {
                            if (myTypes.indexOf(type) == -1 && type != "_default_") {
                                myTypes.push(type);
                                var properties = data[index].mappings[type].properties;
                                for (var field in properties) {
                                    handleSubfields(properties[field], field, myFields, undefined);
                                }
                            }
                        }
                    }
                }
                callback(myFields);
            });
        }

        function changeReplicas(index, numReplicas, callback) {
            var changeSettings = {
                "index": index,
                "body": {
                    "index": {
                        "number_of_replicas": numReplicas
                    }
                }
            };
            es.indices.putSettings(changeSettings).then(function (data) {
                callback(data);
            }, logErrors);
        }

        function snapshotRepositories(callback) {
            es.snapshot.getRepository().then(function (data) {
                callback(data);
            }, logErrors);
        }

        function createRepository (newRepository, callback) {
            var createrepo = {
                "repository": newRepository.repository,
                "body": {
                    "type": "fs",
                    "settings": {
                        "location": newRepository.location
                    }
                }
            };
            es.snapshot.createRepository(createrepo).then(function (data) {
                callback();
            }, broadcastError);
        }

        function deleteRepository(repository, callback) {
            es.snapshot.deleteRepository({"repository": repository}).then(function (data) {
                callback();
            }, broadcastError)
        }

        function obtainSnapshots(repository, callback) {
            es.snapshot.get({"repository": repository, "snapshot": "_all"}).then(function (data) {
                callback(data.snapshots);
            }, logErrors);
        }

        function obtainSnapshotStatus(callback) {
            es.snapshot.status().then(function (data) {
                callback(data.snapshots);
            }, logErrors);
        }

        function removeSnapshot(repository, snapshot, callback) {
            es.snapshot.delete({"repository": repository, "snapshot": snapshot}).then(function (data) {
                callback();
            }, logErrors);
        }

        function restoreSnapshot(repository, snapshot, callback) {
            es.snapshot.restore({"repository": repository, "snapshot": snapshot}).then(function (data) {
                callback();
            }, broadcastError);
        }

        function createSnapshot(newSnapshot, callback) {
            var aSnapshot = {
                "repository": newSnapshot.repository,
                "snapshot": newSnapshot.snapshot,
                "body": {
                    "indices": newSnapshot.indices,
                    "ignore_unavailable": newSnapshot.ignoreUnavailable,
                    "include_global_state": newSnapshot.includeGlobalState
                }
            };
            es.snapshot.create(aSnapshot).then(function (data) {
                callback();
            }, logErrors);
        }

        function handleSubfields(field, fieldName, myFields, nestedPath) {
            if (field.hasOwnProperty("properties")) {
                var nested = (field.type == "nested" | field.type == "object");
                if (nested) {
                    nestedPath = fieldName;
                }
                for (var subField in field.properties) {
                    var newField = fieldName + "." + subField;
                    handleSubfields(field.properties[subField], newField, myFields, nestedPath);
                }
            } else {
                if (field.hasOwnProperty("fields")) {
                    for (var multiField in field.fields) {
                        var multiFieldName = fieldName + "." + multiField;
                        // TODO jettro : fix the nested documents with multi_fields
                        if (!myFields[multiFieldName] && fieldName !== multiField) {
                            myFields[multiFieldName] = field.fields[multiField];
                            myFields[multiFieldName].nestedPath = nestedPath;
                            myFields[multiFieldName].forPrint = multiFieldName + " (" + field.type + ")";
                        }
                    }
                }
                if (!myFields[fieldName]) {
                    myFields[fieldName] = field;
                    myFields[fieldName].nestedPath = nestedPath;
                    myFields[fieldName].type = field.type;
                    myFields[fieldName].forPrint = fieldName + " (" + field.type + ")";
                }
            }
        }

        function doSearch (query, resultCallback, errorCallback) {
            if (query.index === "") {
                query.index = activeIndexes;
            }
            es.search(query).then(function (results) {
                resultCallback(results)
            }, function (errors) {
                errorCallback(errors)
            });
        }

        function getDocument (index,type,id, resultCallback, errorCallback) {
            es.get({
                index: index,
                type: type,
                id: id
            }).then(function(document) {
                resultCallback(document);
            }, function(errors) {
                errorCallback(errors);
            });
        }

        function suggest (suggestRequest, resultCallback) {
            var suggest = {};
            suggest.index = suggestRequest.index;
            suggest.body = {};
            suggest.body.mysuggester = {};
            suggest.body.mysuggester.text = suggestRequest.query;
            suggest.body.mysuggester.term = {};
            suggest.body.mysuggester.term.field = suggestRequest.field;
            suggest.body.mysuggester.term.min_word_length = suggestRequest.min_word_length;
            suggest.body.mysuggester.term.prefix_length = suggestRequest.prefix_length;

            es.suggest(suggest).then(function (results) {
                var suggested = {};
                if (results.mysuggester) {
                    for (var i = 0; i < results.mysuggester.length; i++) {
                        var item = results.mysuggester[i];
                        suggested[item.text] = [];
                        for (var j = 0; j < item.options.length; j++) {
                            suggested[item.text].push(item.options[j].text);
                        }

                    }
                }

                resultCallback(suggested);
            }, logErrors);
        }

        function createEsFactory() {
            return esFactory({"host": serverUrl, "apiVersion": "2.0"});
        }

        function indexIsNotIgnored(index) {
            var ignore = false;
            if (configuration.configuration.includedIndexes && configuration.configuration.includedIndexes.length > 0) {
                ignore = true;
                var includedIndexes = (configuration.configuration.includedIndexes) ? configuration.configuration.includedIndexes.split(",") : [];
                angular.forEach(includedIndexes, function (includedIndex) {
                    var indexToCheck = includedIndex.trim();
                    if (index.substring(0, indexToCheck.length) === indexToCheck) {
                        ignore = false;
                    }
                });
            } else {
                var excludedIndexes = (configuration.configuration.excludedIndexes) ? configuration.configuration.excludedIndexes.split(",") : [];
                angular.forEach(excludedIndexes, function (excludedIndex) {
                    var indexToCheck = excludedIndex.trim();
                    if (index.substring(0, indexToCheck.length) === indexToCheck) {
                        ignore = true;
                    }
                });
            }

            return !ignore;
        }

        function logErrors(errors) {
            $log.error(errors);
        }

        function broadcastError(error) {
            $rootScope.$broadcast('msg:notification', 'error', error.message);
        }
    }
})();
