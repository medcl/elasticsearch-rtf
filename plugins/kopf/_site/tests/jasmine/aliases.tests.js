'use strict';

describe('AliasesController', function(){
    var scope, createController;

    beforeEach(angular.mock.module('kopf'));
    
    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector){
        this.scope = $rootScope.$new();
        var $timeout = $injector.get('$timeout');
        var $location = $injector.get('$location');
        this.AlertService = $injector.get('AlertService');
        this.ElasticService = $injector.get('ElasticService');
        this.ElasticService.client = {};
        this.createController = function() {
            return $controller('AliasesController', {$scope: this.scope}, $location, $timeout, this.AlertService, this.ElasticService);
        };
        this._controller = this.createController();
    }));

    //TESTS
    it('init : values are set', function() {
        expect(this.scope.paginator.getCollection()).toEqual([]);
        expect(this.scope.paginator.page).toEqual(1);
        expect(this.scope.paginator.filter.index).toEqual("");
        expect(this.scope.paginator.filter.alias).toEqual("");
        expect(this.scope.original).toEqual([]);
        expect(this.scope.editor).toEqual(undefined);
        expect(this.scope.new_alias.index).toEqual("");
        expect(this.scope.new_alias.alias).toEqual("");
        expect(this.scope.new_alias.filter).toEqual("");
        expect(this.scope.new_alias.index_routing).toEqual("");
        expect(this.scope.new_alias.search_routing).toEqual("");
    });

    it('on : makes calls loadAliases and initEditor', function() {
        this.scope.cluster = { indices: [ 'one', 'two'] };
        spyOn(this.scope, 'loadAliases').andReturn(true);
        spyOn(this.scope, 'initEditor').andReturn(true);
        this.scope.$emit("loadAliasesEvent");
        expect(this.scope.loadAliases).toHaveBeenCalled();
        expect(this.scope.initEditor).toHaveBeenCalled();
        expect(this.scope.indices).toEqual(['one','two']);
    });

    it('viewDetails : set details on scope', function() {
        this.scope.viewDetails("pizza");
        expect(this.scope.details).toEqual("pizza");
    });

    it('addAlias : sets new_alias filter', function () {
        this.scope.editor = {};
        this.scope.new_alias = {};
        this.scope.editor.format = function(){return 'tacos';};
        this.scope.addAlias();
        expect(this.scope.new_alias.filter).toEqual('tacos');
    });

    it('addAlias : new alias : gets added to aliases map, calls pagination', function () {
        this.scope.paginator = new Paginator(1, 10, [], new AliasFilter("",""));
        var fake_editor = {            error : undefined,
            format : function(){return {'filter':'fromeditor'}; }
        };
        var fake_alias = new Alias('myalias', 'myindex', { 'filter' : 'fromeditor' });
        this.scope.editor = fake_editor;
        this.scope.new_alias = fake_alias;
        spyOn(this.scope.paginator, "getPage");
        this.scope.addAlias();
        expect(this.scope.paginator.getPage).toHaveBeenCalled();
        expect(this.scope.paginator.getCollection().length).toEqual(1);
        expect(this.scope.paginator.getCollection()[0].index).toEqual("myindex");
        expect(this.scope.paginator.getCollection()[0].aliases.length).toEqual(1);
        expect(this.scope.paginator.getCollection()[0].aliases[0]).toEqual(fake_alias);
    });

    it('addAlias : existing alias throws alert, does not change state, does not call pagination', function () {
        var added = new Alias("myalias", "myindex");
        this.scope.paginator = new Paginator(1, 10, [ new IndexAliases("myindex", [ added ] ) ], new AliasFilter("",""));
        var fake_editor = {
            error : undefined,
            format : function(){return {'filter':'fromeditor'}; }
        };
        var fake_alias = new Alias('myalias', 'myindex', { 'filter' : 'fromeditor' });
        this.scope.editor = fake_editor;
        this.scope.new_alias = fake_alias;
        spyOn(this.scope.paginator, "getPage");
        spyOn(this.AlertService, "error");
        this.scope.addAlias();
        expect(this.AlertService.error).toHaveBeenCalled();
        expect(this.scope.paginator.getPage).not.toHaveBeenCalled();
    });

    it('removeAlias : changes alias list, calls pagination setresults with new info', function () {
        this.scope.paginator = new Paginator(1, 10, [ new IndexAliases("myindex", [ new Alias("myalias", "myindex") ] ) ], new AliasFilter("",""));
        spyOn(this.scope.paginator, "getPage");
        this.scope.removeIndexAliases("myindex");
        expect(this.scope.paginator.getPage).toHaveBeenCalledWith();
        expect(this.scope.paginator.getCollection()).toEqual([]);
    });

    it('removeAliasFromIndex : ', function () {
        this.scope.paginator = new Paginator(1, 10, [ new IndexAliases("myindex", [ new Alias("myalias", "myindex"), new Alias("myalias2", "myindex") ] ) ], new AliasFilter("",""));
        spyOn(this.scope.paginator, "getPage");
        spyOn(this.AlertService, "success");
        this.scope.removeIndexAlias('myindex', 'myalias');
        expect(this.AlertService.success).toHaveBeenCalled();
        expect(this.scope.paginator.getCollection().length).toEqual(1);
        expect(this.scope.paginator.getCollection()[0].aliases.length).toEqual(1);

    });

    it('mergeAliases : displays warn if no changes were made', function () {
        this.ElasticService.client.updateAliases = function(){};
        this.scope.original = [new IndexAliases("myindex", [ new Alias("myalias", "myindex") ] )];
        this.scope.paginator = new Paginator(1, 10, [new IndexAliases("myindex", [ new Alias("myalias", "myindex") ] )], new AliasFilter("",""));
        spyOn(this.AlertService, "warn");
        this.scope.mergeAliases();
        expect(this.AlertService.warn).toHaveBeenCalled()
    });

    it('mergeAliases : calls client updateAliases', function () {
        this.ElasticService.client.updateAliases = function(){};
        this.scope.original = [];
        this.scope.paginator = new Paginator(1, 10, [new IndexAliases("myindex", [ new Alias("myalias", "myindex") ] )], new AliasFilter("",""));
        spyOn(this.scope.paginator, "setCollection");
        spyOn(this.ElasticService.client, "updateAliases");
        this.scope.mergeAliases();
        expect(this.ElasticService.client.updateAliases).toHaveBeenCalled()
    });

    it('mergeAliases : adds new', function () {
        this.ElasticService.client.updateAliases = function(){};
        this.scope.original = [];
        var added = new Alias("myalias", "myindex");
        this.scope.paginator = new Paginator(1, 10, [ new IndexAliases("myindex", [ added ] ) ], new AliasFilter("",""));
        spyOn(this.scope.paginator, "setCollection");
        spyOn(this.ElasticService.client, "updateAliases");
        this.scope.mergeAliases();
        expect(this.ElasticService.client.updateAliases).toHaveBeenCalledWith([added],[], jasmine.any(Function), jasmine.any(Function));
    });

    it('mergeAliases : removes previous', function () {
        this.ElasticService.client.updateAliases = function(){};
        var removed = new Alias("myalias", "myindex");
        this.scope.original = [ new IndexAliases("myindex", [ removed ] ) ];
        this.scope.paginator = new Paginator(1, 10, [], new AliasFilter("",""));
        spyOn(this.scope.paginator, "setCollection");
        spyOn(this.ElasticService.client, "updateAliases");
        this.scope.mergeAliases();
        expect(this.ElasticService.client.updateAliases).toHaveBeenCalledWith([], [removed], jasmine.any(Function), jasmine.any(Function));
    });

    it('loadAliases : removes previous', function () {
        this.ElasticService.client.fetchAliases=function(success, failure) {
            success([ new IndexAliases("index_name", [ new Alias("alias_name", "index_name")])]);
        }
        this.scope.loadAliases();
        expect(this.scope.paginator.getCollection().length).toEqual(1);
        expect(this.scope.original.length).toEqual(1);
    });

});