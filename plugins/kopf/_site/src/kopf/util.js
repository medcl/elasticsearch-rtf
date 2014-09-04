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
function getProperty(object, property_path, default_value) {
	if (isDefined(object)) {
		if (isDefined(object[property_path])) {
			return object[property_path];
		}
		var path_parts = property_path.split('.'); // path as nested properties
		for (var i = 0; i < path_parts.length && isDefined(object); i++) {
			object = object[path_parts[i]];
		}
	}
	return isDefined(object) ? object : default_value;
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
	return ('0' + date.getHours()).slice(-2) + ":" + ('0' + date.getMinutes()).slice(-2) + ":" + ('0' + date.getSeconds()).slice(-2);
}

function prettyPrintObject(object) {
	var prettyObject = {};
	Object.keys(object).forEach(function(key) {
		var parts = key.split(".");
		var property = null;
		var reference = prettyObject;
		var previous = null;
		for (var i = 0; i<parts.length; i++) {
			if (i == parts.length - 1) {
				if (isNaN(parts[i])) {
					reference[parts[i]] = object[key];	
				} else {
					if (!(previous[property] instanceof Array)) {
						previous[property] = [];
					}
					previous[property].push(object[key]);
				}
			} else {
				property = parts[i];
				if (!isDefined(reference[property])) {
					reference[property] = {};
				}
				previous = reference;
				reference = reference[property];
			}
		}
	});
	return JSON.stringify(prettyObject,undefined,4);
}