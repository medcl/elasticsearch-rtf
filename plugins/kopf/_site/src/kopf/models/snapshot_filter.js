function SnapshotFilter() {

    this.clone=function() { return new SnapshotFilter(); };

    this.equals=function(other) { return other !== null; };

    this.isBlank=function() { return true; };

    this.matches=function(snapshot) { return true; };

}