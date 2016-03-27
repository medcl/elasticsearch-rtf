'use strict';

describe('IndexTemplatesController', function() {
  var scope, createController;

  beforeEach(angular.mock.module('kopf'));

  beforeEach(function() {
    module('kopf');
    var mock = {isConnected: function() {
      return true;
    }};
    module(function($provide) {
      $provide.value('ElasticService', mock);
    });
  });

  beforeEach(angular.mock.inject(function($rootScope, $controller, $injector) {
    this.scope = $rootScope.$new();
    this.ElasticService = $injector.get('ElasticService');
    this.ConfirmDialogService = $injector.get('ConfirmDialogService');
    this.AlertService = $injector.get('AlertService');
    this.AceEditorService = $injector.get('AceEditorService');

    this.createController = function() {
      return $controller('IndexTemplatesController', {$scope: this.scope},
          this.ConfirmDialogService, this.AlertService, this.AceEditorService,
      this.ElasticService);
    };

    this._controller = this.createController();
  }));

  it('initial values are correct', function() {
    expect(this.scope.template.name).toEqual("");
    expect(this.scope.template.body).toEqual({});
    expect(this.scope.paginator.getCollection()).toEqual([]);
    expect(this.scope.paginator.filter.name).toEqual("");
    expect(this.scope.paginator.filter.template).toEqual("");
    expect(this.scope.editor).toEqual(undefined);
  });

  it('Initializes data when tab is selected', function() {
    spyOn(this.scope, 'loadTemplates').andReturn(true);
    spyOn(this.scope, 'initEditor').andReturn(true);
    this.scope.initializeController();
    expect(this.scope.initEditor).toHaveBeenCalled();
    expect(this.scope.loadTemplates).toHaveBeenCalled();
  });

  it('correctly loads templates', function() {
    var templates = [new IndexTemplate("1", {}), new IndexTemplate("2", {})];
    this.ElasticService.getIndexTemplates = function(success, error) {
      success(templates);
    };
    spyOn(this.ElasticService, 'getIndexTemplates').andCallThrough();
    spyOn(this.scope.paginator, 'setCollection').andCallThrough();
    this.scope.loadTemplates();
    expect(this.ElasticService.getIndexTemplates).toHaveBeenCalled();
    expect(this.scope.paginator.setCollection).toHaveBeenCalledWith(templates);
    expect(this.scope.page.elements[0]).toEqual(templates[0]);
    expect(this.scope.page.elements[1]).toEqual(templates[1]);
    expect(this.scope.paginator.getCollection()[0]).toEqual(templates[0]);
    expect(this.scope.paginator.getCollection()[1]).toEqual(templates[1]);
  });

  it('alerts when loading templates fails', function() {
    var templates = [new IndexTemplate("1", {}), new IndexTemplate("2", {})];
    this.ElasticService.getIndexTemplates = function(success, error) {
      error("just any error");
    };
    spyOn(this.ElasticService, 'getIndexTemplates').andCallThrough();
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.loadTemplates();
    expect(this.ElasticService.getIndexTemplates).toHaveBeenCalled();
    expect(this.AlertService.error).toHaveBeenCalledWith(
        "Error while loading templates",
        "just any error");
  });

  it('Validate template name', function() {
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.createIndexTemplate();
    expect(this.AlertService.error).toHaveBeenCalledWith(
        "Template name can't be empty"
    );
  });

  it('Interruprts creation if template body is valid', function() {
    this.scope.template.name = 'valid';
    var editor = {
      error: 'Invalid JSON',
      format: function() {
        return '{ "whatever" }';
      },
      getValue: function() {
        return '{ "whatever" }';
      },
      hasContent: function() {
        return true;
      }
    };
    this.scope.editor = editor;
    this.ElasticService.createIndexTemplate = function() {};
    spyOn(this.ElasticService, 'createIndexTemplate').andReturn(true);
    this.scope.createIndexTemplate();
    expect(this.ElasticService.createIndexTemplate).not.toHaveBeenCalled();
  });

  it('validates empty template body', function() {
    this.scope.template.name = 'valid';
    var editor = {
      hasContent: function() {
        return false;
      }
    };
    this.scope.editor = editor;
    this.ElasticService.createIndexTemplate = function() {};
    spyOn(this.ElasticService, 'createIndexTemplate').andReturn(true);
    spyOn(this.AlertService, 'error').andReturn(true);
    this.scope.createIndexTemplate();
    expect(this.ElasticService.createIndexTemplate).not.toHaveBeenCalled();
    expect(this.AlertService.error).toHaveBeenCalledWith(
        "Template body can't be empty"
    );
  });

  it('Successfuly creates an index template', function() {
    var editor = {
      error: undefined,
      format: function() {
        return '{ "template": ""}';
      },
      getValue: function() {
        return '{ "template": ""}';
      },
      hasContent: function() {
        return true;
      }
    };
    var template = new IndexTemplate("template_name", {});
    this.scope.template = template;
    this.scope.editor = editor;
    this.ElasticService.createIndexTemplate = function(name, success, error) {
      success();
    };
    spyOn(this.ElasticService, "createIndexTemplate").andCallThrough();
    spyOn(this.scope, "loadTemplates").andReturn(true);
    this.scope.createIndexTemplate();
    expect(this.scope.template.body).toEqual(editor.getValue());
    expect(this.ElasticService.createIndexTemplate).toHaveBeenCalledWith(template,
        jasmine.any(Function),
        jasmine.any(Function));
    expect(this.scope.loadTemplates).toHaveBeenCalled();
  });

  it('handles failure while creating an index template', function() {
    var editor = {
      error: undefined,
      format: function() {
        return '{ "template": ""}';
      },
      getValue: function() {
        return '{ "template": ""}';
      },
      hasContent: function() {
        return true;
      }
    };
    var template = new IndexTemplate("template_name", {});
    this.scope.template = template;
    this.scope.editor = editor;
    this.ElasticService.createIndexTemplate = function(name, success, error) {
      error("failing is ok :)");
    };
    spyOn(this.AlertService, "error").andCallThrough();
    this.scope.createIndexTemplate();
    expect(this.AlertService.error).toHaveBeenCalledWith(
        'Error while creating template'
        , 'failing is ok :)'
    );
  });

  // TODO: how to make this work with the call that happens once user confirms?
  it('Successfully deletes an existing template', function() {
    this.scope.index = { 'name': "index_name" };
    this.ElasticService.deleteIndexTemplate = function() {};
    spyOn(this.ElasticService, "deleteIndexTemplate").andReturn(true);
    spyOn(this.ConfirmDialogService, "open").andReturn(true);
    this.scope.deleteIndexTemplate(new IndexTemplate("template_name", {}));
    expect(this.ConfirmDialogService.open).toHaveBeenCalledWith(
        "are you sure you want to delete template template_name?",
        {},
        "Delete",
        jasmine.any(Function)
    );
  });

  it('loads an existing template for edition', function() {
    var editor = {
      setValue: function(template) {
        return true;
      }
    };
    var template = new IndexTemplate('template_name_to_load', { someProperty: 'someValue'});
    this.scope.template = template;
    this.scope.editor = editor;
    spyOn(editor, 'setValue').andReturn(true);
    this.scope.loadIndexTemplate(template);
    expect(editor.setValue).toHaveBeenCalledWith(JSON.stringify(template.body, undefined, 2));
    expect(this.scope.template.name).toEqual('template_name_to_load');
  });

});
