"use strict";

describe("ExternalSettingsService", function() {

  var service;

  beforeEach(module("kopf"));

  beforeEach(function() {
    var store = {};
    spyOn(localStorage, 'getItem').andCallFake(function(key) {
      return store[key];
    });
    spyOn(localStorage, 'setItem').andCallFake(function(key, value) {
      return store[key] = value + '';
    });
    spyOn(localStorage, 'clear').andCallFake(function() {
      store = {};
    });
  });

  beforeEach(inject(function($injector) {
    service = $injector.get('ExternalSettingsService');
    this.DebugService = $injector.get('DebugService');
  }));

  it("should correctly save/retrieve settings to/from localstorage",
      function() {
        var settings = {refresh_rate: 'doesntmatter', theme: 'whatever'};
        service.settings = settings;
        service.saveSettings();
        expect(localStorage.setItem).toHaveBeenCalledWith('kopfSettings',
            JSON.stringify(settings));
        expect(service.loadLocalSettings()).toEqual(settings);
      });

  it("should correctly save/retrieve ONLY updatable settings",
      function() {
        var settings = {refresh_rate: 'doesntmatter', theme: 'whatever', other: 'a'};
        var expectedSettings = {refresh_rate: 'doesntmatter', theme: 'whatever'};
        service.settings = settings;
        service.saveSettings();
        expect(localStorage.setItem).toHaveBeenCalledWith('kopfSettings',
            JSON.stringify(expectedSettings));
        expect(service.loadLocalSettings()).toEqual(expectedSettings);
      });

  it("should handle invalid sotred content",
      function() {
        localStorage.setItem('kopfSettings', "invalid json");
        spyOn(this.DebugService, 'debug').andReturn(true);
        var settings = service.loadLocalSettings();
        expect(localStorage.getItem).toHaveBeenCalledWith('kopfSettings');
        expect(this.DebugService.debug).toHaveBeenCalled();
        expect(settings).toEqual({});
      });

  it("should handle invalid sotred content",
      function() {
        localStorage.setItem('kopfSettings', "invalid json");
        spyOn(this.DebugService, 'debug').andReturn(true);
        var settings = service.loadLocalSettings();
        expect(localStorage.getItem).toHaveBeenCalledWith('kopfSettings');
        expect(this.DebugService.debug).toHaveBeenCalled();
        expect(settings).toEqual({});
      });

  it("should correctly update the updatable settings",
      function() {
        var settings = {refresh_rate: '1', theme: 'whatever'};
        service.settings = {};
        service.updateSettings(settings);
        expect(service.settings).toEqual(settings);
      });

  it("should update ONLY the updatable settings",
      function() {
        var settings = {
          refresh_rate: '1',
          theme: 'whatever',
          elasticsearch_root_path: 'blah blah',
          with_credentials: 'nono'
        };
        service.settings = {};
        service.updateSettings(settings);
        expect(service.settings).toEqual({refresh_rate: '1', theme: 'whatever'});
      });

});
