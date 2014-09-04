kopf.factory('ElasticService', ['$http','$q', function($http, $q) {
    this.client = null;
    this.connection = null;

    this.connect=function(url) {
        this.client = null;
        this.connection = null;
        if (url.indexOf("http://") !== 0 && url.indexOf("https://") !== 0) {
            url = "http://" + url;
        }
        this.connection = new ESConnection(url);
        this.client = new ElasticClient(this.connection, $http, $q);
    };

    this.isConnected=function() {
      return isDefined(this.client);
    };

    return this;

}]);