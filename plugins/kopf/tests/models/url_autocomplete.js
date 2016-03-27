
var mappings = {
  getIndices: function() {
    return ['foo', 'bar', 'qux'];
  },
  getTypes: function(index) {
    return {
      foo: ['foobar'],
      bar: ['baz', 'qux'],
      qux: ['bar']
    }[index];
  }
};

test("Autocomplete first part of path", function() {
  var suggest = new URLAutocomplete(mappings);
  deepEqual(suggest.getAlternatives('f'), [ "_msearch", "_search", "_suggest", "bar", "foo", "qux" ], 'First part suggest');
});

test("Autocomplete second part of path", function() {
  var suggest = new URLAutocomplete(mappings);
  deepEqual(suggest.getAlternatives('foo/'), [ "foo/_msearch", "foo/_search", "foo/_suggest", "foo/foobar" ], 'Second prt suggest foo/');
  deepEqual(suggest.getAlternatives('foo/f'), [ "foo/_msearch", "foo/_search", "foo/_suggest", "foo/foobar" ], 'Second part suggest foo/f');
  deepEqual(suggest.getAlternatives('_search/'), [ "_search/exists", "_search/template" ], 'Second part suggest _search/');
});

test("Autocomplete third part of path", function() {
  var suggest = new URLAutocomplete(mappings);
  deepEqual(suggest.getAlternatives('foo/foobar/'), [ "foo/foobar/_msearch", "foo/foobar/_search" ], 'Third part suggest foo/foobar/');
  deepEqual(suggest.getAlternatives('foo/_search/'), [ "foo/_search/exists", "foo/_search/template" ], 'Third part suggest foo/_search/');
});

test("Autocomplete fourth part of path", function() {
  var suggest = new URLAutocomplete(mappings);
  deepEqual(suggest.getAlternatives('bar/baz/_search/'), [ "bar/baz/_search/exists", "bar/baz/_search/template" ], 'Third part suggest bar/baz/_search');
  deepEqual(suggest.getAlternatives('qux/bar/_msearch/'), [ "qux/bar/_msearch/template" ], 'Third part suggest qux/bar/_msearch');
});