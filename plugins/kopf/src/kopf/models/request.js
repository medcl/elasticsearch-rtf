function Request(path, method, body) {
  this.timestamp = getTimeString(new Date());
  this.path = path;
  this.method = method;
  this.body = body;

  this.clear = function() {
    this.path = '';
    this.method = '';
    this.body = '';
  };

  this.loadFromJSON = function(json) {
    if (isDefined(json.url)) {
      var url = json.url.substring(7);
      var path = url.substring(url.indexOf('/'));
      this.path = path;
    } else {
      this.path = json.path;
    }
    this.method = json.method;
    this.body = json.body;
    this.timestamp = json.timestamp;
    return this;
  };

  this.equals = function(request) {
    return (
      this.path === request.path &&
      this.method.toUpperCase() === request.method.toUpperCase() &&
      this.body === request.body
      );
  };
}
