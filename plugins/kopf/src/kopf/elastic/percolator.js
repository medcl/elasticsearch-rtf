function PercolateQuery(queryInfo) {
  this.index = queryInfo._index;
  this.id = queryInfo._id;
  this.source = queryInfo._source;
  this.filter = {};

  this.sourceAsJSON = function() {
    try {
      return JSON.stringify(this.source, undefined, 2);
    } catch (error) {

    }
  };

  this.equals = function(other) {
    return (other instanceof PercolateQuery &&
      this.index == other.index &&
      this.id == other.id &&
      this.source == other.source);
  };
}

function PercolatorsPage(from, size, total, percolators) {
  this.from = from;
  this.size = size;
  this.total = total;
  this.percolators = percolators;

  this.hasNextPage = function() {
    return from + size < total;
  };

  this.hasPreviousPage = function() {
    return from > 0;
  };

  this.firstResult = function() {
    return total > 0 ? from + 1 : 0;
  };

  this.lastResult = function() {
    return this.hasNextPage() ? from + size : total;
  };

  this.nextOffset = function() {
    return this.hasNextPage() ? from + size : from;
  };

  this.previousOffset = function() {
    return this.hasPreviousPage() ? from - size : from;
  };

  this.getPage = function() {
    return percolators;
  };

  this.total = function() {
    return total;
  };
}
