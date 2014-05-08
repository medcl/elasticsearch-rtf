function ClusterChanges() {

	this.nodeJoins = null;
	this.nodeLeaves = null;
	this.indicesCreated = null;
	this.indicesDeleted = null;

	this.docDelta = 0;
	this.dataDelta = 0;
	
	this.setDocDelta=function(delta) {
		this.docDelta = delta;
	};
	
	this.getDocDelta=function() {
		return this.docDelta;
	};
	
	this.absDocDelta=function() {
		return Math.abs(this.docDelta);
	};
	
	this.absDataDelta=function() {
		return readablizeBytes(Math.abs(this.dataDelta));
	};
	
	this.getDataDelta=function() {
		return this.dataDelta;
	};
	
	this.setDataDelta=function(delta) {
		this.dataDelta = delta;
	};

	this.hasChanges=function() {
		return (
			isDefined(this.nodeJoins) ||
			isDefined(this.nodeLeaves) ||
			isDefined(this.indicesCreated) ||
			isDefined(this.indicesDeleted)
		);
	};

	this.addJoiningNode=function(node) {
		this.changes = true;
		if (!isDefined(this.nodeJoins)) {
			this.nodeJoins = [];
		}
		this.nodeJoins.push(node);
	};

	this.addLeavingNode=function(node) {
		this.changes = true;
		if (!isDefined(this.nodeLeaves)) {
			this.nodeLeaves = [];
		}
		this.nodeLeaves.push(node);
	};

	this.hasJoins=function() {
		return isDefined(this.nodeJoins);
	};

	this.hasLeaves=function() {
		return isDefined(this.nodeLeaves);
	};
	
	this.hasCreatedIndices=function() {
		return isDefined(this.indicesCreated);
	};
	
	this.hasDeletedIndices=function() {
		return isDefined(this.indicesDeleted);
	};
	
	this.addCreatedIndex=function(index) {
		if (!isDefined(this.indicesCreated)) {
			this.indicesCreated = [];
		}
		this.indicesCreated.push(index);
	};
	
	this.addDeletedIndex=function(index) {
		if (!isDefined(this.indicesDeleted)) {
			this.indicesDeleted = [];
		}
		this.indicesDeleted.push(index);
	};

}