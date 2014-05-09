

function TokenizerCtrl($scope, $http, Tokenizer, Data){
    $scope.tokenizer = Tokenizer;
    $scope.data = Data;

    $scope.$watch('tokenizer.query', function(value){
        for (i in $scope.tokenizer.tokenizers){
            $scope.analyze($scope.tokenizer.tokenizers[i]);
        }
    });

    $scope.analyze = function(tokenizer) {
        var path = $scope.data.host + "/_analyze?tokenizer=" + tokenizer;

        $http.post(path, $scope.tokenizer.query)
            .success(function(response){
                var tokens = [];
                for(i in response.tokens){
                    var token = response.tokens[i];

                    //bootstrap labels do silly things with only a single space
                    if (token.token === ' ') {token.token = "&nbsp;";}

                    tokens.push(token);
                }
                $scope.tokenizer.ttext[tokenizer] = tokens;

            })
            .error(function(data, status, headers, config){
                //console.log(data);

            });
    }

}
