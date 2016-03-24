
function DropdownCtrl($scope, $http, Data, pubsub) {
    $scope.data = Data;
    $scope.pubsub = pubsub;
    $scope.indices = [];
    $scope.types = [];

    $scope.pubsub.subscribe('HOST_CHANGED', function(newHost){
      $scope.data.host = newHost;
      $scope.loadMappings();
    });

    $scope.loadMappings = function(){
      var path = $scope.data.host + "/_mapping";
      $http.get(path).then(function(response){
          if($scope.indices && $scope.indices.length > 0){
              $scope.indicies.length = 0;
          }
          $scope.data.mapping = response.data;

          for (i in response.data){

              $scope.indices.push(i);
              $scope.types[i] = [];
              for (j in response.data[i].mappings){

                  $scope.types[i].push(j);
              }
          }


          path = $scope.data.host + "/_aliases";
          $http.get(path).then(function(response){

            for (i in response.data){
              for (j in response.data[i].aliases) {
                $scope.indices.push(j);
                $scope.types[j] = $scope.types[i];
                $scope.data.mapping[j] = $scope.data.mapping[i];
              }
            }

            $scope.indices.sort();
            $scope.types.sort();
          });
      });
    };
    $scope.loadMappings();
}
