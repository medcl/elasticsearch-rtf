kopf.factory('ThemeService', function() {
	
	this.theme = "dark";
	
	this.setTheme=function(theme) {
		this.theme = theme;
		localStorage.kopf_theme = theme;
	};
	
	this.getTheme=function() {
		if (isDefined(localStorage.kopf_theme)) {
			return localStorage.kopf_theme;
		} else {
			return this.theme;
		}
	};
	
	return this;
});