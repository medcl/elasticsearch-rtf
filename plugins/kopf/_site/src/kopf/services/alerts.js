var Alert=function(message, response, level, _class, icon) {
	var current_date = new Date();
	this.message = message;
	this.response = response;
	this.level = level;
	this.class = _class;
	this.icon = icon;
	this.timestamp = getTimeString(current_date);
	this.id = "alert_box_" + current_date.getTime();
	
	this.hasResponse=function() {
		return isDefined(this.response);
	};
	
	this.getResponse=function() {
		if (isDefined(this.response)) {
			return JSON.stringify(this.response, undefined, 2);			
		}
	};
};

kopf.factory('AlertService', function() {
	this.max_alerts = 3;

	this.alerts = [];
	
	// removes ALL alerts
	this.clear=function() {
		this.alerts.length = 0;
	};
	
	// remove a particular alert message
	this.remove=function(id) {
		$("#" + id).fadeTo(1000, 0).slideUp(200, function(){
			$(this).remove(); 
		});
		this.alerts = this.alerts.filter(function(a) { return id != a.id; });
	};
	
	// creates an error alert
	this.error=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 15000;
		return this.addAlert(new Alert(message, response, "error", "alert-danger", "fa fa-warning"), timeout);
	};
	
	// creates an info alert
	this.info=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "info", "alert-info", "fa fa-info"), timeout);
	};
	
	// creates success alert
	this.success=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 5000;
		return this.addAlert(new Alert(message, response, "success", "alert-success", "fa fa-check"), timeout);
	};
	
	// creates a warn alert
	this.warn=function(message, response, timeout) {
		timeout = isDefined(timeout) ? timeout : 10000;
		return this.addAlert(new Alert(message, response, "warn", "alert-warning", "fa fa-info"), timeout);
	};
	
	this.addAlert=function(alert, timeout) {
		this.alerts.unshift(alert);
		var service = this;
		setTimeout(function() { service.remove(alert.id); }, timeout);		
		if (this.alerts.length >= this.max_alerts) {
			this.alerts.length = 3;
		}
		return alert.id;
	};
	
	return this;
});