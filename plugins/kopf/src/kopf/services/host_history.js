kopf.factory('HostHistoryService', function() {

  this.getHostHistory = function() {
    var history = localStorage.getItem('kopfHostHistory');
    history = isDefined(history) ? history : '[]';
    return JSON.parse(history);
  };

  this.addToHistory = function(connection) {
    var host = connection.host.toLowerCase();
    var username = connection.username;
    var password = connection.password;
    if (username && password) {
      host = host.replace(/^(https|http):\/\//gi, function addAuth(prefix) {
        return prefix + username + ':' + password + '@';
      });
    }
    var entry = {host: host};
    var history = this.getHostHistory();
    for (var i = 0; i < history.length; i++) {
      if (history[i].host === host) {
        history.splice(i, 1);
        break;
      }
    }
    history.splice(0, 0, entry);
    if (history.length > 10) {
      history.length = 10;
    }
    localStorage.setItem('kopfHostHistory', JSON.stringify(history));
  };

  this.clearHistory = function() {
    localStorage.removeItem('kopfHostHistory');
  };

  return this;

});
