function WarmersPagination(page, results) {
	this.page = page;
	this.page_size = 10;
	this.results = results;
	this.warmer_id = "";
	this.past_warmer_id = null;
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
		if (this.warmer_id != this.past_warmer_id) {
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
		while (this.total() < this.firstResult()) {
			this.previousPage();
		}
	};
	
	this.total=function() {
		return Object.keys(this.getResults()).length;
	};
	
	this.getResults=function() {
		var matchingResults = {};
		var filters_changed = this.warmer_id != this.past_warmer_id;
		if (filters_changed || !isDefined(this.cached_results)) { // if filters changed or no cached, calculate
			var warmer_id = this.warmer_id;
			var results = this.results;
			Object.keys(results).forEach(function(current_warmer_id) {
				if (isDefined(warmer_id) && warmer_id.length > 0) {
					if (current_warmer_id.indexOf(warmer_id) != -1) {
						matchingResults[current_warmer_id] = results[current_warmer_id];
					} 
				} else {
					matchingResults[current_warmer_id] = results[current_warmer_id];
				}
			});
			this.cached_results = matchingResults;
			this.past_warmer_id = this.warmer_id;
		}
		return this.cached_results;
	};
}