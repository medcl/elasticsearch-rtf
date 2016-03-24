(function() {
    'use strict';
    angular
        .module('guiapp.aggregatedialog')
        .controller('AggregateDialogCtrl', AggregateDialogCtrl);

    AggregateDialogCtrl.$inject = ['$modalInstance', 'fields'];

    function AggregateDialogCtrl($modalInstance, fields) {
        var adVm = this;
        adVm.fields = fields;
        adVm.aggsTypes = ["Term", "Range", "Histogram", "DateHistogram"];
        adVm.ranges = [];
        adVm.intervals = ["year", "month", "week", "day", "hour", "minute"];

        adVm.close = close;
        adVm.addRangeField = addRangeField;

        function close (result) {
            var dialogResult = {};
            dialogResult.field = result.field;
            dialogResult.name = result.name;
            if (result.aggstype === 'Term') {
                dialogResult.aggsType = 'term';
            } else if (result.aggstype === 'Range') {
                dialogResult.aggsType = 'range';
                dialogResult.ranges = adVm.ranges;
            } else if (result.aggstype === 'DateHistogram') {
                dialogResult.aggsType = 'datehistogram';
                dialogResult.interval = result.interval;
            } else if (result.aggstype === 'Histogram') {
                dialogResult.aggsType = 'histogram';
                dialogResult.interval = result.interval;
            }
            $modalInstance.close(dialogResult);
        }

        function addRangeField(data) {
            adVm.ranges.push([data.range.from, data.range.to]);
        }
    }
})();