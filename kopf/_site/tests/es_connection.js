test("Creating regular ES connection", function() {
	var con = new ESConnection("http://localhost:9200");
	ok(con.host == "http://localhost:9200", "Checking host");
})

test("Creating HTTPS ES connection", function() {
	var con = new ESConnection("https://localhost:9200");
	ok(con.host == "https://localhost:9200", "Checking host");
})

test("Creating ES connection with username + password", function() {
	var con = new ESConnection("http://foo:bar@localhost:9200");
	ok(con.host == "http://localhost:9200", "Checking host");
	ok(con.username == "foo", "Checking username");
	ok(con.password == "bar", "Checking password");
})