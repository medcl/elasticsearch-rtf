describe('GlobalController', function() {
    var scope, createController;

    var $location, $timeout, $window;

    beforeEach(angular.mock.module('kopf'));

    beforeEach(function () {
        module('kopf');

        var mock = { location: { href: 'http://whateverhost:1234?location=http://anotherhost:12345' } };

        module(function ($provide) {
            $provide.value('$window', mock);
        });

        inject(function (_$compile_, _$rootScope_) {
            $compile = _$compile_;
            $rootScope = _$rootScope_;
        });
    });

    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
        this.scope = $rootScope.$new();
        $timeout = $injector.get('$timeout');
        $location = $injector.get('$location');
        $window = $injector.get('$window');
        this.AlertService = $injector.get('AlertService');
        this.ConfirmDialogService = $injector.get('ConfirmDialogService');
        this.SettingsService = $injector.get('SettingsService');
        this.ThemeService = $injector.get('ThemeService');
        this.ElasticService = $injector.get('ElasticService');
        this.ElasticService.client = {};
        this.createController = function() {
            return $controller('GlobalController', {$scope: this.scope, $location: $location, $timeout: $timeout, $window: $window});
        };
        this._controller = this.createController();
    }));

    it('should correctly read location parameter', function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        var location = this.scope.readParameter('location');
        expect(location).toEqual("http://anotherhost:12345");
    });

});

describe('GlobalController', function(){
    var scope, createController;

    var $location, $timeout, $window;

    beforeEach(angular.mock.module('kopf'));

    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
        this.scope = $rootScope.$new();
        $timeout = $injector.get('$timeout');
        $location = $injector.get('$location');
        $window = $injector.get('$window');
        this.AlertService = $injector.get('AlertService');
        this.ConfirmDialogService = $injector.get('ConfirmDialogService');
        this.SettingsService = $injector.get('SettingsService');
        this.ThemeService = $injector.get('ThemeService');
        this.ElasticService = $injector.get('ElasticService');
        this.ElasticService.client = {};
        this.createController = function() {
            return $controller('GlobalController', {$scope: this.scope, $location: $location, $timeout: $timeout, $window: $window});
        };
        this._controller = this.createController();
    }));

    it('init : values are set', function() {
        expect(this.scope.modal.alert).toEqual(null);
        expect(this.scope.modal.active).toEqual(false);
        expect(this.scope.modal.title).toEqual('');
        expect(this.scope.modal.info).toEqual('');
    });

    it('should connect to default address when running kopf from file', function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        spyOn($location, 'host').andReturn('');
        spyOn(this.scope, 'home_screen').andReturn('');
        this.scope.connect();
        expect(this.ElasticService.connect).toHaveBeenCalledWith('http://localhost:9200');
        expect(this.scope.home_screen).toHaveBeenCalled();
    });

    it('should read from location parameter when present', function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        spyOn($location, 'host').andReturn('http://localhost:9200');
        spyOn(this.scope, 'home_screen').andReturn('');
        spyOn(this.scope, 'readParameter').andReturn('http://1.2.3.4:9200');
        this.scope.connect();
        expect(this.ElasticService.connect).toHaveBeenCalledWith('http://1.2.3.4:9200');
        expect(this.scope.home_screen).toHaveBeenCalled();
    });

    it('should use kopf running host if no location parameter is found', function() {
        spyOn(this.ElasticService, 'connect').andReturn('');
        spyOn($location, 'absUrl').andReturn('http://thishost:4321/_plugin/kopf');
        spyOn(this.scope, 'home_screen').andReturn('');
        this.scope.connect();
        expect(this.ElasticService.connect).toHaveBeenCalledWith('http://thishost:4321');
        expect(this.scope.home_screen).toHaveBeenCalled();
    });

});