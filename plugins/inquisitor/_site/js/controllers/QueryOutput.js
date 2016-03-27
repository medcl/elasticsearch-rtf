

function QueryOutput($scope, $http, Data){
    $scope.data = Data;

    $scope.explain = function (id) {
        var path = $scope.data.host + "/" + $scope.data.currentIndex + "/" + $scope.data.currentType + "/" + id + "/_explain";
        var query = $scope.data.query;

        //console.log(id);

        //return [1,2,3];



        /*
        $http.post(path, query)
            .success(function(response){
                //console.log(response);
            })
            .error(function(data, status, headers, config){
                //console.log(data);

            });
        */
    };
}
