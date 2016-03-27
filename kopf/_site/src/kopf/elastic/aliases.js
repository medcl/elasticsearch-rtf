function Aliases(aliases_info) {
	var indices  = [];
	var aliases_map = {};
	Object.keys(aliases_info).forEach(function(index) {
		indices.push(index); // fills list of available indices
		var indexAliases = aliases_info[index].aliases;
		Object.keys(indexAliases).forEach(function(alias) { // group aliases per alias name
			if (!isDefined(aliases_map[alias])) {
				aliases_map[alias] = [];
			}
			var alias_instance = new Alias(alias, index, indexAliases[alias].filter, indexAliases[alias].index_routing,indexAliases[alias].search_routing);
			aliases_map[alias].push(alias_instance);
		});
	});
	this.indices = indices.sort(function(a,b) { return a.localeCompare(b); });
	this.info = aliases_map;
}
