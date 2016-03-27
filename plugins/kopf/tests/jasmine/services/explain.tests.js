"use strict";

describe('ExplainService', function() {
  var service;
  beforeEach(module('kopf'));

  beforeEach(inject(function($injector) {
    service = $injector.get('ExplainService');
    expect(service).not.toBeUndefined();
  }));

  it('should predict whether path will return explanation', function() {
    expect(service.isExplainPath('/_search')).toEqual(false);
    expect(service.isExplainPath('/_search?explain=true')).toEqual(true);
    expect(service.isExplainPath('/_search?pretty=true&explain=true')).toEqual(true);
    expect(service.isExplainPath('/x/y/z/_explain')).toEqual(true);
  });

  it('should normalize search response', function() {
    var response = {
      hits: {
        hits: [
          {
            _index:'x', _type: 'y', _id:'1',
            _score: 1.0,
            _source: {},
            _explanation: {
              description: 'desc 1', value: 1.0,
              details: [
                {
                  description: 'desc 1.1', value: 0.5
                },
                {
                  description: 'desc 1.2', value: 0.5
                }
              ]
            }
          },
          {
            _index:'x', _type: 'y', _id:'2',
            _score: 0.5,
            _source: {},
            _explanation: {
              description: 'desc 2', value: 0.5,
              details: [
                {
                  description: 'desc 2.1', value: 0.5
                }
              ]
            }
          }
        ]
      }
    }
    var normalizedResponse = service.normalizeExplainResponse(response);
    expect(normalizedResponse[0].documentId).toEqual('x/y/1');
    expect(normalizedResponse[0]._score).toEqual(1.0);
    expect(normalizedResponse[0].explanationTreeData).not.toBeUndefined();
    expect(normalizedResponse[1].documentId).toEqual('x/y/2');
    expect(normalizedResponse[1]._score).toEqual(0.5);
    expect(normalizedResponse[1].explanationTreeData).not.toBeUndefined();
  });

  it('should normalize explain document response', function() {
    var response = {
      _index:'x', _type: 'y', _id:'1',
      _source: {},
      explanation: {
        description: 'desc 1', value: 1.0,
        details: [
          {
            description: 'desc 1.1', value: 0.5
          },
          {
            description: 'desc 1.2', value: 0.5
          }
        ]
      }
    };
    var normalizedResponse = service.normalizeExplainResponse(response);
    expect(normalizedResponse[0].documentId).toEqual('x/y/1');
    expect(normalizedResponse[0]._score).toEqual(1.0);
    expect(normalizedResponse[0]._explanation).not.toBeUndefined();
    expect(normalizedResponse[0].explanationTreeData).not.toBeUndefined();
  });

});
