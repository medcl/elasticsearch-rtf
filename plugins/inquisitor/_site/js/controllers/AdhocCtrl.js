


// "class" for customizing select2 (with possibility to create selection items on the fly
// Appropriated from http://jsfiddle.net/7AvKZ/59/
// Only minor changes made to this class - largely the original
function Select2Tagging(items,formatProperty, multienabled) {
    if(!formatProperty) {
        formatProperty="text";
    }

    if (typeof multienabled === "undefined") {
        multienabled = true;
    }


    var f={};
    f.formatProperty=formatProperty;

    f.data=items;

    var itemMap={};
    $.each(items,function(index,value){
        itemMap[value.id]=value;
    });

    f.initSelection = function(element, callback) {
        var data = [];
        var eleVal=element.val();

        var ids = eleVal.split(",");
        $(ids).each(function() {
            var id=this;
            $(f.data).each(function() {
                if (id.localeCompare(""+this.id)==0) data.push(this);
            });
        });
        callback(data);
    };

    f.createSearchChoice = function(term, data) {
        if ($(data).filter(function() {
                return this[f.formatProperty].localeCompare(term) === 0;
                //return this.text.localeCompare(term) === 0;
            }
        ).length === 0) {
            var result= {
                id: term,
                //text: term
            };
            result[f.formatProperty]=term;
            return result;
        }
    };

    formatResult=function(item) {
        if(item[f.formatProperty]) {
            return item[f.formatProperty];
        } else {
            return item;
        }

    };

    formatSelection=function(item) {
        if(item[f.formatProperty]) {
            return item[f.formatProperty];
        } else {
            return item;
        }

    };

    f.formatResult= formatResult;
    f.formatSelection= formatSelection;
    f.multiple = multienabled;
    return f;
}




function AdhocCtrl($scope, $http, Analyzer, Tokenizer, Filter, Data){
    $scope.analyzer = Analyzer;
    $scope.tokenizer = Tokenizer;
    $scope.filter = Filter;
    $scope.data = Data;



    $scope.tokenizerSelection = [];
    $scope.filterSelection = [];

    //Select2 requires objects in format of {id:0, name: 'val'}
    //Convert our tokenizer array into a local object
    var availTokenizers = [];
    for (i in $scope.tokenizer.tokenizers) {
        availTokenizers.push( {id: i, name: $scope.tokenizer.tokenizers[i]});
    }
    $scope.tokenizerAllOptions = new Select2Tagging(availTokenizers, 'name', false);




    //Select2 requires objects in format of {id:0, name: 'val'}
    //Convert our filter array into a local object
    var availFilters = [];
    for (i in $scope.filter.filters) {
        availFilters.push( {id: i, name: $scope.filter.filters[i]});
    }
    $scope.filterAllOptions = new Select2Tagging(availFilters, 'name');




    $scope.$watch('tokenizerSelection', function(selection) {
        $scope.analyzeAdhoc($scope.tokenizerSelection, $scope.filterSelection);
    });

    $scope.$watch('filterSelection', function(selection) {
        $scope.analyzeAdhoc($scope.tokenizerSelection, $scope.filterSelection);
    });

    //If the text changes, query ES to get the tokens
    $scope.$watch('analyzer.query', function(value){
        $scope.analyzeAdhoc($scope.tokenizerSelection, $scope.filterSelection);
    });



    $scope.analyzeAdhoc = function(tokenizer, filters) {

        //tokenizer must be supplied, filters is optional
        if (typeof tokenizer === "undefined" || tokenizer.length == 0)
            return;


        var filterList = [];

        for (i in filters) {
            filterList.push(filters[i].name);
        }

        filterList = filterList.join(",");



        var path = $scope.data.host + "/_analyze?tokenizer=" + tokenizer.name + "&filters=" + filterList;

        $http.post(path, $scope.analyzer.query)
            .success(function(response){
                var tokens = [];
                for(i in response.tokens){
                    tokens.push(response.tokens[i]);
                }
                $scope.analyzer.atext['adhoc'] = tokens;

            })
            .error(function(data, status, headers, config){
                //console.log(data);

            });
    }
};





