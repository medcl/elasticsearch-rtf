kopf.directive('ngNavbarSection', ['$location', 'ElasticService',
  function($location, ElasticService) {

    return {
      template: function(elem, attrs) {
        if (!attrs.version || ElasticService.versionCheck(attrs.version)) {
          var target = attrs.target;
          var text = attrs.text;
          var icon = attrs.icon;
          return '<a href="#!' + target + '">' +
              '<i class="fa fa-fw ' + icon + '"></i> ' + text +
              '</a>';
        } else {
          return '';
        }
      }
    };
  }

]);
