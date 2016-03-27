function Shard(shard_routing, shard_info) {
	this.info = isDefined(shard_info) ? shard_info : shard_routing;
	this.primary = shard_routing.primary;
	this.shard = shard_routing.shard;
	this.state = shard_routing.state;
	this.node = shard_routing.node;
	this.index = shard_routing.index;
	this.id = this.node + "_" + this.shard + "_" + this.index;
}

function UnassignedShard(shard_info) {
	this.primary = shard_info.primary;
	this.shard = shard_info.shard;
	this.state = shard_info.state;
	this.node = shard_info.node;
	this.index = shard_info.index;
	this.id = this.node + "_" + this.shard + "_" + this.index;
}