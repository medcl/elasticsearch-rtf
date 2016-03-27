function Benchmark() {
  this.name = '';
  this.num_executor = 1;
  this.percentiles = '[10, 25, 50, 75, 90, 99]';
  this.competitors = [];

  this.addCompetitor = function(competitor) {
    this.competitors.push(competitor);
  };

  this.toJson = function() {
    var body = {};
    body.name = this.name;
    if (notEmpty(this.num_executor)) {
      body.num_executor_nodes = this.num_executor;
    }
    if (notEmpty(this.percentiles)) {
      body.percentiles = JSON.parse(this.percentiles);
    }
    if (this.competitors.length > 0) {
      body.competitors = this.competitors.map(function(c) {
        return c.toJson();
      });
    }
    if (notEmpty(this.iterations)) {
      body.iterations = this.iterations;
    }
    if (notEmpty(this.concurrency)) {
      body.concurrency = this.concurrency;
    }
    if (notEmpty(this.multiplier)) {
      body.multiplier = this.multiplier;
    }
    if (notEmpty(this.num_slowest)) {
      body.num_slowest = this.num_slowest;
    }
    return JSON.stringify(body, null, 4);
  };

}

function Competitor() {
  this.name = '';

  // override benchmark options
  this.iterations = '';
  this.concurrency = '';
  this.multiplier = '';
  this.num_slowest = '';
  this.warmup = true;
  this.requests = [];

  // defined only by competitor
  this.search_type = 'query_then_fetch';
  this.indices = '';
  this.types = '';

  // cache
  this.filter_cache = false;
  this.field_data = false;
  this.recycler_cache = false;
  this.id_cache = false;

  this.cache_fields = '';
  this.cache_keys = '';

  this.toJson = function() {
    var body = {};
    body.name = this.name;
    if (notEmpty(this.requests)) {
      body.requests = JSON.parse(this.requests);
    }
    if (notEmpty(this.iterations)) {
      if (isNumber(this.iterations)) {
        body.iterations = parseInt(this.iterations);
      } else {
        throw 'Iterations must be a valid number';
      }
    }
    if (notEmpty(this.concurrency)) {
      if (isNumber(this.concurrency)) {
        body.concurrency = parseInt(this.concurrency);
      } else {
        throw 'Concurrency must be a valid number';
      }
    }
    if (notEmpty(this.multiplier)) {
      if (isNumber(this.multiplier)) {
        body.multiplier = parseInt(this.multiplier);
      } else {
        throw 'Multiplier must be a valid number';
      }
    }
    if (notEmpty(this.num_slowest)) {
      if (isNumber(this.num_slowest)) {
        body.num_slowest = parseInt(this.num_slowest);
      } else {
        throw 'Num slowest must be a valid number';
      }
    }
    if (notEmpty(this.indices)) {
      body.indices = this.indices.split(',').map(function(index) {
        return index.trim();
      });
    }
    if (notEmpty(this.types)) {
      body.types = this.types.split(',').map(function(type) {
        return type.trim();
      });
    }

    body.search_type = this.search_type;

    body.clear_caches = {};
    body.clear_caches.filter = this.filter_cache;
    body.clear_caches.field_data = this.field_data;
    body.clear_caches.id = this.id_cache;
    body.clear_caches.recycler = this.recycler_cache;
    if (notEmpty(this.cache_fields)) {
      body.clear_caches.fields = this.cache_fields.split(',').map(
        function(field) {
          return field.trim();
        });
    }
    if (notEmpty(this.cache_keys)) {
      body.clear_caches.filter_keys = this.cache_keys.split(',').map(
        function(key) {
          return key.trim();
        });
    }

    return body;
  };

}
