describe('GlobalController', function() {
  var scope, createController;

  var $location, $timeout, $window;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    module(function($provide) {
      $provide.value('ElasticService', {
        isConnected: function() {
          return true;
        },
        refresh: function() {}
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    $timeout = $injector.get('$timeout');
    $location = $injector.get('$location');
    this.AlertService = $injector.get('AlertService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.ElasticService = $injector.get('ElasticService');
    var mock = { location: { href: 'http://whateverhost:1234?location=http://anotherhost:12345' } };
    this.createController = function() {
      return $controller('GlobalController',
          {$scope: this.scope, $location: $location, $timeout: $timeout, $window: mock});
    };
    this._controller = this.createController();
  }));

  it('should correctly read location parameter', function() {
    this.ElasticService.connect = function() {};
    spyOn(this.ElasticService, 'connect').andReturn('');
    var location = this.scope.readParameter('location');
    expect(location).toEqual("http://anotherhost:12345");
  });

});

describe('GlobalController', function() {
  var scope, createController;

  var $location, $timeout, $window;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    module(function($provide) {
      $provide.value('ElasticService', {
        isConnected: function() {
          return true;
        },
        refresh: function() {},
        connect: function() {}
      });
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    $timeout = $injector.get('$timeout');
    $location = $injector.get('$location');
    $window = $injector.get('$window');
    this.AlertService = $injector.get('AlertService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.ElasticService = $injector.get('ElasticService');
    this.createController = function() {
      return $controller('GlobalController',
          {$scope: this.scope, $location: $location, $timeout: $timeout, $window: $window});
    };
    this._controller = this.createController();
  }));

  it('init : values are set', function() {
    expect(this.scope.modal.alert).toEqual(null);
    expect(this.scope.modal.active).toEqual(false);
    expect(this.scope.modal.title).toEqual('');
    expect(this.scope.modal.info).toEqual('');
  });

  it('should connect to default address when running kopf from file',
      function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        spyOn($location, 'host').andReturn('');
        this.scope.connect();
        expect(this.ElasticService.connect).toHaveBeenCalledWith('http://localhost:9200');
      });

  it('should read from location parameter when present', function() {
    spyOn(this.ElasticService, 'connect').andReturn('');
    spyOn($location, 'host').andReturn('http://localhost:9200');
    spyOn(this.scope, 'readParameter').andReturn('http://1.2.3.4:9200');
    this.scope.connect();
    expect(this.ElasticService.connect).toHaveBeenCalledWith('http://1.2.3.4:9200');
  });

  it('should use kopf running host if no location parameter is found',
      function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        spyOn($location,
            'absUrl').andReturn('http://thishost:4321/_plugin/kopf');
        this.scope.connect();
        expect(this.ElasticService.connect).toHaveBeenCalledWith('http://thishost:4321');
      });

  it('should warn if not supported version is found', function() {
    this.ElasticService.getVersion = function(){};
    spyOn(this.ElasticService, 'getVersion').andReturn(new Version('1.0.0'));
    spyOn(this.AlertService, 'warn').andReturn('');
    this.ElasticService.cluster = '';
    this.scope.$digest();
    expect(this.AlertService.warn).toHaveBeenCalledWith(
        'This version of kopf is not compatible with your ES version',
        'Upgrading to newest supported version is recommeded'
    );
  });

  it('should NOT warn if supported version is found', function() {
    this.ElasticService.getVersion = function(){};
    spyOn(this.ElasticService, 'getVersion').andReturn(new Version('2.0.0'));
    spyOn(this.AlertService, 'warn').andReturn('');
    this.ElasticService.cluster = '';
    this.scope.$digest();
    expect(this.AlertService.warn).not.toHaveBeenCalledWith();
  });

});