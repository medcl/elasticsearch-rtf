var kopf = angular.module('kopf', []);

kopf.factory('IndexSettingsService', function() {

    this.loadSettings=function(index, settings) {
        this.index = index;
        this.settings = settings;
        this.editable_settings = new EditableIndexSettings(settings);
    };

    return this;
});

// manages behavior of confirmation dialog
kopf.factory('ConfirmDialogService', function() {
	this.header = "Default Header";
	this.body = "Default Body";
	this.cancel_text = "cancel";
	this.confirm_text = "confirm";
	
	this.confirm=function() {
		// when created, does nothing
	};
	
	this.close=function() {
		// when created, does nothing		
	};
	
	this.open=function(header, body, action, confirm_callback, close_callback) {
		this.header = header;
		this.body = body;
		this.action = action;
		this.confirm = confirm_callback;
		this.close = close_callback;
	};
	
	return this;
});
