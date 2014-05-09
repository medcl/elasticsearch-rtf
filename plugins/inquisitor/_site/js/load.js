(function() {
    "use strict";

    head.js("js/vendor/json2.js")
        .js("js/vendor/jsonlint.js")
        .js("//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js","js/vendor/angular.min.js", function() {
            head.js("js/vendor/angular-sanitize.min.js","js/vendor/ng-bootstrap/ui-bootstrap-custom-tpls-0.1.0-SNAPSHOT.min.js","js/vendor/select2/select2.min.js","js/vendor/select2/angular-ui.min.js", "js/app.js", function() {
                head.js("js/controllers/DropdownCtrl.js")
                    .js("js/controllers/AnalyzerCtrl.js")
                    .js("js/controllers/TokenizerCtrl.js")
                    .js("js/controllers/NavbarCtrl.js")
                    .js("js/controllers/AdhocCtrl.js")
                    .js("js/controllers/QueryInput.js")
                    .js("js/controllers/QueryOutput.js")
                    .js("js/directives/modal.js")
                    .js("js/directives/rawerror.js")
                    .js("js/filters/jsonlint.js");
            });
        });




}).call(this);

