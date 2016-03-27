function AliasesController($scope, $location, $timeout, AlertService, AceEditorService) {
	$scope.aliases = null;
	$scope.new_index = {};
	$scope.pagination= new AliasesPagination(1, []);
	$scope.editor = undefined;
	
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
				// if alias already exists, check if its already associated with index
				if (isDefined($scope.aliases.info[$scope.new_alias.alias])) {
					var aliases = $scope.aliases.info[$scope.new_alias.alias];
					$.each(aliases,function(i, alias) {
						if (alias.index === $scope.new_alias.index) {
							throw "Alias is already associated with this index";
						}
					});
				} else {
					$scope.aliases.info[$scope.new_alias.alias] = [];
				}
				$scope.aliases.info[$scope.new_alias.alias].push($scope.new_alias);
				$scope.new_alias = new Alias();
				$scope.pagination.setResults($scope.aliases.info);
				AlertService.success("Alias successfully added. Note that changes made will only be persisted after saving changes");
			} catch (error) {
				AlertService.error(error ,null);
			}
		} else {
			AlertService.error("Invalid filter defined for alias" , $scope.editor.error);
		}
	};
	
	$scope.removeAlias=function(alias) {
		delete $scope.aliases.info[alias];
		$scope.pagination.setResults($scope.aliases.info);
		AlertService.success("Alias successfully removed. Note that changes made will only be persisted after saving changes");
	};
	
	$scope.removeAliasFromIndex=function(index, alias_name) {
		var aliases = $scope.aliases.info[alias_name];
		for (var i = 0; i < aliases.length; i++) {
			if (alias_name === aliases[i].alias && index === aliases[i].index) {
				$scope.aliases.info[alias_name].splice(i,1);
				AlertService.success("Alias successfully dissociated from index. Note that changes made will only be persisted after saving changes");
			}
		}
	};
	
	$scope.mergeAliases=function() {
		var deletes = [];
		var adds = [];
		Object.keys($scope.aliases.info).forEach(function(alias_name) {
			var aliases = $scope.aliases.info[alias_name];
			aliases.forEach(function(alias) {
				// if alias didnt exist, just add it
				if (!isDefined($scope.originalAliases.info[alias_name])) {
					adds.push(alias);
				} else {
					var originalAliases = $scope.originalAliases.info[alias_name];
					var addAlias = true;
					for (var i = 0; i < originalAliases.length; i++) {
						if (originalAliases[i].equals(alias)) {
							addAlias = false;
							break;
						}
					}
					if (addAlias) {
						adds.push(alias);
					}
				}
			});
		});
		Object.keys($scope.originalAliases.info).forEach(function(alias_name) {
			var aliases = $scope.originalAliases.info[alias_name];
			aliases.forEach(function(alias) {
				if (!isDefined($scope.aliases.info[alias.alias])) {
					deletes.push(alias);
				} else {
					var newAliases = $scope.aliases.info[alias_name];
					var removeAlias = true;
					for (var i = 0; i < newAliases.length; i++) {
						if (alias.index === newAliases[i].index && alias.equals(newAliases[i])) {
							removeAlias = false;
							break;
						}
					}
					if (removeAlias) {
						deletes.push(alias);
					}
				}
			});
		});
		$scope.client.updateAliases(adds,deletes,
			function(response) {
				$scope.updateModel(function() {
					AlertService.success("Aliases were successfully updated",response);
				});
				$scope.loadAliases();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while updating aliases",error);
				});
			}
		);
	};
	
	$scope._parseAliases = function(aliases) {
		$scope.originalAliases = aliases;
		$scope.aliases = jQuery.extend(true, {}, $scope.originalAliases);
		$scope.pagination.setResults($scope.aliases.info);
	};

	$scope.loadAliases=function() {
		$scope.new_alias = new Alias();
		$scope.client.fetchAliases(
			function(aliases) {
				$scope.updateModel(function() {
					$scope._parseAliases(aliases);
				});
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while fetching aliases",error);
				});
			}
		);
	};
	
    $scope.$on('loadAliasesEvent', function() {
		$scope.loadAliases();
		$scope.initEditor();
    });

}