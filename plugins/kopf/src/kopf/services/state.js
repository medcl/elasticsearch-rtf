kopf.factory('AppState', function() {

  this.properties = {};

  this.getProperty = function(controller, property, defaultValue) {
    if (this.properties[controller] === undefined) {
      this.properties[controller] = {};
    }
    if (this.properties[controller][property] === undefined) {
      this.properties[controller][property] = defaultValue;
    }
    return this.properties[controller][property];
  };

  return this;

});
