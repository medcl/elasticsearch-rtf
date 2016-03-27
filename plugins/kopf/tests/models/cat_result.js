QUnit.test( "cat result when column starts after value(docs)", function( assert ) {
  var response =
      'id                     host              ip         node                          \n' +
      'FDr3acnmQkaaz-9m2YZxHw foobarfoobarfooba 10.8.36.70 foobarfoobarfoobarfoobarfooba \n';
  var result = new CatResult(response);
  var expectedColumns = ['id', 'host', 'ip', 'node'];
  var expectedValues = ['FDr3acnmQkaaz-9m2YZxHw', 'foobarfoobarfooba', '10.8.36.70', 'foobarfoobarfoobarfoobarfooba'];
  assert.deepEqual(result.columns, expectedColumns, "correctly parses columns");
  assert.deepEqual(result.lines[0], expectedValues, "correctly parses values");
});
