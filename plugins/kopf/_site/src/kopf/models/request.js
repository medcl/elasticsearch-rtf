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