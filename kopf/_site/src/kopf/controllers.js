function Request(url, method, body) {
	this.timestamp = getTimeString(new Date());
	this.url = url;
	this.method = method;
	this.body = body;
	
	this.clear=function() {
		this.url = '';
		this.method = '';
		this.body = '';
	};
	
	this.loadFromJSON=function(json) {
		this.method = json.method;
		this.url = json.url;
		this.body = json.body;
		this.timestamp = json.timestamp;
		return this;
	};
	
	this.equals=function(request) {
		return (
			this.url === request.url &&
			this.method.toUpperCase() === request.method.toUpperCase() &&
			this.body === request.body
		);
	};
}

function AliasesPagination(page, results) {
	this.page = page;
	this.page_size = 10;
	this.results = results;
	this.alias_query = "";
	this.index_query = "";
	this.past_alias_query = null;
	this.past_index_query = null;
	this.total = 0;
	this.cached_results = null;
	
	this.firstResult=function() {
		if (Object.keys(this.getResults()).length > 0) {
			return ((this.current_page() - 1) * this.page_size) + 1;
		} else {
			return 0;
		}
	};
	
	this.lastResult=function() {
		if (this.current_page() * this.page_size > Object.keys(this.getResults()).length) {
			return Object.keys(this.getResults()).length;
		} else {
			return this.current_page() * this.page_size;
		}
	};

	this.hasNextPage=function() {
		return this.page_size * this.current_page() < Object.keys(this.getResults()).length;
	};
	
	this.hasPreviousPage=function() {
		return this.current_page() > 1;
	};
	
	this.nextPage=function() {
		this.page += 1;
	};
	
	this.previousPage=function() {
		this.page -= 1;
	};
	
	this.current_page=function() {
		if (this.alias_query != this.past_alias_query || this.index_query != this.past_index_query) {
			this.page = 1;
		}
		return this.page;
	};
	
	this.getPage=function() {
		var count = 1;
		var first_result = this.firstResult();
		var last_result = this.lastResult();
		var page = {};
		var results = this.getResults();
		Object.keys(results).forEach(function(alias) {
			if (count < first_result || count > last_result) {
				count += 1;
			} else {
				count += 1;
				page[alias] = results[alias];
			}
		});
		return page;
	};
	
	this.setResults=function(results) {
		this.results = results;
		// forces recalculation of page
		this.cached_results = null; 
	};
	
	this.total=function() {
		return Object.keys(this.getResults()).length;
	};
	
	this.getResults=function() {
		var matchingResults = {};
		var filters_changed = (this.alias_query != this.past_alias_query || this.index_query != this.past_index_query);
		if (filters_changed || !isDefined(this.cached_results)) { // if filters changed or no cached, calculate
			var alias_query = this.alias_query;
			var index_query = this.index_query;
			var results = this.results;
			Object.keys(results).forEach(function(alias_name) {
				if (isDefined(alias_query) && alias_query.length > 0) {
					if (alias_name.indexOf(alias_query) != -1) {
						if (isDefined(index_query) && index_query.length > 0) {
							results[alias_name].forEach(function(alias) {
								if (alias.index.indexOf(index_query) != -1) {
									matchingResults[alias_name] = results[alias_name];
								}
							});
						} else {
							matchingResults[alias_name] = results[alias_name];
						}
					} 
				} else {
					if (isDefined(index_query) && index_query.length > 0) {
						results[alias_name].forEach(function(alias) {
							if (alias.index.indexOf(index_query) != -1) {
								matchingResults[alias_name] = results[alias_name];
							}
						});
					} else {
						matchingResults[alias_name] = results[alias_name];
					}
				}
			});
			this.cached_results = matchingResults;
			this.past_alias_query = this.alias_query;
			this.past_index_query = this.index_query;
		}
		return this.cached_results;
	};
}

function ClusterNavigation() {
	this.page = 1;
	this.page_size = 5; // TODO: move it to a single place?

	this.query = "";
	this.previous_query = null;
	this.hide_special = true;
	
	this.data = true;
	this.master = true;
	this.client = true;
	this.state = "";
	this.node_name = "";
	this.cached_result = [];
	this.cluster_timestamp = null;	
	
	this.clone=function() {
		var instance = new ClusterNavigation();
		instance.page = this.page;
		instance.query = this.query;
		instance.hide_special = this.hide_special;
		instance.data = this.data;
		instance.master = this.master;
		instance.client = this.client;
		instance.state = this.state;
		instance.node_name = this.node_name;
		return instance;
	};
	
	this.equals=function(other) {
		return (
			other !== null &&
			this.page == other.page &&
			this.query == other.query &&
			this.hide_special == other.hide_special &&
			this.data == other.data &&
			this.master == other.master &&
			this.client == other.client &&
			this.state == other.state &&
			this.node_name == other.node_name 
		);
	};
	
}

function ModalControls() {
	this.alert = null;
	this.active = false;
	this.title = '';
	this.info = '';
}