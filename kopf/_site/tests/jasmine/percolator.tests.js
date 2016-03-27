'use strict';

describe('PercolatorController', function(){
    var scope, createController;

    beforeEach(angular.mock.module('kopf'));
    
    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector){
        //create an empty scope
        this.scope = $rootScope.$new();
        this.scope.client = {}         //set fake client
        var $timeout = $injector.get('$timeout');
        var $location = $injector.get('$location');
        this.AlertService = $injector.get('AlertService');
        this.ConfirmDialogService = $injector.get('ConfirmDialogService');
        this.AceEditorService = $injector.get('AceEditorService');

        this.createController = function() {
            return $controller('PercolatorController', {$scope: this.scope}, $location, $timeout, this.AlertService, this.ConfirmDialogService, this.AceEditorService);
        };

        this._controller = this.createController();
    }));

    //TESTS
    it('init : values are set', function(){
        expect(this.scope.editor).toEqual(undefined);
        expect(this.scope.total).toEqual(0);
        expect(this.scope.queries).toEqual([]);
        expect(this.scope.page).toEqual(1);
        expect(this.scope.filter).toEqual('');
        expect(this.scope.id).toEqual('');
        expect(this.scope.index).toEqual(null);
        expect(this.scope.indices).toEqual([]);
        expect(new PercolateQuery({}).equals(this.scope.new_query)).toEqual(true);
    });
	
    it('Initializes data when percolator tab is selected', function() {
        var indices = [ 
                        new Index('a', undefined, {}, {}),
                        new Index('b', undefined, {}, {})
                      ];
        var cluster = {
            indices: indices
        };
        this.scope.cluster = cluster;
        spyOn(this.scope, 'initEditor').andReturn(true);
        this.scope.$emit("loadPercolatorEvent");
        expect(this.scope.initEditor).toHaveBeenCalled();
        expect(this.scope.indices).toEqual(indices);
    });

    it('correctly goes to previous page', function() {
        this.scope.page = 5;
        spyOn(this.scope, 'loadPercolatorQueries').andReturn(true);
        this.scope.previousPage();
        expect(this.scope.loadPercolatorQueries).toHaveBeenCalled();
        expect(this.scope.page).toEqual(4);
    });

    it('correctly goes to next page', function() {
        this.scope.page = 5;
        spyOn(this.scope, 'loadPercolatorQueries').andReturn(true);
        this.scope.nextPage();
        expect(this.scope.loadPercolatorQueries).toHaveBeenCalled();
        expect(this.scope.page).toEqual(6);
    });

    it('correctly returns if there is a next page', function() {
        this.scope.page = 5;
        this.scope.total = 50;
        expect(this.scope.hasNextPage()).toEqual(false);
        this.scope.total = 60;
        expect(this.scope.hasNextPage()).toEqual(true);
    });

    it('correctly returns if there is a previous page', function() {
        this.scope.page = 1;
        expect(this.scope.hasPreviousPage()).toEqual(false);
        this.scope.page = 2;
        expect(this.scope.hasPreviousPage()).toEqual(true);
    });

    it('correctly returns first and last result', function() {
        this.scope.page = 1;
        this.scope.total = 20;
        this.scope.hasNextPage=function(){return true;};
        expect(this.scope.firstResult()).toEqual(1);
        expect(this.scope.lastResult()).toEqual(10);
        this.scope.page = 2;
        this.scope.total = 17;
        this.scope.hasNextPage=function(){return false;};
        expect(this.scope.firstResult()).toEqual(11);
        expect(this.scope.lastResult()).toEqual(17);
    });	

    it('parses the search params', function() {
        expect(this.scope.parseSearchParams()).toEqual([]);
        this.scope.id = '17';
        expect(this.scope.parseSearchParams()).toEqual([{"term": { "_id": '17' } }]);
        this.scope.filter = '{ "foo": "bar" }';
        expect(this.scope.parseSearchParams()).toEqual([{"term": { "_id": '17' } }, {"term": { "foo": 'bar' } } ] );
    });

    it('alerts error if no index is selected for searching percolator queries', function() {
        spyOn(this.AlertService, 'info').andReturn(true);
        this.scope.searchPercolatorQueries();
        expect(this.AlertService.info).toHaveBeenCalledWith("No index is selected");
        this.scope.index = new Index('a',undefined,{},{});
        spyOn(this.scope, 'loadPercolatorQueries');
        this.scope.searchPercolatorQueries();
        expect(this.scope.loadPercolatorQueries).toHaveBeenCalled();
    });

    it('prevents creating a percolator query if json is mal formed', function() {
        this.scope.client = {
            createPercolatorQuery: function() {}
        }
        var fake_editor = {
            error : 'error',
            format : function(){return {}; }
        };
        this.scope.editor = fake_editor;
        spyOn(this.scope.client, 'createPercolatorQuery').andReturn(true);
        this.scope.createNewQuery();
        expect(this.scope.client.createPercolatorQuery).not.toHaveBeenCalled();
    });
	
    it('prevents creating a percolator query if no id is defined', function() {
        this.scope.client = {
            createPercolatorQuery: function() {}
        }
        var fake_editor = {
            error : undefined,
            format : function(){return { "query":{"match_all":{}}}; }
        };
        this.scope.editor = fake_editor;
        this.scope.new_query = new PercolateQuery({'_index': 'a', 'type': 'foobar', '_id':'','_source': { "query": { "match_all" : {} } }});
        spyOn(this.scope.client, 'createPercolatorQuery').andReturn(true);
        this.scope.createNewQuery();
        expect(this.scope.client.createPercolatorQuery).not.toHaveBeenCalled();
    });

    it('attempts creating a percolator query if all data is ok', function() {
        this.scope.client = {
            createPercolatorQuery: function() {}
        }
        var fake_editor = {
            error : undefined,
            format : function(){return { "query":{"match_all":{}}}; }
        };
        this.scope.editor = fake_editor;
        this.scope.new_query = new PercolateQuery({'_index': 'a', 'type': 'foobar', '_id':'','_source': { "query": { "match_all" : {} } }});
        this.scope.new_query.id = "foobar";
        spyOn(this.scope.client, 'createPercolatorQuery').andReturn(true);
        this.scope.createNewQuery();
        expect(this.scope.client.createPercolatorQuery).toHaveBeenCalledWith('a', 'foobar', { "query": { "match_all" : {} } },jasmine.any(Function),jasmine.any(Function));
    });

    it('displays error when loading percolator query if filter is invalid', function() {
        this.scope.client = {
            fetchPercolateQueries: function() {}
        }
        spyOn(this.scope.client, 'fetchPercolateQueries').andReturn(true);
        spyOn(this.AlertService, 'error').andReturn(true);
        this.scope.filter = '{';
        this.scope.loadPercolatorQueries();
        expect(this.scope.client.fetchPercolateQueries).not.toHaveBeenCalled();
        expect(this.AlertService.error).toHaveBeenCalled();
    });

    it('attempts loading percolator queries', function() {
        this.scope.client = {
            fetchPercolateQueries: function() {}
        }
        this.scope.page = 1;
        this.scope.id = '';
        this.scope.filter = '';
        this.scope.index = 'a';
        spyOn(this.scope.client, 'fetchPercolateQueries').andReturn(true);
        spyOn(this.AlertService, 'error').andReturn(true);
        this.scope.loadPercolatorQueries();
        expect(this.scope.client.fetchPercolateQueries).toHaveBeenCalledWith('a', '{"from":0}', jasmine.any(Function), jasmine.any(Function));
        expect(this.AlertService.error).not.toHaveBeenCalled();
    });

});