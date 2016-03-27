kopf.controller('IndexTemplatesController', ['$scope', 'ConfirmDialogService',
  'AlertService', 'AceEditorService', 'ElasticService',
  function($scope, ConfirmDialogService, AlertService, AceEditorService,
           ElasticService) {

    var TemplateBase = JSON.stringify(
        {
          template: 'template pattern(e.g.: index*)',
          settings: {},
          mappings: {},
          aliases: {}
        },
        undefined,
        2
    );

    $scope.editor = undefined;

    $scope.paginator = new Paginator(1, 10, [],
        new IndexTemplateFilter('', ''));

    $scope.template = new IndexTemplate('', {});

    $scope.$watch('paginator', function(filter, previous) {
      $scope.page = $scope.paginator.getPage();
    }, true);

    $scope.initEditor = function() {
      if (!angular.isDefined($scope.editor)) {
        $scope.editor = AceEditorService.init('index-template-editor');
        $scope.editor.setValue(TemplateBase);
      }
    };

    $scope.loadTemplates = function() {
      ElasticService.getIndexTemplates(
          function(templates) {
            $scope.paginator.setCollection(templates);
            $scope.page = $scope.paginator.getPage();
          },
          function(error) {
            AlertService.error('Error while loading templates', error);
          }
      );
    };

    $scope.createIndexTemplate = function() {
      if ($scope.template.name) {
        if ($scope.editor.hasContent()) {
          $scope.editor.format();
          if (!isDefined($scope.editor.error)) {
            $scope.template.body = $scope.editor.getValue();
            ElasticService.createIndexTemplate($scope.template,
                function(response) {
                  $scope.loadTemplates();
                  AlertService.success(
                      'Template successfully created',
                      response
                  );
                },
                function(error) {
                  AlertService.error('Error while creating template', error);
                }
            );
          }
        } else {
          AlertService.error('Template body can\'t be empty');
        }
      } else {
        AlertService.error('Template name can\'t be empty');
      }
    };

    $scope.deleteIndexTemplate = function(template) {
      ConfirmDialogService.open(
          'are you sure you want to delete template ' + template.name + '?',
          template.body,
          'Delete',
          function() {
            ElasticService.deleteIndexTemplate(template.name,
                function(response) {
                  AlertService.success('Template successfully deleted',
                      response);
                  $scope.loadTemplates();
                },
                function(error) {
                  AlertService.error('Error while deleting template', error);
                }
            );
          }
      );
    };

    $scope.loadIndexTemplate = function(template) {
      $scope.template.name = template.name;
      $scope.editor.setValue(JSON.stringify(template.body, undefined, 2));
    };

    $scope.initializeController = function() {
      $scope.loadTemplates();
      $scope.initEditor();
    };
  }
]);
