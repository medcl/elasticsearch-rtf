function readablizeBytes(bytes) {
  if (bytes > 0) {
    var s = ['b', 'KB', 'MB', 'GB', 'TB', 'PB'];
    var e = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, e)).toFixed(2) + s[e];
  } else {
    return 0;
  }
}

// Gets the value of a nested property from an object if it exists.
// Otherwise returns the default_value given.
// Example: get the value of object[a][b][c][d]
// where property_path is [a,b,c,d]
function getProperty(object, propertyPath, defaultValue) {
  if (isDefined(object)) {
    if (isDefined(object[propertyPath])) {
      return object[propertyPath];
    }
    var pathParts = propertyPath.split('.'); // path as nested properties
    for (var i = 0; i < pathParts.length && isDefined(object); i++) {
      object = object[pathParts[i]];
    }
  }
  return isDefined(object) ? object : defaultValue;
}

// Checks if value is both non null and undefined
function isDefined(value) {
  return value !== null && typeof value != 'undefined';
}

// Checks if the String representation of value is a non empty string
// string.trim().length is grater than 0
function notEmpty(value) {
  return isDefined(value) && value.toString().trim().length > 0;
}

function isNumber(value) {
  var exp = /\d+/;
  return exp.test(value);
}

// Returns the given date as a String formatted as hh:MM:ss
function getTimeString(date) {
  var hh = ('0' + date.getHours()).slice(-2);
  var mm = ('0' + date.getMinutes()).slice(-2);
  var ss = ('0' + date.getSeconds()).slice(-2);
  return hh + ':' + mm + ':' + ss;
}
