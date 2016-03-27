// isDefined tests
test("isDefined method", function() {
	ok(isDefined(null) === false, "isDefined for null property");
	ok(isDefined() === false, "isDefined with no argument");
	ok(isDefined(undefined) === false, "isDefined for undefined property");
	ok(isDefined("foobar"), "isDefined for defined string");
	ok(isDefined(1), "isDefined for defined int");
	ok(isDefined({}), "isDefined for empty map");
});

// notEmpty tests
test("notEmpty method", function() {
	ok(notEmpty(null) === false, "notEmpty for null value");
	ok(notEmpty() === false, "notEmpty with no argument");
	ok(notEmpty(undefined) === false, "notEmpty with undefined argument");
	ok(notEmpty("") === false, "notEmpty with empty string");
	ok(notEmpty("foobar"), "notEmpty with non empty string" );
	ok(notEmpty(1), "notEmpty with non empty string");
});


// getProperty tests
test("getProperty method", function() {
	var obj = {};
	obj['foo.bar.property'] = "foobar";
	ok(getProperty(obj, 'foo.bar.property') == "foobar", "Get property with path as string");
	var obj2 = {};
	obj2['foo'] = {};
	obj2['foo']['bar'] = {};
	obj2['foo']['bar']['property'] = "foobar";
	ok(getProperty(obj2, 'foo.bar.property') == "foobar", "Get property with path sa nested properties");
	var obj3 = {};
	ok(getProperty(obj3, 'foo.bar.property', "foobar") == "foobar", "Get default value for property!");
});

// readablizeBytes tests
test("getProperty defualt value for unexistng property", function() {
	ok(readablizeBytes(1) == "1.00b", 		   				"Got " + readablizeBytes(1) + ", expected 1.00b");
	ok(readablizeBytes(10) == "10.00b", 	   				"Got " + readablizeBytes(10) + ", expected 10.00b");
	ok(readablizeBytes(100) == "100.00b", 	   				"Got " + readablizeBytes(100) + ", expected 100.00b");
	ok(readablizeBytes(1000) == "1000.00b",	   				"Got " + readablizeBytes(1000) + ", expected 1000.00b");
	ok(readablizeBytes(10000) == "9.77KB", 	   				"Got " + readablizeBytes(10000) + ", expected 9.77KB");
	ok(readablizeBytes(100000) == "97.66KB",   				"Got " + readablizeBytes(100000) + ", expected 97.66KB");
	ok(readablizeBytes(1000000) == "976.56KB",   			"Got " + readablizeBytes(1000000) + ", expected 976.56KB");
	ok(readablizeBytes(10000000) == "9.54MB",  				"Got " + readablizeBytes(10000000) + ", expected 9.54MB");
	ok(readablizeBytes(100000000) == "95.37MB",				"Got " + readablizeBytes(100000000) + ", expected 95.37MB");
	ok(readablizeBytes(1000000000) == "953.67MB", 			"Got " + readablizeBytes(1000000000) + ", expected 953.67MB");
	ok(readablizeBytes(10000000000) == "9.31GB",			"Got " + readablizeBytes(10000000000) + ", expected 9.31GB");
	ok(readablizeBytes(100000000000) == "93.13GB",			"Got " + readablizeBytes(100000000000) + ", expected 93.14GB");
	ok(readablizeBytes(1000000000000) == "931.32GB",		"Got " + readablizeBytes(1000000000000) + ", expected 931.32GB");
	ok(readablizeBytes(10000000000000) == "9.09TB",			"Got " + readablizeBytes(10000000000000) + ", expected 9.09TB");
	ok(readablizeBytes(100000000000000) == "90.95TB",		"Got " + readablizeBytes(100000000000000) + ", expected 90.95TB");
	ok(readablizeBytes(1000000000000000) == "909.49TB",		"Got " + readablizeBytes(1000000000000000) + ", expected 909.49TB");
	ok(readablizeBytes(10000000000000000) == "8.88PB",		"Got " + readablizeBytes(10000000000000000) + ", expected 8.88PB");
	ok(readablizeBytes(100000000000000000) == "88.82PB",	"Got " + readablizeBytes(100000000000000000) + ", expected 88.82PB");
	ok(readablizeBytes(1000000000000000000) == "888.18PB",	"Got " + readablizeBytes(1000000000000000000) + ", expected 888.18PB");
});

// getProperty tests
test("getTimeString method", function() {
	ok(getTimeString(new Date(79,5,24,11,33,0)) == "11:33:00", "Date with time 11:33:00");
	ok(getTimeString(new Date(79,5,24,0,0,0)) == "00:00:00", "Date with time 00:00:00");
	ok(getTimeString(new Date(79,5,24,12,5,5)) == "12:05:05", "Date with time 12:05:05");
});
