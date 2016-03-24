function Shard(routing) {
  this.primary = routing.primary;
  this.shard = routing.shard;
  this.state = routing.state;
  this.node = routing.node;
  this.index = routing.index;
  this.id = this.node + '_' + this.shard + '_' + this.index;
}
