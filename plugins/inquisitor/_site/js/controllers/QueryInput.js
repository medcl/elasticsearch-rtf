
function QueryInput($scope, $http, $filter, Data, pubsub){
    $scope.data = Data;
    $scope.pubsub = pubsub;
  
    $scope.hostChanged = function(){
      $scope.pubsub.publish('HOST_CHANGED', $scope.data.host);
    };

    $scope.$watch('data.query', function(value){
        try {
            $scope.autodetectField();
        } catch (e) {}
    })

    $scope.$watch('data.currentIndex', function(value){
        if ($scope.data.currentIndex === '') {
            $scope.data.indexMissing = true;
            return;
        }
        else{
            $scope.data.indexMissing = false;
        }

        try {
            $scope.autodetectField();
        } catch (e) {}
    })

    $scope.$watch('data.currentType', function(value){
        if ($scope.data.currentType === '') {
            $scope.data.typeMissing = true;
            return;
        }
        else{
            $scope.data.typeMissing = false;
        }

        try {
            $scope.autodetectField();
        } catch (e) {}
    })

    $scope.autodetectField = function() {
        $scope.data.autodetectfield = false;

        for (i in $scope.data.mapping[$scope.data.currentIndex].mappings[$scope.data.currentType].properties){
            if ($scope.data.query.match(i)){
                console.log("match",i);
                $scope.data.autodetectfield = true;
            }

        }
    }

    $scope.executeQuery = function() {
        $scope.query();
        $scope.validate();
    }

    $scope.query = function() {

        //inject the highlighter
        var query = $scope.data.query.slice(0,-1);
        var highlightFields = [];
        for (i in $scope.data.mapping[$scope.data.currentIndex].mappings[$scope.data.currentType].properties){
            if (query.match(i))
                highlightFields.push('"' + i + '": {}');
        }

        //if there are no fields specified, or _all is explicitly defined, add _all
        if (highlightFields.length === 0 || query.match('_all')){
            highlightFields.push('"_all": {}');
        }


        query = query + ',' + $scope.data.highlight + highlightFields.join(',') + '}}}';

        var path = $scope.data.host + "/" + $scope.data.currentIndex + "/" + $scope.data.currentType + "/_search";

        $http.post(path, query)
            .success(function(response){
                $scope.data.elasticError = [];
                $scope.data.elasticResponse = response;
                console.log(response);
            })
            .error(function(data, status, headers, config){
                $scope.data.elasticResponse = [];
                $scope.data.elasticValidation = [];
                if (status == '400')
                    $scope.data.elasticError = data;
                else {

                    $errorMessage = data.error.split(/(.*?)\[([\s\S]+)\]?/);
                    var errorData = {Error: "", details: [], rawError : "", status: status};

                    errorData.rawError = data;
                    errorData.Error = $errorMessage[1];

                    var nested = $errorMessage[2].split("nested:");

                    for (i in nested){
                        var tempObject = {};
                        if (i == 0) {
                            tempObject.errorName = "Error";
                            tempObject.errorDesc = nested[i];
                            errorData.details.push(tempObject);
                        } else {
                            var nestedError = nested[i].split(/(.*?)\[([\s\S]+)\]?/);
                            tempObject.errorName = nestedError[1];
                            tempObject.errorDesc = nestedError[2];
                            errorData.details.push(tempObject);
                        }
                    }

                    $scope.data.elasticError = errorData;
                }

            });
    };

    $scope.validate = function() {

        //validate API needs just the query, not the wrapping "query":{}
        //Parse to JSON and extract just the query portion
        try {
            var query = JSON.parse($scope.data.query);
            var query = JSON.stringify(query.query);
        } catch (e){
            //if there was an error, it probably wasn't valid JSON.
            //The error reporting from query() will catch it
            return;
        }

        console.log(query);

        var path = $scope.data.host + "/" + $scope.data.currentIndex  + "/_validate/query?explain=true";

        $http.post(path, query)
            .success(function(response){
                console.log(response);
                $scope.data.elasticValidation = response;
            })
            .error(function(data, status, headers, config){
                console.log(data);
                $scope.data.elasticValidation = data;

            });
    };
}
