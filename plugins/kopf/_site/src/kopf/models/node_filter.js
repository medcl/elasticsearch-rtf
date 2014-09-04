function NodeFilter(name, data, master, client, timestamp) {
    this.name = name;
    this.data = data;
    this.master = master;
    this.client = client;
    this.timestamp = timestamp;

    this.clone=function() {
        return new NodeFilter(this.name, this.data, this.master, this.client);
    };

    this.equals=function(other) {
        return (
            other !== null &&
            this.name == other.name &&
            this.data == other.data &&
            this.master == other.master &&
            this.client == other.client &&
            this.timestamp == other.timestamp
            );
    };

    this.isBlank=function() {
        return !notEmpty(this.name) && (this.data && this.master && this.client);
    };

    this.matches=function(node) {
        if (this.isBlank()) {
            return true;
        } else {
            var matches = notEmpty(this.name) ? node.name.toLowerCase().indexOf(this.name.toLowerCase()) != -1 : true;
            return matches && (node.data && this.data || node.master && this.master || node.client && this.client);
        }
    };

}