
app.filter('jsonlint', function(){
    return function (query) {
        var json = '';

        //if it's a string, parse first then stringify
        //This lets us retrieve parse errors, or return nicely formatted json
        if (typeof(query)=='string') {
            try {
                json =  jsonlint.parse(query.toString());
                return JSON.stringify(json, null, "  ");
            } catch(e){
                return e.toString();
            }
        } else {

            //First stringify the object for nice formatting
            //Then parse, to see if there are errors.  Throw away result
            //and return pretty json
            try {
                json =  JSON.stringify(query, null, "  ");
                jsonlint.parse(json);
                return json;
            } catch(e){
                return e.toString();
            }
        }


    }
});


app.filter('jsonparse', function(){
    return function (query) {
        try {
            return jsonlint.parse(query.toString());

        } catch(e){
            return e.toString();
        }

    }
});