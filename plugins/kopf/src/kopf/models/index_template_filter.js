function IndexTemplateFilter(name, template) {

  this.name = name;
  this.template = template;

  this.clone = function() {
    return new IndexTemplateFilter(name, template);
  };

  this.getSorting = function() {
    return function(a, b) {
      return a.name.localeCompare(b.name);
    };
  };

  this.equals = function(other) {
    return (other !== null &&
    this.name === other.name &&
    this.template === other.template);
  };

  this.isBlank = function() {
    return !notEmpty(this.name) && !notEmpty(this.template);
  };

  this.matches = function(template) {
    if (this.isBlank()) {
      return true;
    } else {
      var matches = true;
      if (notEmpty(this.name)) {
        matches = template.name.indexOf(this.name) != -1;
      }
      if (matches && notEmpty(this.template)) {
        matches = template.body.template.indexOf(this.template) != -1;
      }
      return matches;
    }
  };

}
