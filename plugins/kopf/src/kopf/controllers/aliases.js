kopf.controller('AliasesController', ['$scope', 'AlertService',
  'AceEditorService', 'ElasticService',
  function($scope, AlertService, AceEditorService, ElasticService) {

    $scope.paginator = new Paginator(1, 10, [], new AliasFilter('', ''));
    $scope.page = $scope.paginator.getPage();
    $scope.original = [];
    $scope.editor = undefined;
    $scope.new_alias = new Alias('', '', '', '', '');

    $scope.aliases = [];

    $scope.$watch(
        function() {
          return ElasticService.cluster;
        },
        function(filter, previous) {
          $scope.indices = ElasticService.getIndices();
        },
        true
    );

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.viewDetails = function(alias) {
      $scope.details = alias;
    };

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('alias-filter-editor');
      }
    };

    $scope.addAlias = function() {
      $scope.new_alias.filter = $scope.editor.format();
      if (!isDefined($scope.editor.error)) {
        try {
          $scope.new_alias.validate();
          var indexName = $scope.new_alias.index;
          var aliasName = $scope.new_alias.alias;
          // if alias already exists, check if its already associated with index
          var collection = $scope.paginator.getCollection();
          var indices = collection.filter(function(a) {
            return a.index == indexName;
          });
          if (indices.length === 0) {
            collection.push(new IndexAliases(indexName, [$scope.new_alias]));
          } else {
            var indexAliases = indices[0];
            var aliases = indexAliases.aliases.filter(function(a) {
              return aliasName == a.alias;
            });
            if (aliases.length > 0) {
              throw 'Alias is already associated with this index';
            } else {
              indexAliases.aliases.push($scope.new_alias);
            }
          }
          $scope.new_alias = new Alias();
          $scope.paginator.setCollection(collection);
          $scope.page = $scope.paginator.getPage();
          AlertService.success('Alias successfully added. Note that changes ' +
              'made will only be persisted after saving changes');
        } catch (error) {
          AlertService.error(error, null);
        }
      } else {
        AlertService.error('Invalid filter defined for alias',
            $scope.editor.error);
      }
    };

    $scope.removeIndexAliases = function(index) {
      var collection = $scope.paginator.getCollection();
      for (var position = 0; position < collection.length; position++) {
        if (index == collection[position].index) {
          collection.splice(position, 1);
          break;
        }
      }
      $scope.paginator.setCollection(collection);
      $scope.page = $scope.paginator.getPage();
      AlertService.success('All aliases were removed for ' + index);
    };

    $scope.removeIndexAlias = function(index, alias) {
      var indexPosition = 0;
      var collection = $scope.paginator.getCollection();
      for (; indexPosition < collection.length; indexPosition++) {
        if (index == collection[indexPosition].index) {
          break;
        }
      }
      var indexAliases = collection[indexPosition];
      var size = indexAliases.aliases.length;
      for (var aliasPosition = 0; aliasPosition < size; aliasPosition++) {
        if (alias == indexAliases.aliases[aliasPosition].alias) {
          indexAliases.aliases.splice(aliasPosition, 1);
          if (indexAliases.aliases.length === 0) {
            collection.splice(indexPosition, 1);
          }
          break;
        }
      }
      $scope.paginator.setCollection(collection);
      $scope.page = $scope.paginator.getPage();
      AlertService.success('Alias successfully dissociated from index. ' +
          'Note that changes made will only be persisted after saving changes');
    };

    $scope.mergeAliases = function() {
      var collection = $scope.paginator.getCollection();
      var deletes = IndexAliases.diff(collection, $scope.original);
      var adds = IndexAliases.diff($scope.original, collection);
      if (adds.length === 0 && deletes.length === 0) {
        AlertService.warn('No changes were made: nothing to save');
      } else {
        ElasticService.updateAliases(adds, deletes,
            function(response) {
              AlertService.success('Aliases were successfully updated',
                  response);
              $scope.loadAliases();
            },
            function(error) {
              AlertService.error('Error while updating aliases', error);
            }
        );
      }
    };

    $scope.loadAliases = function() {
      ElasticService.fetchAliases(
          function(indexAliases) {
            $scope.original = indexAliases.map(function(ia) {
              return ia.clone();
            });
            $scope.paginator.setCollection(indexAliases);
            $scope.page = $scope.paginator.getPage();
          },
          function(error) {
            AlertService.error('Error while fetching aliases', error);
          }
      );
    };

    $scope.initializeController = function() {
      $scope.indices = ElasticService.getIndices();
      $scope.loadAliases();
      $scope.initEditor();
    };

  }
]);
