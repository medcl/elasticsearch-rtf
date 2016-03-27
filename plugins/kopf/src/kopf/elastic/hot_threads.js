function HotThreads(data) {
  this.nodes_hot_threads = data.split(':::').slice(1).map(function(data) {
    return new NodeHotThreads(data);
  });
}
