function Node(node_id, node_info, node_stats) {
	this.id = node_id;
	this.name = node_info.name;
	this.metadata = {};
	this.metadata.info = node_info;
	this.metadata.stats = node_stats;
	this.transport_address = node_info.transport_address;
	this.host = node_stats.host;
	var master = node_info.attributes.master === 'false' ? false : true;
	var data = node_info.attributes.data === 'false' ? false : true;
	var client = node_info.attributes.client === 'true' ? true : false;
	this.master =  master && !client;
	this.data = data && !client;
	this.client = client || !master && !data;
	this.current_master = false;
	this.stats = node_stats;

	this.heap_used = readablizeBytes(getProperty(this.stats,'jvm.mem.heap_used_in_bytes'));
	this.heap_committed = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_committed_in_bytes'));
	this.heap_used_percent = getProperty(this.stats, 'jvm.mem.heap_used_percent');
	this.heap_max = readablizeBytes(getProperty(this.stats, 'jvm.mem.heap_max_in_bytes'));

	var total_in_bytes = getProperty(this.stats, 'fs.total.total_in_bytes');
	var free_in_bytes = getProperty(this.stats, 'fs.total.free_in_bytes');

	this.disk_total = readablizeBytes(total_in_bytes);
	this.disk_free = readablizeBytes(free_in_bytes);
	this.disk_used_percent =  Math.round(100 * ((total_in_bytes - free_in_bytes) / total_in_bytes));

	this.cpu_user = getProperty(this.stats, 'os.cpu.user');
	this.cpu_sys = getProperty(this.stats, 'os.cpu.sys');
	this.docs = getProperty(this.stats, 'indices.docs.count');
    this.size_in_bytes = getProperty(this.stats, 'indices.store.size_in_bytes');
    this.size = readablizeBytes(this.size_in_bytes);

	this.setCurrentMaster=function() {
		this.current_master = true;
	};

	this.equals=function(node) {
		return node.id === this.id;
	};

	this.compare=function(other) {
		if (other.current_master) return 1; // current master comes first
		if (this.current_master) return -1; // current master comes first
		if (other.master && !this.master) return 1; // master eligible comes first
		if (this.master && !other.master) return -1; // master eligible comes first
		if (other.data && !this.data) return 1; // data node comes first
		if (this.data && !other.data) return -1; // data node comes first
		return this.name.localeCompare(other.name); // if all the same, lex. sort
	};
}
