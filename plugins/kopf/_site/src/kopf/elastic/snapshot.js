function Snapshot(info) {
	this.name = info.snapshot;
	this.indices = info.indices;
	this.state = info.state;
	this.start_time = info.start_time;
	this.start_time_in_millis = info.start_time_in_millis;
	this.end_time = info.end_time;
	this.end_time_in_millis = info.end_time_in_millis;
	this.duration_in_millis = info.duration_in_millis;
	this.failures = info.failures;
	this.shards = info.shards;
}