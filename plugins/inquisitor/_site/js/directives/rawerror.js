

app.directive('rawerror', function($rootScope) {
    var linkFn = function(scope, element, attrs) {
        var label = angular.element(element.children()[0]);
        scope.showInput = false;
        scope.label = "Show Raw Error";
        label.bind("click", buttonClick);

        function buttonClick() {
            if (scope.showInput == true) {
                scope.label = "Show Raw Error";
                scope.$apply('showInput = false');
            } else {
                scope.label = "Hide Raw Error";
                scope.$apply('showInput = true');
            }
        }
    };
    return {
        link: linkFn,
        restrict: 'E',
        scope: {
            error: '@'
        },
        template: '<div class="btn">{{label}}</div><pre ng-show="showInput">{{error}}</pre>',
        transclude: true
    };
})

