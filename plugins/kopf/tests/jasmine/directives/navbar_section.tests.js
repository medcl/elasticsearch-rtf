describe('ngNavbarSection', function() {
  var $compile, $rootScope, $location;

  beforeEach(module('kopf'));

  beforeEach(function() {
    module('kopf');
    module(function($provide) {
      $provide.value('ElasticService', {
        versionCheck: function() {
          return true;
        }
      });
    });
  });

  beforeEach(inject(function(_$compile_, _$rootScope_, _$location_) {
    $compile = _$compile_;
    $rootScope = _$rootScope_;
    $location = _$location_;
    this.scope = $rootScope.$new();
  }));

  it('Creates correct HTML', function() {
    var element = $compile('<li ng-navbar-section target="snapshot" text="snapshot text" icon="fa-camera"></li>')($rootScope);
    $rootScope.$digest();
    expect(element.html()).toContain('<a href="#!snapshot"><i class="fa fa-fw fa-camera"></i> snapshot text</a>');
  });

});
