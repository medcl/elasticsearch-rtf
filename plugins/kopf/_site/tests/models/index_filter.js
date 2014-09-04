test("Blank index filter", function() {
    var filter = new IndexFilter("", "", false, 0);
    var index = new Index('index_name', null, {}, {});
    ok(filter.matches(index), "Matches any index if filter is blank");
})

test("Hide special index filter and regular index", function() {
    var filter = new IndexFilter("", "", true, 0);
    var index = new Index('index_name', null, {}, {});
    ok(filter.matches(index), "Matches regular index if hiding special");
})

test("Hide special index filter and special index", function() {
    var filter = new IndexFilter("", "", true, 0);
    var index = new Index('.index_name', null, {}, {});
    ok(!filter.matches(index), "Doesnt match special index if hide special is enabled");
})

test("Filter by name on different name index", function() {
    var filter = new IndexFilter("abc", "", true, 0);
    var index = new Index('cba', null, {}, {});
    ok(!filter.matches(index), "Doesnt match if filter name is not a substring of name");
})

test("Filter by name on index with matching name", function() {
    var filter = new IndexFilter("abc", "", true, 0);
    var index = new Index('abcdef', null, {}, {});
    ok(filter.matches(index), "Matches if filter name is a substring of name");
})

test("Filter by name regexp on index with matching name", function() {
    var filter = new IndexFilter("a\.+f", "", true, 0);
    var index = new Index('abcdef', null, {}, {});
    ok(filter.matches(index), "Matches if filter reg exp matches index name");
})

test("Use regexp as plain string if regexp doesnt compile", function() {
    var filter = new IndexFilter("a\.f-", "", true, 0);
    var index = new Index('a.f-', null, {}, {});
    ok(filter.matches(index), "Matches if filter reg exp matches index name");
})

test("Use regexp as plain string if regexp doesnt compile", function() {
    var filter = new IndexFilter("a\.f-", "", true, 0);
    var index = new Index('a.f-', null, {}, {});
    ok(filter.matches(index), "Matches if filter non compiling reg exp matches index name");
})

test("Filter out closed index", function() {
    var filter = new IndexFilter("", "close", true, 0);
    var index = new Index('');
    var index2 = new Index('', {}, {}, {});
    ok(filter.matches(index), "Matches if index is closed");
    ok(!filter.matches(index2), "doesnt matches if index is open");
})

test("Filter out open index", function() {
    var filter = new IndexFilter("", "open", true, 0);
    var index = new Index('');
    var index2 = new Index('', {}, {}, {}, {});
    ok(!filter.matches(index), "Doesnt matches if index is closed");
    ok(filter.matches(index2), "Matches if index is open");
})

test("Filter out open index", function() {
    var filter = new IndexFilter("", "unhealthy", true, 0);
    var index = new Index('', null, {state: 'close'}, {});
    index.unhealthy = true;
    var index2 = new Index('', null, {state: 'open'}, {});
    index2.unhealthy = false;
    ok(filter.matches(index), "Matches if index is unhealthy");
    ok(!filter.matches(index2), "Doesnt matches if index is healthy");
})