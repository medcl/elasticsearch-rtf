function AliasFilter(index, alias) {

    this.index = index;
    this.alias = alias;

    this.clone=function() { return new AliasFilter(this.index, this.alias); };

    this.equals=function(other) {
        return other !== null && this.index == other.index && this.alias == other.alias;
    };

    this.isBlank=function() { return !notEmpty(this.index) && !notEmpty(this.alias); };

    this.matches=function(index_alias) {
        if (this.isBlank()) {
            return true;
        } else {
            var matches = true;
            if (notEmpty(this.index)) {
                matches = index_alias.index.indexOf(this.index) != -1;
            }
            if (matches && notEmpty(this.alias)) {
                matches = false;
                var aliases = index_alias.aliases;
                for (var i = 0; !matches && i < aliases.length; i++) {
                    var alias = aliases[i];
                    matches = alias.alias.indexOf(this.alias) != -1;
                }
            }
            return matches;
        }
    };

}