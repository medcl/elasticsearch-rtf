kopf.controller('AliasesController', ['$scope', 'AlertService', 'AceEditorService', 'ElasticService', function($scope, AlertService, AceEditorService, ElasticService) {
	$scope.paginator = new Paginator(1,10, [], new AliasFilter("",""));
    $scope.page = $scope.paginator.getPage();
    $scope.original = [];
	$scope.editor = undefined;
    $scope.new_alias = new Alias("", "", "", "", "");

    $scope.aliases = [];

    $scope.$watch('paginator', function(filter, previous) {
        $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.viewDetails=function(alias) {
		$scope.details = alias;
	};

	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('alias-filter-editor');
		}
	};

	$scope.addAlias=function() {
		$scope.new_alias.filter = $scope.editor.format();
		if (!isDefined($scope.editor.error)) {
			try {
				$scope.new_alias.validate();
                var index_name = $scope.new_alias.index;
                var alias_name = $scope.new_alias.alias;
				// if alias already exists, check if its already associated with index
                var collection = $scope.paginator.getCollection();
				var indices = collection.filter(function(a) { return a.index == index_name; });
                if (indices.length === 0) {
                    collection.push(new IndexAliases(index_name, [ $scope.new_alias ]));
                } else {
                    var index_aliases = indices[0];
                    var aliases = index_aliases.aliases.filter(function(a) { return alias_name == a.alias;  });
                    if (aliases.length > 0) {
                        throw "Alias is already associated with this index";
                    } else {
                        index_aliases.aliases.push($scope.new_alias);
                    }
                }
				$scope.new_alias = new Alias();
				$scope.paginator.setCollection(collection);
                $scope.page = $scope.paginator.getPage();
				AlertService.success("Alias successfully added. Note that changes made will only be persisted after saving changes");
			} catch (error) {
				AlertService.error(error ,null);
			}
		} else {
			AlertService.error("Invalid filter defined for alias" , $scope.editor.error);
		}
	};
	
	$scope.removeIndexAliases=function(index) {
        var collection = $scope.paginator.getCollection();
        for (var position = 0; position < collection.length; position++) {
            if (index == collection[position].index) {
                collection.splice(position, 1);
                break;
            }
        }
        $scope.paginator.setCollection(collection);
        $scope.page = $scope.paginator.getPage();
		AlertService.success("All aliases were removed for " + index);
	};
	
	$scope.removeIndexAlias=function(index, alias) {
        var index_position = 0;
        var collection = $scope.paginator.getCollection();
        for (; index_position < collection.length; index_position++) {
            if (index == collection[index_position].index) {
                break;
            }
        }
        var index_aliases = collection[index_position];
        for (var alias_position = 0; alias_position < index_aliases.aliases.length; alias_position++) {
            if (alias == index_aliases.aliases[alias_position].alias) {
                index_aliases.aliases.splice(alias_position, 1);
                if (index_aliases.aliases.length === 0) {
                    collection.splice(index_position, 1);
                }
                break;
            }
        }
        $scope.paginator.setCollection(collection);
        $scope.page = $scope.paginator.getPage();
        AlertService.success("Alias successfully dissociated from index. Note that changes made will only be persisted after saving changes");
	};
	
	$scope.mergeAliases=function() {
		var collection = $scope.paginator.getCollection();
        var deletes = IndexAliases.diff(collection, $scope.original);
		var adds = IndexAliases.diff($scope.original, collection);
        if (adds.length === 0 && deletes.length === 0) {
            AlertService.warn("No changes were made: nothing to save");
        } else {
            ElasticService.client.updateAliases(adds,deletes,
                function(response) {
                    AlertService.success("Aliases were successfully updated",response);
                    $scope.loadAliases();
                },
                function(error) {
                    AlertService.error("Error while updating aliases",error);
                }
            );
        }
	};

	$scope.loadAliases=function() {
		ElasticService.client.fetchAliases(
			function(index_aliases) {
                $scope.original = index_aliases.map(function(ia) { return ia.clone(); });
                $scope.paginator.setCollection(index_aliases);
                $scope.page = $scope.paginator.getPage();
			},
			function(error) {
                AlertService.error("Error while fetching aliases",error);
			}
		);
	};
	
    $scope.$on('loadAliasesEvent', function() {
        $scope.indices = $scope.cluster.indices;
        $scope.loadAliases();
		$scope.initEditor();
    });
}]);
