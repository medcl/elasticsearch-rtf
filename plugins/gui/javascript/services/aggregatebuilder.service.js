(function () {
    'use strict';

    angular
        .module('guiapp.services')
        .factory('aggregateBuilder', AggregateBuilder);

    function AggregateBuilder() {
        return {
            build: build
        };

        function build (aggs) {
            var queryaggs = {};

            angular.forEach(aggs, function (aggregation, key) {
                if (aggregation.aggsType === 'term') {
                    queryaggs[aggregation.name] = {"terms": {"field": aggregation.field}};
                } else if (aggregation.aggsType === 'range') {
                    var ranges = [];
                    for (var j = 0; j < aggregation.ranges.length; j++) {
                        var range = aggregation.ranges[j];
                        if (range[0] == undefined) {
                            ranges.push({"to": range[1]})
                        } else if (range[1] == undefined) {
                            ranges.push({"from": range[0]})
                        } else {
                            ranges.push({"from": range[0], "to": range[1]});
                        }
                    }
                    queryaggs[aggregation.name] = {"range": {"field": aggregation.field, "ranges": ranges}};
                } else if (aggregation.aggsType === 'datehistogram') {
                    queryaggs[aggregation.name] = {
                        "date_histogram": {
                            "field": aggregation.field,
                            "interval": aggregation.interval
                        }
                    };
                } else if (aggregation.aggsType === 'histogram') {
                    queryaggs[aggregation.name] = {
                        "histogram": {
                            "field": aggregation.field,
                            "interval": aggregation.interval
                        }
                    };
                }
            });
            return queryaggs;
        }
    }
})();
