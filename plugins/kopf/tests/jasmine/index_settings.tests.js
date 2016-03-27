'use strict';

describe('IndexSettingsController', function() {

  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    var mock = {search: function() {
      return {index: 'testIndex'};
    }};
    var mockElastic = {
      isConnected: function() {
        return true;
      },
      refresh: function() {}
    };
    module(function($provide) {
      $provide.value('$location', mock);
      $provide.value('ElasticService', mockElastic);
    });
  });


  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    var $timeout = $injector.get('$timeout');
    var $location = $injector.get('$location');
    this.AlertService = $injector.get('AlertService');
    this.ElasticService = $injector.get('ElasticService');
    this.createController = function() {
      return $controller('IndexSettingsController', {$scope: this.scope},
          $location,
          $timeout, this.AlertService, this.ElasticService);
    };
    this._controller = this.createController();
  }));

  it('init : values are set', function() {
    expect(this.scope.index).toEqual(null);
    expect(this.scope.settings).toEqual(null);
    expect(this.scope.editable_settings).toEqual(null);
  });

  it('correctly initializes controller when created', function() {
    var client = this.ElasticService;
    client.getIndexMetadata = function(index, successCallback, errorCallback) {
      successCallback({settings: { a: 'b'}});
    };
    spyOn(this.ElasticService, 'getIndexMetadata').andCallThrough();
    this.scope.initializeController();
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith(
        'testIndex', jasmine.any(Function), jasmine.any(Function)
    );
    expect(this.scope.index).toEqual('testIndex');
    expect(this.scope.settings).toEqual({a: 'b'});
    expect(this.scope.editable_settings).not.toEqual(null);
    expect(this.scope.editable_settings.valid_settings).toEqual(
        new EditableIndexSettings({}).valid_settings
    );
  });

  it('alerts if there is a problem loading the index settings', function() {
    var client = this.ElasticService;
    client.getIndexMetadata = function(index, successCallback, errorCallback) {
      errorCallback('pff');
    };
    spyOn(this.ElasticService, 'getIndexMetadata').andCallThrough();
    spyOn(this.AlertService, 'error');
    this.scope.initializeController();
    expect(this.ElasticService.getIndexMetadata).toHaveBeenCalledWith(
        'testIndex', jasmine.any(Function), jasmine.any(Function)
    );
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error while loading index settings for [testIndex]',
        'pff'
    );
  });

  it('correctly ', function() {
    this.scope.index = "editedIndex";
    this.scope.settings = {'index.codec': 'fakeCodec', 'nonValidSetting': 'useless'};
    this.scope.editable_settings = new EditableIndexSettings({'index.codec': 'fakeCodec'});

    var client = this.ElasticService;
    client.updateIndexSettings = function(index, body, successCallback,
                                          errorCallback) {
      successCallback({greatSuccess: '!!'});
    };
    spyOn(this.AlertService, 'success');
    spyOn(this.ElasticService, 'refresh');
    spyOn(this.ElasticService, 'updateIndexSettings').andCallThrough();
    this.scope.save();
    expect(this.ElasticService.updateIndexSettings).toHaveBeenCalledWith(
        'editedIndex',
        JSON.stringify({'index.codec': 'fakeCodec'}, undefined, ''),
        jasmine.any(Function), jasmine.any(Function)
    );
    expect(this.AlertService.success).toHaveBeenCalledWith('Index settings were successfully updated',
        {greatSuccess: '!!'});
    expect(this.ElasticService.refresh).toHaveBeenCalled();
  });


//  var index = $scope.index;
//  var settings = $scope.settings;
//  var newSettings = {};
//  var editableSettings = $scope.editable_settings;
//  // TODO: could move that to editable_index_settings model
//  editableSettings.valid_settings.forEach(function(setting) {
//    if (notEmpty(editableSettings[setting])) {
//      newSettings[setting] = editableSettings[setting];
//    }
//  });
//  ElasticService.updateIndexSettings(index,
//      JSON.stringify(newSettings, undefined, ''),
//      function(response) {
//        AlertService.success('Index settings were successfully updated',
//            response);
//        ElasticService.refresh();
//      },
//      function(error) {
//        AlertService.error('Error while updating index settings', error);
//      }
//  );


});
