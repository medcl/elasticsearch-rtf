function NodeHotThreads(data) {
  var lines = data.split('\n');
  this.header = lines[0];
  // pre 4859ce5d79a786b58b1cd2fb131614677efd6b91
  var BackwardCompatible = lines[1].indexOf('Hot threads at') == -1;
  var HeaderLines = BackwardCompatible ? 2 : 3;
  this.subHeader = BackwardCompatible ? undefined : lines[1];
  this.node = this.header.substring(
      this.header.indexOf('[') + 1,
      this.header.indexOf(']')
  );
  var threads = [];
  var thread;
  if (lines.length > HeaderLines) {
    lines.slice(HeaderLines).forEach(function(line) {
      var blankLine = line.trim().length === 0;
      if (thread) {
        if (thread.subHeader) {
          thread.stack.push(line);
          if (blankLine) {
            thread = undefined;
          }
        } else {
          thread.subHeader = line;
        }
      } else {
        thread = new HotThread(line);
        threads.push(thread);
      }
    });
  }
  this.threads = threads;

}
