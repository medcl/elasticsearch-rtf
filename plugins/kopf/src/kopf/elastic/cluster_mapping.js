function ClusterMapping(data) {

  this.getIndices = function() {
    return Object.keys(data);
  };

  this.getTypes = function(index) {
    var indexMapping = getProperty(data, index + '.mappings', {});
    return Object.keys(indexMapping);
  };

}
