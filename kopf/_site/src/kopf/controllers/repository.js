function RepositoryController($q, $scope, $location, $timeout, ConfirmDialogService, AlertService, AceEditorService) {

	$scope.dialog_service = ConfirmDialogService;
	$scope.repositories = [];
	$scope.repositories_names = [];
	$scope.snapshots = [];
	$scope.indices = [];
	$scope.restorable_indices = [];
	$scope.new_repo = {};
	$scope.new_snap = {};
	$scope.restore_snap = {};
	$scope.editor = undefined;

    $scope.$on('loadRepositoryEvent', function() {
		$scope.reload();
		$scope.initEditor();
    });
	
	$scope.initEditor=function(){
		if(!angular.isDefined($scope.editor)){
			$scope.editor = AceEditorService.init('repository-settings-editor');
		}
	};

	$scope.loadIndices=function() {
		if( angular.isDefined($scope.cluster) )
		{
			$scope.indices = $scope.cluster.indices || [];
		}
	};

    $scope.reload=function(){
		$scope.loadRepositories().then(
							function() {
								$scope.allSnapshots($scope.repositories)
							});
		$scope.loadIndices();
    };

    $scope.optionalParam=function(body, object, paramname){
		if(angular.isDefined(object[paramname]))
		{
			body[paramname] = object[paramname];
		}
		return body;
    };

	$scope.deleteRepository=function(name, value){
		$scope.dialog_service.open(
			"are you sure you want to delete repository " + name + "?",
			value,
			"Delete",
			function() {
				$scope.client.deleteRepository(name,
					function(response) {
						AlertService.success("Repository successfully deleted", response);
						$scope.reload();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting repositor", error);
						});
					}
				);
			}
		);
	};

	$scope.restoreSnapshot=function(){

		var body = {}
		// dont add to body if not present, these are optional, all indices included by default
		if(angular.isDefined($scope.restore_snap.indices) && $scope.restore_snap.indices.length > 0)
		{
			body["indices"] = $scope.restore_snap.indices.join(",");
		}

		if(angular.isDefined($scope.restore_snap.include_global_state))
		{
			//TODO : when es fixes bug [https://github.com/elasticsearch/elasticsearch/issues/4949], this extra "true/false" -> true/false handling will go away
			body["include_global_state"] = ($scope.restore_snap.include_global_state == 'true');
		}

		$scope.optionalParam(body, $scope.restore_snap, "ignore_unavailable");
		$scope.optionalParam(body, $scope.restore_snap, "rename_replacement");
		$scope.optionalParam(body, $scope.restore_snap, "rename_pattern");

		$scope.client.restoreSnapshot($scope.restore_snap.snapshot.repository, $scope.restore_snap.snapshot.snapshot, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot Restored Started");
				$scope.reload();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while started restore of snapshot", error);
				});
			}
		);
	};

	$scope.createRepository=function(){
		$scope.new_repo.settings = $scope.editor.format();
		if ($scope.editor.error === null){
			var body = {
				type: $scope.new_repo.type,
				settings: JSON.parse($scope.new_repo.settings)
			}

			$scope.client.createRepository($scope.new_repo.name, JSON.stringify(body),
				function(response) {
					AlertService.success("Repository created");
					$scope.loadRepositories();
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while creating repository", error);
					});
				}
			);
		}
	};

	$scope._parseRepositories=function(response, deferred){
		$scope.updateModel(function() {
			$scope.repositories = response;
			$scope.repositories_names = [];
			$.each($scope.repositories, function(key, value){
				$scope.repositories_names.push({"name":key, "value":key});
			});
		});
		deferred.resolve(true);
	};

	$scope.loadRepositories=function() {
		var deferred = $q.defer();
		try {
			$scope.client.getRepositories(
				function(response) {
					$scope._parseRepositories(response, deferred)
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while reading repositories", error);
					});
					deferred.reject(true);
				}
			)
		} catch (error) {
			AlertService.error("Failed to load repositories");
			deferred.reject(false);
		}
		return deferred.promise
	};

	$scope.createSnapshot=function(){
		var body = {}

		// name and repo required
		if(!angular.isDefined($scope.new_snap.repository))
		{
			AlertService.warn("Repository is required");
			return
		}

		if(!angular.isDefined($scope.new_snap.name))
		{
			AlertService.warn("Snapshot name is required");
			return
		}

		// dont add to body if not present, these are optional, all indices included by default
		if(angular.isDefined($scope.new_snap.indices) && $scope.new_snap.indices.length > 0)
		{
			body["indices"] = $scope.new_snap.indices.join(",");
		}

		if(angular.isDefined($scope.new_snap.include_global_state))
		{
			//TODO : when es fixes bug [https://github.com/elasticsearch/elasticsearch/issues/4949], this extra "true/false" -> true/false handling will go away
			body["include_global_state"] = ($scope.new_snap.include_global_state == 'true');
		}
		
		$scope.optionalParam(body, $scope.new_snap, "ignore_unavailable");

		$scope.client.createSnapshot($scope.new_snap.repository, $scope.new_snap.name, JSON.stringify(body),
			function(response) {
				AlertService.success("Snapshot created");
				$scope.reload();
			},
			function(error) {
				$scope.updateModel(function() {
					AlertService.error("Error while creating snapshot", error);
				});
			}
		);
	};

	$scope.deleteSnapshot=function(snapshot){
			$scope.dialog_service.open(
			"are you sure you want to delete snapshot " + snapshot.snapshot + "?",
			snapshot,
			"Delete",
			function() {
				$scope.client.deleteSnapshot(
					snapshot.repository,
					snapshot.snapshot,
					function(response) {
						AlertService.success("Snapshot successfully deleted", response);
						$scope.reload();
					},
					function(error) {
						$scope.updateModel(function() {
							AlertService.error("Error while deleting snapshot", error);
						});
					}
				);
			}
		);
	};

	$scope.allSnapshots=function(repositories) {
		var all = [];
		$.each( repositories, function( repository, value ){
			$scope.fetchSnapshots(repository).then(
					function(data){
						$.merge(all, data );
					});
		});
		$scope.snapshots = all;
	};

	$scope._parseSnapshots=function(repository, response, deferred) {
		var arr = response["snapshots"];

		// add the repository name to each snapshot object
		//
		if(arr && arr.constructor==Array && arr.length!==0){
			$.each(arr, function(index, value){
				value["repository"] = repository;
			});
		}
		deferred.resolve(response["snapshots"]);
	};

	$scope.fetchSnapshots=function(repository) {
		var deferred = $q.defer();
		try {
			$scope.client.getSnapshots(repository,
				function(response) {
					$scope._parseSnapshots(repository, response, deferred);
				},
				function(error) {
					$scope.updateModel(function() {
						AlertService.error("Error while fetching snapshots", error);
					});
					deferred.resolve([]);
				}
			)
		} catch (error) {
			AlertService.error("Failed to load snapshots");
			deferred.resolve([]);
		}
		return deferred.promise;
	};

}
