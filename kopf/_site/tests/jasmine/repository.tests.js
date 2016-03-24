'use strict';

describe('RepositoryController', function(){
    var scope, createController, _q, _rootScope;

    beforeEach(angular.mock.module('kopf'));
    
    beforeEach(angular.mock.inject(function($rootScope, $controller, $injector){
        //create an empty scope
        this.scope = $rootScope.$new();
        this.scope.client = {}         //set fake client
        var $q = $injector.get('$q');
        this._q = $q
        this._rootScope = $rootScope;
        var $timeout = $injector.get('$timeout');
        var $location = $injector.get('$location');
        this.ConfirmDialogService = $injector.get('ConfirmDialogService');
        var AlertService = $injector.get('AlertService');
        this.AlertService = AlertService;
        var AceEditorService = $injector.get('AceEditorService');
        this.AceEditorService = AceEditorService;

        this.createController = function() {
            return $controller('RepositoryController', {$scope: this.scope}, $location, $timeout, this.ConfirmDialogService, AlertService, AceEditorService);
        };

        this._controller = this.createController();
    }));

    //TESTS
    it('init : values are set', function(){
        expect(this.scope.dialog_service).not.toBe(null);
        expect(this.scope.repositories).toEqual([]);
        expect(this.scope.repositories_names).toEqual([]);
        expect(this.scope.snapshots).toEqual([]);
        expect(this.scope.indices).toEqual([]);
        expect(this.scope.new_repo).toEqual({});
        expect(this.scope.editor).toEqual(undefined);
        expect(this.scope.new_snap).toEqual({});
    });

    it('on : makes calls reload and initEditor', function() {
        spyOn(this.scope, 'reload').andReturn(true);
        spyOn(this.scope, 'initEditor').andCallThrough();
        spyOn(this.AceEditorService, 'init').andReturn("fakeaceeditor");
        this.scope.$emit("loadRepositoryEvent");
        expect(this.scope.reload).toHaveBeenCalled();
        expect(this.scope.initEditor).toHaveBeenCalled();
        expect(this.AceEditorService.init).toHaveBeenCalledWith('repository-settings-editor');
        expect(this.scope.editor).toEqual("fakeaceeditor");
    });

    it('loadIndices : assigns a value to indices from cluster.indices', function() {
        this.scope.cluster = {};
        this.scope.cluster.indices = ["chicken", "kale", "potatoes"];
        this.scope.loadIndices();
        expect(this.scope.indices).toEqual(["chicken", "kale", "potatoes"]);
    });

    it('reload : calls loadRepositories, allSnapshots, and loadIndices', function() {
        var deferred = this._q.defer();
        deferred.resolve(true);
        spyOn(this.scope, 'loadRepositories').andReturn(deferred.promise);
        spyOn(this.scope, 'allSnapshots').andReturn(true);
        spyOn(this.scope, 'loadIndices').andReturn(true);
        this.scope.reload();
        this._rootScope.$apply();  //force cycle so promise gets resolved
        expect(this.scope.loadRepositories).toHaveBeenCalled();
        expect(this.scope.allSnapshots).toHaveBeenCalled();
        expect(this.scope.loadIndices).toHaveBeenCalled();
    });

    it('reload : calls loadRepositories and loadIndices (failed promise)', function() {
        var deferred = this._q.defer();
        deferred.reject(true);
        spyOn(this.scope, 'loadRepositories').andReturn(deferred.promise);
        spyOn(this.scope, 'allSnapshots').andReturn(true);
        spyOn(this.scope, 'loadIndices').andReturn(true);
        this.scope.reload();
        this._rootScope.$apply();  //force cycle so promise gets resolved
        expect(this.scope.loadRepositories).toHaveBeenCalled();
        expect(this.scope.allSnapshots).not.toHaveBeenCalled();
        expect(this.scope.loadIndices).toHaveBeenCalled();
    });

    it('optionalParam : sets param on body', function() {
        var answer = this.scope.optionalParam({"chicken":"no"}, {"chicken":"yes"}, "chicken");
        expect(answer).toEqual({"chicken":"yes"});

        answer = this.scope.optionalParam({"chicken":"no"}, {"chicken":"yes"}, "pork");
        expect(answer).toEqual({"chicken":"no"});

        answer = this.scope.optionalParam({"chicken":"no"}, {}, "pork");
        expect(answer).toEqual({"chicken":"no"});
    });

    it('deleteRepository : calls dialog_service open', function() {
        spyOn(this.ConfirmDialogService, "open").andReturn(true);
        this.scope.deleteRepository("name", "value");
        expect(this.ConfirmDialogService.open).toHaveBeenCalled();
    });

    it('restoreSnapshot : calls client.restorSnapshot : missing optionals', function () {
        this.scope.client.restoreSnapshot = function(){};
        this.scope.restore_snap = {
                                    "snapshot": {
                                                "snapshot":"my_snap",
                                                "repository":"my_repo"
                                                }
                                  };
        var expected = {};
        spyOn(this.scope.client, "restoreSnapshot").andReturn(true);

        this.scope.restoreSnapshot();
        expect(this.scope.client.restoreSnapshot).toHaveBeenCalledWith("my_repo",
                                                                       "my_snap",
                                                                       JSON.stringify(expected),
                                                                       jasmine.any(Function),
                                                                       jasmine.any(Function));
    });

    it('restoreSnapshot : calls client.restorSnapshot : all params', function () {
        this.scope.client.restoreSnapshot = function(){};
        this.scope.restore_snap = {
                                    "indices":["idx-20140107","idx-20140108"],
                                    "ignore_unavailable": false,
                                    "include_global_state":false,
                                    "rename_replacement": "-chicken-",
                                    "rename_pattern":"-",
                                    "snapshot": {
                                                "snapshot":"my_snap",
                                                "repository":"my_repo"
                                                }
                                  };

        var expected = {
                        "indices":"idx-20140107,idx-20140108",
                        "include_global_state":false,
                        "ignore_unavailable":false,
                        "rename_replacement":"-chicken-",
                        "rename_pattern":"-"
                        };
        spyOn(this.scope.client, "restoreSnapshot").andReturn(true);

        this.scope.restoreSnapshot();
        expect(this.scope.client.restoreSnapshot).toHaveBeenCalledWith("my_repo",
                                                                       "my_snap",
                                                                       JSON.stringify(expected),
                                                                       jasmine.any(Function),
                                                                       jasmine.any(Function));
    });

    it('createRepository : calls client.createRepository', function(){
        this.scope.client.createRepository = function(){};
        spyOn(this.scope.client, "createRepository").andReturn(true);

        this.scope.new_repo = {
                                name:"my_repo",
                                type:"o positive",
                              };
        this.scope.editor = {
                            error: null,
                            format:function(){return "{\"settings_key\":\"settings_value\"}";}
                            };
        var expected = {type: "o positive", settings: {"settings_key":"settings_value"}};
        this.scope.createRepository();
        expect(this.scope.client.createRepository).toHaveBeenCalledWith("my_repo",
                                                                        JSON.stringify(expected),
                                                                        jasmine.any(Function),
                                                                        jasmine.any(Function));

    });

    it('createRepository : does NOT call client.createRepository if editor error', function(){
        this.scope.client.createRepository = function(){};
        spyOn(this.scope.client, "createRepository").andReturn(true);
        this.scope.editor = {
                            error: "yep this is an error",
                            format:function(){return "{\"settings_key\":\"settings_value\"}";}
                            };
        this.scope.createRepository();
        expect(this.scope.client.createRepository).not.toHaveBeenCalled();
    });

    it('_parseRepositories : calls updateModel and deferred.resolve', function() {
        var fakedeferred = {resolve : function(){}}
        this.scope.updateModel = function(){};
        spyOn(this.scope, "updateModel");
        spyOn(fakedeferred, "resolve");
        this.scope._parseRepositories("chicken", fakedeferred);
        expect(this.scope.updateModel).toHaveBeenCalled();
        expect(fakedeferred.resolve).toHaveBeenCalled();
    });

    it('_parseRepositories : sets repository names for dropdown', function() {
        var fakedeferred = {resolve : function(){}}

        // fake version of updateModel, to test logic in the function we will pass it
        this.scope.updateModel=function(action) {
            action();
        };

        var repositories = {"repo1":{"r1k1":"r1v1"}}
        spyOn(this.scope, "updateModel").andCallThrough();
        spyOn(fakedeferred, "resolve");

        this.scope._parseRepositories(repositories, fakedeferred);
        expect(this.scope.updateModel).toHaveBeenCalled();
        expect(fakedeferred.resolve).toHaveBeenCalled();
        expect(this.scope.repositories_names).toEqual([{"name":"repo1", "value":"repo1"}]);
        expect(this.scope.repositories).toEqual(repositories);
    });

    it('loadRepositories : calls client.getRepositories', function() {
        this.scope.client.getRepositories = function(){};
        spyOn(this.scope.client, "getRepositories").andReturn(true);

        this.scope.loadRepositories();
        expect(this.scope.client.getRepositories).toHaveBeenCalledWith(jasmine.any(Function), jasmine.any(Function));
    });

    it('createSnapshot : repository is required', function() {
        this.scope.client.createSnapshot = function(){};
        spyOn(this.AlertService, "warn");
        this.scope.new_snap = {};

        this.scope.createSnapshot();
        expect(this.AlertService.warn).toHaveBeenCalledWith("Repository is required");
    });

    it('createSnapshot : snapshot name is required', function() {
        this.scope.client.createSnapshot = function(){};
        spyOn(this.AlertService, "warn");
        this.scope.new_snap = {"repository":"yep"};

        this.scope.createSnapshot();
        expect(this.AlertService.warn).toHaveBeenCalledWith("Snapshot name is required");
    });

    it('createSnapshot : calls client.createSnapshot', function() {
        this.scope.client.createSnapshot = function(){};
        spyOn(this.scope.client, "createSnapshot").andReturn(true);
        this.scope.new_snap = {"repository":"my_repo",
                                "name":"my_snap"
                            };

        this.scope.createSnapshot();
        expect(this.scope.client.createSnapshot).toHaveBeenCalledWith("my_repo",
                                                                        "my_snap",
                                                                        JSON.stringify({}),
                                                                        jasmine.any(Function),
                                                                        jasmine.any(Function));
    });

    it('createSnapshot : calls client.createSnapshot - sets optional', function() {
        this.scope.client.createSnapshot = function(){};
        spyOn(this.scope.client, "createSnapshot").andReturn(true);
        this.scope.new_snap = {"repository":"my_repo",
                                "name":"my_snap",
                                "indices":["one","two"],
                                "include_global_state":"true",
                                "ignore_unavailable":true
                            };

        var expected = {
                        "indices":"one,two",
                        "include_global_state":true,
                        "ignore_unavailable":true
                        };

        this.scope.createSnapshot();
        expect(this.scope.client.createSnapshot).toHaveBeenCalledWith("my_repo",
                                                                        "my_snap",
                                                                        JSON.stringify(expected),
                                                                        jasmine.any(Function),
                                                                        jasmine.any(Function));
    });

    it('deleteSnapshot : calls dialog_service open', function() {
        spyOn(this.ConfirmDialogService, "open").andReturn(true);
        this.scope.deleteSnapshot("name", "value");
        expect(this.ConfirmDialogService.open).toHaveBeenCalled();
    });

    it('allSnapshots : creates list of all snapshots', function() {
        var repositories = {
                            "repo_1": {"fake_key":"fake_value"}
                        };

        var snapshots = [{"snapshot": "my_snapshot_1"}, {"snapshot": "my_snapshot_2"}];
        var deferred = this._q.defer();
        
        deferred.resolve(snapshots);
        
        spyOn(this.scope, 'loadRepositories').andReturn();
        
        this.scope.snapshots = [{"snapshot":"existing"}];
        spyOn(this.scope, "fetchSnapshots").andReturn(deferred.promise);
        this.scope.allSnapshots(repositories);
        this._rootScope.$apply();
        expect(this.scope.snapshots).toEqual([{"snapshot": "my_snapshot_1"},
                                            {"snapshot": "my_snapshot_2"}]);
    });

    it('allSnapshots : creates list of all snapshots - fail', function() {
        var repositories = {
                            "repo_1": {"fake_key":"fake_value"}
                        };
        var deferred = this._q.defer();
        deferred.reject(true);
        
        spyOn(this.scope, 'loadRepositories').andReturn();
        
        this.scope.snapshots = [{"snapshot":"existing"}];
        spyOn(this.scope, "fetchSnapshots").andReturn(deferred.promise);
        this.scope.allSnapshots(repositories);
        this._rootScope.$apply();
        expect(this.scope.snapshots).toEqual([]);
    });

    it('_parseSnapshots : adds repo name to each snapshot', function() {
        var fakedeferred = {resolve : function(){} };
        var response = {
                        "snapshots":[{"s1":{"name":"tylerdyrden"}}]
        };

        var expected = [{"s1":{"name":"tylerdyrden"}, "repository":"chicken"}];
        spyOn(fakedeferred, "resolve");

        this.scope._parseSnapshots("chicken", response, fakedeferred);
        expect(fakedeferred.resolve).toHaveBeenCalledWith(expected);
    });

    it('_parseSnapshots : adds nothing if snapshots not array', function() {
        var fakedeferred = {resolve : function(){} };
        var response = {
                        "snapshots":{"s1":{"name":"tylerdyrden"}}
        };

        var expected = {"s1":{"name":"tylerdyrden"}};
        spyOn(fakedeferred, "resolve");

        this.scope._parseSnapshots("chicken", response, fakedeferred);
        expect(fakedeferred.resolve).toHaveBeenCalledWith(expected);
    });

    it('fetchSnapshots : calls getSnapshots', function() {
        this.scope.client.getSnapshots = function(){};
        spyOn(this.scope.client, "getSnapshots").andReturn(true);
        this.scope.fetchSnapshots("chicken");
        expect(this.scope.client.getSnapshots).toHaveBeenCalledWith(
            "chicken",
            jasmine.any(Function),
            jasmine.any(Function));

    });

});