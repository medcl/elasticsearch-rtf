kopf.factory('DebugService', ['$filter', function($filter) {

  var MaxMessages = 1000;

  var messages = [];

  var updatedAt = 0;

  var addMessage = function(message) {
    var date = new Date();
    messages.push($filter('date')(date, '[yyyy-MM-dd HH:mm:ss] ') +  message);
    if (messages.length > MaxMessages) {
      messages.shift();
    }
    updatedAt = date.getTime();
  };

  this.debug = function(message, data) {
    addMessage(message);
    if (data) {
      addMessage(JSON.stringify(data));
    }
  };

  this.getUpdatedAt = function() {
    return updatedAt;
  };

  this.getMessages = function() {
    return messages;
  };

  return this;

}]);
