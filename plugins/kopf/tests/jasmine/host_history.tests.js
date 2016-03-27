"use strict";

describe("Host history service", function() {
  var service;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(angular.mock.inject(function($rootScope, $injector) {
    service = $injector.get('HostHistoryService');
    service.clearHistory();
  }));

  it("Successfully adds a new element to history", function() {
    var history = service.getHostHistory();
    expect(history).toEqual([]);
    service.addToHistory(new ESConnection("http://localhost"));
    history = service.getHostHistory();
    expect(history).toEqual([{host: 'http://localhost'}]);
  });

  it("Successfully adds a new authenticated element to history", function() {
    var history = service.getHostHistory();
    expect(history).toEqual([]);
    service.addToHistory(new ESConnection("http://usr:pwd@localhost"));
    history = service.getHostHistory();
    expect(history).toEqual([{host: 'http://usr:pwd@localhost'}]);
  });

  it("Only adds an element once", function() {
    var history = service.getHostHistory();
    expect(history).toEqual([]);
    service.addToHistory(new ESConnection("http://localhost"));
    history = service.getHostHistory();
    expect(history).toEqual([{host: 'http://localhost'}]);
    service.addToHistory(new ESConnection("http://localhost"));
    history = service.getHostHistory();
    expect(history).toEqual([{host: 'http://localhost'}]);
  });

  it("should move an alredy present entry to the top when added again",
      function() {
        var history = service.getHostHistory();
        expect(history).toEqual([]);
        service.addToHistory(new ESConnection("http://localhost1"));
        history = service.getHostHistory();
        expect(history).toEqual([{host: 'http://localhost1'}]);
        service.addToHistory(new ESConnection("http://localhost2"));
        history = service.getHostHistory();
        expect(history).toEqual([{host: 'http://localhost2'},
          {host: 'http://localhost1'}]);
        service.addToHistory(new ESConnection("http://localhost1"));
        history = service.getHostHistory();
        expect(history).toEqual([{host: 'http://localhost1'},
          {host: 'http://localhost2'}]);
      });

  it("should limit history to 10 elements", function() {
    var history = service.getHostHistory();
    expect(history).toEqual([]);
    service.addToHistory(new ESConnection("http://localhost1"));
    service.addToHistory(new ESConnection("http://localhost2"));
    service.addToHistory(new ESConnection("http://localhost3"));
    service.addToHistory(new ESConnection("http://localhost4"));
    service.addToHistory(new ESConnection("http://localhost5"));
    service.addToHistory(new ESConnection("http://localhost6"));
    service.addToHistory(new ESConnection("http://localhost7"));
    service.addToHistory(new ESConnection("http://localhost8"));
    service.addToHistory(new ESConnection("http://localhost9"));
    service.addToHistory(new ESConnection("http://localhost10"));
    service.addToHistory(new ESConnection("http://localhost11"));
    history = service.getHostHistory();
    expect(history.length).toEqual(10);
  });

});
