(function(kopf, JSONTree) {
  'use strict';
  kopf.directive('kopfJsonTree', function($sce) {
    var directive = {
      restrict: 'E',
      template:'<div class="json-tree" ng-bind-html="result"></div>',
      scope: {
        kopfBind: '='
      },
      link: function(scope, element, attrs, requires) {
        scope.$watch('kopfBind', function(value) {
          var result;
          if (value) {
            try {
              result = JSONTree.create(value);
            } catch (invalidJsonError) {
              result = invalidJsonError;
            }
          } else {
            result = '';
          }

          scope.result = $sce.trustAsHtml(result);
        });
      }
    };
    return directive;
  });
})(kopf, JSONTree);
