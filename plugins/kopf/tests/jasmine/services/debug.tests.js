"use strict";

describe("DebugService", function() {

  var service, filter;

  beforeEach(module("kopf"));

  beforeEach(function() {
    module('kopf');

    module(function($provide) {
      $provide.value('$filter',
          function() {
            return function() {
              return 'prefix> ';
            }
          }
      );
    });
  });

  beforeEach(inject(function($injector) {
    service = $injector.get('DebugService');
    filter = $injector.get('$filter');
    filter.date = function() {
      return 'xxx';
    };
  }));

  it("should correctly add a formatted message to the messages list", function() {
    service.debug("hello");
    expect(service.getMessages().length).toEqual(1);
    expect(service.getMessages()).toEqual(['prefix> hello']);
  });

  it("should limit message to 100", function() {
    for (var i = 0; i < 1003; i++) {
      service.debug('message ' + i);
    }
    expect(service.getMessages().length).toEqual(1000);
    expect(service.getMessages()[999]).toEqual('prefix> message 1002');

  });

  it("adding a message should change internal updatedAt value", function() {
    expect(service.getUpdatedAt()).toEqual(0);
    service.debug('message');
    expect(service.getUpdatedAt()).not.toEqual(0);
  });

});
