'use strict';

describe('AnalysisController', function(){
    var scope, createController;

    beforeEach(angular.mock.module('kopf'));
    
    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector){
        //create an empty scope
        this.scope = $rootScope.$new();
        this.scope.client = {}         //set fake client
        var $timeout = $injector.get('$timeout');
        var $location = $injector.get('$location');
        this.AlertService = $injector.get('AlertService');

        this.createController = function() {
            return $controller('AnalysisController', {$scope: this.scope}, $location, $timeout, this.AlertService);
        };

        this._controller = this.createController();
    }));

    //TESTS
    it('init : values are set', function(){
        expect(this.scope.indices).toEqual(null);
        expect(this.scope.field_index).toEqual(null);
        expect(this.scope.field_type).toEqual('');
        expect(this.scope.field_text).toEqual('');
        expect(this.scope.field_tokens).toEqual([]);

        expect(this.scope.analyzer_index).toEqual('');
        expect(this.scope.analyzer_analyzer).toEqual('');
        expect(this.scope.analyzer_text).toEqual('');
        expect(this.scope.analyzer_tokens).toEqual([]);
    });

    it('makes necessary calls when loading page', function() {
        var indices = [ 
                        new Index('a', undefined, {}, {}),
                        new Index('b', undefined, {}, {})
                      ];
        var cluster = {
            open_indices: function(){return indices}
        };
        this.scope.cluster = cluster;
        this.scope.$emit('loadAnalysisEvent');
        expect(this.scope.indices).toEqual(indices);
    });

    it('doesnt execute field analysis if no field is selected', function() {
        this.scope.client.analyzeByField = function(){};
        spyOn(this.scope.client, "analyzeByField").andReturn(true);
        this.scope.analyzeByField();
        expect(this.scope.client.analyzeByField).not.toHaveBeenCalled();
    });

    it('doesnt execute field analysis if text to analyze is empty', function() {
        this.scope.client.analyzeByField = function(){};
        this.scope.field_index = new Index('a', undefined, {}, {});
        this.scope.field_field = 'field';
        this.scope.field_text = '';
        spyOn(this.scope.client, "analyzeByField").andReturn(true);
        this.scope.analyzeByField();
        expect(this.scope.client.analyzeByField).not.toHaveBeenCalled();
    });

    it('executes field analysis if all is set', function() {
        this.scope.client.analyzeByField = function(){};
        this.scope.field_index = new Index('a', undefined, {}, {});
        this.scope.field_type = 'type';
        this.scope.field_field = 'field';
        this.scope.field_text = 'blah blah';
        spyOn(this.scope.client, "analyzeByField").andReturn(true);
        this.scope.analyzeByField();
        expect(this.scope.client.analyzeByField).toHaveBeenCalledWith('a', 'type', 'field', 'blah blah', jasmine.any(Function), jasmine.any(Function));
    });


    it('doesnt execute analyzer analysis if no analyzer is selected', function() {
        this.scope.client.analyzeByAnalyzer = function(){};
        spyOn(this.scope.client, "analyzeByAnalyzer").andReturn(true);
        this.scope.analyzeByAnalyzer();
        expect(this.scope.client.analyzeByAnalyzer).not.toHaveBeenCalled();
    });

    it('doesnt execute analyzer analysis if text to analyze is empty', function() {
        this.scope.client.analyzeByAnalyzer = function(){};
        this.scope.analyzer_index = new Index('a', undefined, {}, {});
        this.scope.analyzer_analyzer = 'analyzer';
        this.scope.analyzer_text = '';
        spyOn(this.scope.client, "analyzeByAnalyzer").andReturn(true);
        this.scope.analyzeByAnalyzer();
        expect(this.scope.client.analyzeByAnalyzer).not.toHaveBeenCalled();
    });

    it('executes analyzer analysis if all is set', function() {
        this.scope.client.analyzeByAnalyzer = function(){};
        this.scope.analyzer_index = new Index('a', undefined, {}, {});
        this.scope.analyzer_analyzer = 'analyzer';
        this.scope.analyzer_text = 'blah blah';
        spyOn(this.scope.client, "analyzeByAnalyzer").andReturn(true);
        this.scope.analyzeByAnalyzer();
        expect(this.scope.client.analyzeByAnalyzer).toHaveBeenCalledWith('a', 'analyzer', 'blah blah', jasmine.any(Function), jasmine.any(Function));
    });


});