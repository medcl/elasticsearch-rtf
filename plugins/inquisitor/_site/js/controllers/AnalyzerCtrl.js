
/**
 * Misc functions
 */

function isUndefined(value) {
    return typeof value === "undefined";
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}


function AnalyzerCtrl($scope, $http, Analyzer, Data){
    $scope.analyzer = Analyzer;
    $scope.data = Data;



    /**
     * Detection section
     *
     * These functions detect mappings, fields, etc
     */


    $scope.detect = function() {
        var path = $scope.data.host + "/_cluster/state";

        $http.get(path)
            .success(function(response){
                console.log(response);

                //process custom analyzers
                detectCustomAnalzyers(response);

                //process fields from mapping
                detectFields(response);

            })
            .error(function(data, status, headers, config){
                //console.log(data);

            });
    }

    function detectFields(response) {
        for (i in response.metadata.indices) {
            for (j in response.metadata.indices[i].mappings){
                for (k in response.metadata.indices[i].mappings[j].properties) {

                    //is this a multi_field?
                    if (response.metadata.indices[i].mappings[j].properties[k].hasOwnProperty("fields")){
                        for(m in response.metadata.indices[i].mappings[j].properties[k].fields) {

                            if (typeof $scope.analyzer.fields[i] === "undefined") {
                                $scope.analyzer.fields[i] = [];
                                $scope.analyzer.currentField[i] = "";
                            }

                            if (k === m){
                                $scope.analyzer.fields[i].push(k);
                            } else {
                                $scope.analyzer.fields[i].push(k + "." + m);
                            }
                        }
                    } else {
                        if (typeof $scope.analyzer.fields[i] === "undefined") {
                            $scope.analyzer.fields[i] = [];
                            $scope.analyzer.currentField[i] = "";
                        }

                        $scope.analyzer.fields[i].push(k);
                    }


                }
            }
        }
    }

    function detectCustomAnalzyers(response) {

        //This section loops over all the 'settings' objects and converts
        //the long "path-like" parameters into objects - kludgy...probably a better way to do this
        $scope.analyzer.customAnalyzers = {};
        for (i in response.metadata.indices) {
            $scope.analyzer.customAnalyzers[i] = {};
            for (j in response.metadata.indices[i].settings){

                //We keep reducing until counter == length of the split params array
                //At that point, we assign the value of j instead of returning a new, nested
                //object
                var params = j.split('.');
                var counter = 0;

                j.split('.').reduce(function(m,a) {
                    counter += 1;

                    if (typeof m[a] === "undefined"){
                        if (counter == params.length)
                            m[a] = response.metadata.indices[i].settings[j];
                        else
                            m[a] = {};
                    }

                    return m[a];
                }, $scope.analyzer.customAnalyzers[i]);

            }
        }

    }

    //Begin the actual detection
    $scope.detect();




    /**
     * Watch section
     *
     * These functions monitor changes in text or analyzers and update the view
     */

    //If the text changes, query ES to get the tokens
    $scope.$watch('analyzer.query', function(value){

        console.log($scope.analyzer.atext);

        //first update standard analyzers
        updateStandardAnalyzers();

        //then update custom analyzers
        for (index in $scope.analyzer.customAnalyzers){
            updateCustomAnalyzer(index);
        }

        //then update per-field analyzers
        for (index in $scope.analyzer.fields) {
            updateField(index);
        }
    });

    //Because detectCustomAnalyzers executes asynch, we need to watch the customAnalyzer field
    //to detect when the GET returns
    $scope.$watch('analyzer.customAnalyzers', function(value) {
        for (index in $scope.analyzer.customAnalyzers){
            updateCustomAnalyzer(index);
        }
    });

    //If any of the user-selected fields change, update
    $scope.$watch('analyzer.currentField', function(value) {
        for (index in $scope.analyzer.fields) {
            updateField(index);
        }
    }, true);

    //This function is called when the "Enable" checkbox is toggled.
    //Used to selectively update indices without calling the update* functions
    $scope.indexEnabled = function(index) {
        if(! $scope.analyzer.customAnalyzers[index].enable)
            return;

        //update the custom analyzers
        updateCustomAnalyzer(index);

        //and individual fields
        updateField(index);

    }


    /**
     * Update section
     *
     * These methods are helpers to the Watch section
     */

    function updateStandardAnalyzers() {
        for (index in $scope.analyzer.analyzers){
            $scope.analyzeStandard($scope.analyzer.analyzers[index]);
        }
    }

    function updateCustomAnalyzer(index){

        //Only query indices that are enabled
        if ( isUndefined($scope.analyzer.customAnalyzers[index]) || ! $scope.analyzer.customAnalyzers[index].enable )
            return;

        //Make sure this index has some analyzer defined
        if (typeof $scope.analyzer.customAnalyzers[index].index.analysis !== "undefined"
            && typeof $scope.analyzer.customAnalyzers[index].index.analysis.analyzer !== "undefined") {

            for (cAnalyzer in $scope.analyzer.customAnalyzers[index].index.analysis.analyzer) {
                $scope.analyzeCustom(cAnalyzer, index);
            }
        }

    }

    function updateField(index) {

        //Only query indices that are enabled
        if ( isUndefined($scope.analyzer.customAnalyzers[index]) || ! $scope.analyzer.customAnalyzers[index].enable )
            return;

        //if a currentField is set for this index
        if ($scope.analyzer.currentField[index])
            $scope.analyzeField($scope.analyzer.currentField[index], index);

    }


    /**
     * Analyze section
     *
     * These functions query ES and perform the actual analysis
     */

    $scope.analyzeStandard = function(analyzer) {

        var path = $scope.data.host + "/_analyze?analyzer=" + analyzer;

        $http.post(path, $scope.analyzer.query)
            .success(function(response){
                var tokens = [];
                for(i in response.tokens){
                    tokens.push(response.tokens[i]);
                }
                $scope.analyzer.atext['standard.' + analyzer] = tokens;

            })
            .error(function(data, status, headers, config){
                $scope.analyzer.atext[index + '.' + field] = [];
                $scope.analyzer.atext[index + '.' + field].push({token:data.error});
            });
    }

    $scope.analyzeCustom = function(analyzer, index) {

        var path = $scope.data.host + "/" + index + "/_analyze?analyzer=" + analyzer;

        $http.post(path, $scope.analyzer.query)
            .success(function(response){
                var tokens = [];
                for(i in response.tokens){
                    tokens.push(response.tokens[i]);
                }
                $scope.analyzer.atext[index + '.' + analyzer] = tokens;
            })
            .error(function(data, status, headers, config){
                $scope.analyzer.atext[index + '.' + field] = [];
                $scope.analyzer.atext[index + '.' + field].push({token:data.error});
            });
    }

    $scope.analyzeField = function(field, index) {

        var path = $scope.data.host + "/" + index + "/_analyze?field=" + field;

        $http.post(path, $scope.analyzer.query)
            .success(function(response){
                var tokens = [];
                for(i in response.tokens){
                    tokens.push(response.tokens[i]);
                }
                $scope.analyzer.atext[index + '.' + field] = tokens;

            })
            .error(function(data, status, headers, config){
                $scope.analyzer.atext[index + '.' + field] = [];
                $scope.analyzer.atext[index + '.' + field].push({token:data.error});
            });
    }







}
