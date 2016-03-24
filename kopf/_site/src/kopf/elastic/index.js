function Index(index_name,index_info, index_metadata, index_status) {
	this.name = index_name;
	var index_shards = {};
	this.shards = index_shards;
	this.metadata = {};
	this.aliases = getProperty(index_metadata,'aliases', []);

	this.visibleAliases=function() { return this.aliases.length > 5 ? this.aliases.slice(0,5) : this.aliases; };
	
	this.settings = index_metadata.settings;
	// FIXME: 0.90/1.0 check
	this.editable_settings = new EditableIndexSettings(index_metadata.settings);
	this.mappings = index_metadata.mappings;
	this.metadata.settings = this.settings;
	this.metadata.mappings = this.mappings;

	// FIXME: 0.90/1.0 check
	this.num_of_shards = getProperty(index_metadata.settings, 'index.number_of_shards');
	this.num_of_replicas = parseInt(getProperty(index_metadata.settings, 'index.number_of_replicas'));
	this.state = index_metadata.state;
	
	this.num_docs = getProperty(index_status, 'docs.num_docs', 0);
	this.max_doc = getProperty(index_status, 'docs.max_doc', 0);
	this.deleted_docs = getProperty(index_status, 'docs.deleted_docs', 0);
	this.size = getProperty(index_status, 'index.primary_size_in_bytes', 0);
	this.total_size = getProperty(index_status, 'index.size_in_bytes', 0);	
	this.size_in_bytes = readablizeBytes(this.size);
	this.total_size_in_bytes = readablizeBytes(this.total_size);
	
	var unassigned = [];

	// adds shard information
	
	var unhealthy = false;
	
	if (isDefined(index_info)) {
		$.map(index_info.shards, function(shards, shard_num) {
			$.map(shards, function(shard_routing, shard_copy) {
				if (shard_routing.node === null) {
					unassigned.push(new UnassignedShard(shard_routing));	
				} else {
					if (!isDefined(index_shards[shard_routing.node])) {
						index_shards[shard_routing.node] = [];
					}
					var shard_status = null;
					if (isDefined(index_status) && isDefined(index_status.shards[shard_routing.shard])) {
						index_status.shards[shard_routing.shard].forEach(function(status) {
							if (status.routing.node == shard_routing.node && status.routing.shard == shard_routing.shard) {
								shard_status = status;
							}
						});
					}
					var new_shard = new Shard(shard_routing, shard_status);
					
					if (new_shard.state == "RELOCATING" || new_shard.state == "INITIALIZING") {
						unhealthy = true;
					}
					
					index_shards[shard_routing.node].push(new_shard);				
				}
			});
		});
	}

	this.unhealthy = unhealthy || unassigned.length > 0;
	this.unassigned = unassigned;
	
	this.settingsAsString=function() {
		return prettyPrintObject(this.metadata);
	};
	this.compare=function(b) { // TODO: take into account index properties?
		return this.name.localeCompare(b.name);
	};
	
	this.getTypes=function() {
		return Object.keys(this.mappings).sort(function(a, b) { return a.localeCompare(b); });
	};
	
	this.getAnalyzers=function() {
		// FIXME: 0.90/1.0 check
		var analyzers = Object.keys(getProperty(this.settings,'index.analysis.analyzer', {}));
		if (analyzers.length === 0) {
			Object.keys(this.settings).forEach(function(setting) {
				if (setting.indexOf('index.analysis.analyzer') === 0) {
					var analyzer = setting.substring('index.analysis.analyzer.'.length);
					analyzer = analyzer.substring(0,analyzer.indexOf("."));
					if ($.inArray(analyzer, analyzers) == -1) {
						analyzers.push(analyzer);
					}
				}
			});			
		}
		return analyzers.sort(function(a, b) { return a.localeCompare(b); });
	};
	
	function isAnalyzable(type) {
		var non_analyzable_types = ['integer', 'long', 'float', 'double', 'multi_field'];
		return non_analyzable_types.indexOf(type) == -1;
	}
	
	this.getFields=function(type) {
		if (isDefined(this.mappings[type])) {
			var fields = this.mappings[type].properties;
			var validFields = [];
			Object.keys(fields).forEach(function(field) {
				// multi fields
				if (isDefined(fields[field].fields)) {
					var full_path = fields[field].path != 'just_name';
					var multi_fields = fields[field].fields;
					Object.keys(multi_fields).forEach(function(multi_field) {
						if (isAnalyzable(multi_fields[multi_field].type)) {
							if (field != multi_field && full_path) {
								validFields.push(field + "." + multi_field);		
							} else {
								validFields.push(multi_field);	
							}
						}
					});
				}
				// normal fields
				if (isAnalyzable(fields[field].type)) {
					validFields.push(field);
				}
			});
			return validFields.sort(function(a, b) { return a.localeCompare(b); });
		} else {
			return [];
		}
	};
	
	this.isSpecial=function() {
		return (
			this.name.indexOf(".") === 0 ||
			this.name.indexOf("_") === 0
		);
	};
	
	this.equals=function(index) {
		return index !== null && index.name == this.name;
	};
	
	this.closed=function() {
		return this.state === "close";
	};
	
	this.open=function() {
		return this.state === "open";
	};
}