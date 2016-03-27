kopf.factory('SettingsService', function() {
	
	this.refresh_interval = 3000;
	
	this.setRefreshInterval=function(interval) {
		this.refresh_interval = interval;
		localStorage.kopf_refresh_interval = interval;
	};
	
	this.getRefreshInterval=function() {
		if (isDefined(localStorage.kopf_refresh_interval) && isDefined(localStorage.kopf_refresh_interval)) {
			return localStorage.kopf_refresh_interval;
		} else {
			return this.refresh_interval;
		}
	};
	
	return this;
});