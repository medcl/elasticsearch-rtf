function IndexAliases(index, aliases) {
  this.index = index;
  this.aliases = aliases;

  this.clone = function() {
    var cloned = new IndexAliases(this.index, []);
    cloned.aliases = this.aliases.map(function(alias) {
      return alias.clone();
    });
    return cloned;
  };
}

IndexAliases.diff = function(original, modified) {
  var differences = [];
  modified.forEach(function(ia) {
    var isNew = true;
    original.forEach(function(origIA) {
      if (ia.index == origIA.index) {
        isNew = false;
        ia.aliases.forEach(function(alias) {
          var originalAliases = origIA.aliases.filter(function(originalAlias) {
            return alias.equals(originalAlias);
          });
          if (originalAliases.length === 0) {
            differences.push(alias);
          }
        });
      }
    });
    if (isNew) {
      ia.aliases.forEach(function(alias) {
        differences.push(alias);
      });
    }
  });
  return differences;
};

function Alias(alias, index, filter, indexRouting, searchRouting) {
  this.alias = isDefined(alias) ? alias.toLowerCase() : '';
  this.index = isDefined(index) ? index.toLowerCase() : '';
  this.filter = isDefined(filter) ? filter : '';
  this.index_routing = isDefined(indexRouting) ? indexRouting : '';
  this.search_routing = isDefined(searchRouting) ? searchRouting : '';

  this.validate = function() {
    if (!notEmpty(this.alias)) {
      throw 'Alias must have a non empty name';
    }
    if (!notEmpty(this.index)) {
      throw 'Alias must have a valid index name';
    }
  };

  this.equals = function(otherAlias) {
    var equal =
        (this.alias === otherAlias.alias) &&
        (this.index === otherAlias.index) &&
        (this.filter === otherAlias.filter) &&
        (this.index_routing === otherAlias.index_routing) &&
        (this.search_routing === otherAlias.search_routing);
    return equal;
  };

  this.info = function() {
    var info = {};
    info.index = this.index;
    info.alias = this.alias;

    if (isDefined(this.filter)) {
      if (typeof this.filter == 'string' && notEmpty(this.filter)) {
        info.filter = JSON.parse(this.filter);
      } else {
        info.filter = this.filter;
      }
    }
    if (notEmpty(this.index_routing)) {
      info.index_routing = this.index_routing;
    }
    if (notEmpty(this.search_routing)) {
      info.search_routing = this.search_routing;
    }
    return info;
  };

  this.clone = function() {
    return new Alias(this.alias, this.index, this.filter, this.index_routing,
        this.search_routing);
  };
}
