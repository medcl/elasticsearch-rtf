kopf.directive('ngStaticInclude', function() {
  return {
    templateUrl: function(elem, attr) {
      return './partials/' + attr.file + '.html';
    }
  };
});
