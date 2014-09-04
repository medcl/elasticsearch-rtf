function IndexMetadata(index, metadata) {
    this.index = index;
    this.mappings = metadata.mappings;
    this.settings = metadata.settings;

    this.getTypes=function() {
        return Object.keys(this.mappings).sort(function(a, b) { return a.localeCompare(b); });
    };

    this.getAnalyzers=function() {
        var analyzers = Object.keys(getProperty(this.settings,'index.analysis.analyzer', {}));
        if (analyzers.length === 0) {
            Object.keys(this.settings).forEach(function(setting) {
                if (setting.indexOf('index.analysis.analyzer') === 0) {
                    var analyzer = setting.substring('index.analysis.analyzer.'.length);
                    analyzer = analyzer.substring(0,analyzer.indexOf("."));
                    if ($.inArray(analyzer, analyzers) == -1) {
                        analyzers.push(analyzer);
                    }
                }
            });
        }
        return analyzers.sort(function(a, b) { return a.localeCompare(b); });
    };

    function isAnalyzable(type) {
        return ['float', 'double', 'byte', 'short', 'integer', 'long', 'nested', 'object'].indexOf(type) == -1;
    }

    this.getFields=function(type) {
        var fields = [];
        if (isDefined(this.mappings[type])) {
            fields = this.getProperties("", this.mappings[type].properties);
        }
        return fields.sort(function(a, b) { return a.localeCompare(b); });
    };

    this.getProperties=function(parent, fields) {
        var prefix = parent !== "" ? parent + "." : "";
        var validFields = [];
        for (var field in fields) {
            // multi field
            if (isDefined(fields[field].fields)) {
                var multiPrefix = fields[field].path != 'just_name' ? prefix + field : prefix;
                var multiProps = this.getProperties(multiPrefix, fields[field].fields);
                validFields = validFields.concat(multiProps);
            }
            // nested and object types
            if (fields[field].type == 'nested' || fields[field].type == 'object' || !isDefined(fields[field].type)) {
                var nestedProperties = this.getProperties(prefix + field,fields[field].properties);
                validFields = validFields.concat(nestedProperties);
            }
            // normal fields
            if (isDefined(fields[field].type) && isAnalyzable(fields[field].type)) {
                validFields.push(prefix + field);
            }
        }
        return validFields;
    };
}