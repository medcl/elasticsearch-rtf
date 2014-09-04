function WarmerFilter(id) {

    this.id = id;

    this.clone=function() { return new WarmerFilter(this.id); };

    this.equals=function(other) {
        return other !== null && this.id == other.id;
    };

    this.isBlank=function() { return !notEmpty(this.id); };

    this.matches=function(warmer) {
        if (this.isBlank()) {
            return true;
        } else {
            return warmer.id.indexOf(this.id) != -1;
        }
    };

}