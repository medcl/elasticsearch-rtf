function CatResult(result) {
  var lines = result.split('\n');
  var header = lines[0];
  var columns = header.match(/\S+/g);
  var values = lines.slice(1, -1).map(function(line) {
    return columns.map(function(column, i) {
      var start = header.indexOf(column);
      var lastColumn = i < columns.length - 1;
      var end = lastColumn ? header.indexOf(columns[i + 1]) : undefined;
      return line.substring(start, end).trim();
    });
  });

  this.columns = columns;
  this.lines = values;
}
