function Gist(title, url) {
	this.timestamp = getTimeString(new Date());
	this.title = title;
	this.url = url;
	
	this.loadFromJSON=function(json) {
		this.title = json.title;
		this.url = json.url;
		this.timestamp = json.timestamp;
		return this;
	};

}