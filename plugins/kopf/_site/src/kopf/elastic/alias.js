function IndexAliases(index, aliases) {
    this.index = index;
    this.aliases = aliases;

    this.clone=function() {
        var cloned = new IndexAliases(this.index, []);
        cloned.aliases = this.aliases.map(function(alias) { return alias.clone(); });
        return cloned;
    };
}

IndexAliases.diff=function(original, modified) {
    var differences = [];
    modified.forEach(function(ia) {
        var is_new = true;
        original.forEach(function(orig_ia) {
            if (ia.index == orig_ia.index) {
                is_new = false;
                ia.aliases.forEach(function(alias) {
                    var original_aliases = orig_ia.aliases.filter(function(original_alias) {
                        return alias.equals(original_alias);
                    });
                    if (original_aliases.length === 0) {
                        differences.push(alias);
                    }
                });
            }
        });
        if (is_new) {
            ia.aliases.forEach(function(alias) { differences.push(alias); });
        }
    });
    return differences;
};

function Alias(alias, index, filter, index_routing, search_routing) {
	this.alias = isDefined(alias) ? alias.toLowerCase() : "";
	this.index = isDefined(index) ? index.toLowerCase() : "";
	this.filter = isDefined(filter) ? filter : "";
	this.index_routing = isDefined(index_routing) ? index_routing : "";
	this.search_routing = isDefined(search_routing) ? search_routing : "";

	this.validate=function() {
		if (!notEmpty(this.alias)) {
			throw "Alias must have a non empty name";
		}
		if (!notEmpty(this.index)) {
			throw "Alias must have a valid index name";
		}
	};

	this.equals=function(other_alias) {
		var equal = 
		(this.alias === other_alias.alias) &&
		(this.index === other_alias.index) &&
		(this.filter === other_alias.filter) &&
		(this.index_routing === other_alias.index_routing) &&
		(this.search_routing === other_alias.search_routing);
		return equal;
	};

	this.info=function() {
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

    this.clone=function() {
        return new Alias(this.alias, this.index, this.filter, this.index_routing, this.search_routing);
    };
}