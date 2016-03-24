'use strict';

describe('AliasesController', function(){
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
            return $controller('AliasesController', {$scope: this.scope}, $location, $timeout, this.AlertService);
        };

        this._controller = this.createController();
    }));

    //TESTS
    it('init : values are set', function(){
        expect(this.scope.aliases).toEqual(null);
        expect(this.scope.new_index).toEqual({});
        expect(this.scope.pagination).not.toEqual(undefined);
        expect(this.scope.editor).toEqual(undefined);
    });

    it('on : makes calls loadAliases and initEditor', function() {
        spyOn(this.scope, 'loadAliases').andReturn(true);
        spyOn(this.scope, 'initEditor').andReturn(true);
        this.scope.$emit("loadAliasesEvent");
        expect(this.scope.loadAliases).toHaveBeenCalled();
        expect(this.scope.initEditor).toHaveBeenCalled();
    });

    it('loadAliases : assigns a value to new_alias finds existing', function() {
        this.scope.new_alias = {};
        this.scope.client.fetchAliases = function(){};
        this.scope.updateModel = function(){};
        spyOn(this.scope, "_parseAliases");
        spyOn(this.scope.client, "fetchAliases").andReturn(true);
        this.scope.loadAliases();
        expect(this.scope.client.fetchAliases).toHaveBeenCalledWith(jasmine.any(Function),jasmine.any(Function));
        expect(this.scope.new_alias).not.toEqual({});
        expect(this.scope.new_alias instanceof Alias).toEqual(true);
    });

    it('_parseAliases : sets originalAliases, extends aliases, setResults on pagination', function() {
        this.scope.originalAliases = "fake";
        this.scope.aliases = "blank";
        this.scope.pagination = {};
        this.scope.pagination.setResults = function(){};
        spyOn(this.scope.pagination, "setResults");
        var param_aliases = new Aliases({});

        this.scope._parseAliases(param_aliases);

        expect(this.scope.originalAliases).toEqual(param_aliases);
        expect(this.scope.aliases).toEqual(param_aliases)
        expect(this.scope.pagination.setResults).toHaveBeenCalledWith(param_aliases.info)
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
        this.scope.aliases = {info:{}};
        this.scope.pagination = {setResults:function(){}};

        var fake_editor = {
            error : undefined,
            format : function(){return {'filter':'fromeditor'}; }
        };

        var fake_alias = new Alias('myalias', 'myindex', { 'filter' : 'fromeditor' });

        this.scope.editor = fake_editor;
        this.scope.new_alias = fake_alias;
        var expected = 
        {
            "myalias": [fake_alias]
        }
        spyOn(this.scope.pagination, "setResults");

        this.scope.addAlias();
        expect(this.scope.pagination.setResults).toHaveBeenCalled(  );
        expect(this.scope.pagination.setResults).toHaveBeenCalledWith( expected );
    });

    it('addAlias : existing alias throws alert, does not change state, does not call pagination', function () {
        this.scope.aliases = {info:{
                                    'myalias':[new Alias('myalias', 'myindex')]
                              }};
        this.scope.pagination = {setResults:function(){}};

        var fake_editor = {
            error : undefined,
            format : function(){return {'filter':'fromeditor'}; }
        };
        var fake_alias = new Alias('myalias', 'myindex', { 'filter' : 'fromeditor' });

        this.scope.editor = fake_editor;
        this.scope.new_alias = fake_alias;
        
        spyOn(this.scope.pagination, "setResults");
        spyOn(this.AlertService, "error");

        this.scope.addAlias();
        
        expect(this.AlertService.error).toHaveBeenCalled();
        expect(this.scope.pagination.setResults).not.toHaveBeenCalled(  );
    });

    it('removeAlias : changes alias list, calls pagination setresults with new info', function () {
        this.scope.pagination = {setResults:function(){}};
        this.scope.aliases = {info:{
                                    'remove_me':[new Alias('myalias', 'myindex')]
                              }};
        var blank_aliases = {info:{}};

        spyOn(this.scope.pagination, "setResults");

        this.scope.removeAlias("remove_me");
        expect(this.scope.aliases).toEqual(blank_aliases);
        expect(this.scope.pagination.setResults).toHaveBeenCalledWith(blank_aliases.info);
    });

    it('removeAliasFromIndex : ', function () {
        this.scope.pagination = {setResults:function(){}};
        this.scope.aliases = {info:{
                                    'remove_me':[new Alias('remove_me', 'myindex'), new Alias('remove_me', 'myindex2')]
                              }};
        var expected = {info:{
                                'remove_me':[new Alias('remove_me', 'myindex2')]
                            }};

        spyOn(this.AlertService, "success");

        expect(this.scope.aliases.info['remove_me'].length).toEqual(2)
        this.scope.removeAliasFromIndex('myindex', 'remove_me');
        expect(this.AlertService.success).toHaveBeenCalled();
        expect(this.scope.aliases.info['remove_me'].length).toEqual(1);

    });

    it('mergeAliases : calls client updateAliases', function () {
        this.scope.client.updateAliases = function(){};
        this.scope.aliases = {info:{}};
        this.scope.originalAliases = {info:{}};
        spyOn(this.scope.client, "updateAliases");

        this.scope.mergeAliases();
        expect(this.scope.client.updateAliases).toHaveBeenCalled()
    });

    it('mergeAliases : adds new', function () {
        this.scope.client.updateAliases = function(){};
        var newalias = new Alias('new');
        this.scope.aliases = {info:{'new':[newalias]}};
        this.scope.originalAliases = {info:{}};
        spyOn(this.scope.client, "updateAliases");

        var expected = [newalias];
        this.scope.mergeAliases();
        expect(this.scope.client.updateAliases).toHaveBeenCalledWith(expected,[],
                                                                jasmine.any(Function),
                                                                jasmine.any(Function));
    });

    it('mergeAliases : does not add existing', function () {
        this.scope.client.updateAliases = function(){};
        var newalias = new Alias('new');
        this.scope.aliases = {info:{'new':[newalias]}};
        this.scope.originalAliases = {info:{'new':[newalias]}};
        spyOn(this.scope.client, "updateAliases");

        var expected = [];
        this.scope.mergeAliases();
        expect(this.scope.client.updateAliases).toHaveBeenCalledWith(expected,[],
                                                                jasmine.any(Function),
                                                                jasmine.any(Function));
    });

    it('mergeAliases : does not add existing', function () {
        this.scope.client.updateAliases = function(){};
        var existingalias = new Alias('new');
        this.scope.aliases = {info:{}};
        this.scope.originalAliases = {info:{'new':[existingalias]}};
        spyOn(this.scope.client, "updateAliases");

        var expected = [existingalias];
        this.scope.mergeAliases();
        expect(this.scope.client.updateAliases).toHaveBeenCalledWith([],expected,
                                                                jasmine.any(Function),
                                                                jasmine.any(Function));
    });

});