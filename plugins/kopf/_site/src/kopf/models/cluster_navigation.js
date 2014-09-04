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