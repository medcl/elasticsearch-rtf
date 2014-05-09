
function NavbarCtrl($scope, $rootScope, $route, $location, Data) {
    $scope.data = Data;

    $scope.data.host = window.location.protocol + '//' + window.location.host;

$.ajax({
  url: $scope.data.host +'/rtf/',
  type: 'PUT',
  success: function(data) {
  }
});

    $scope.isActive = function(route) {

        var path = $location.path();


        if (path === '/')
            path = '/queries';

        return (('/' + route.toLowerCase()) === path);
    }


}
