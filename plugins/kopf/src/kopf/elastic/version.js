function Version(version) {
  var checkVersion = new RegExp('(\\d)\\.(\\d)\\.(\\d)\\.*');
  var major;
  var minor;
  var patch;
  var value = version;
  var valid = false;

  if (checkVersion.test(value)) {
    valid = true;
    var parts = checkVersion.exec(version);
    major = parseInt(parts[1]);
    minor = parseInt(parts[2]);
    patch = parseInt(parts[3]);
  }

  this.isValid = function() {
    return valid;
  };

  this.getMajor = function() {
    return major;
  };

  this.getMinor = function() {
    return minor;
  };

  this.getPatch = function() {
    return patch;
  };

  this.getValue = function() {
    return value;
  };

  this.isGreater = function(other) {
    var higherMajor = major > other.getMajor();
    var higherMinor = major == other.getMajor() && minor > other.getMinor();
    var higherPatch = (
        major == other.getMajor() &&
        minor == other.getMinor() &&
        patch >= other.getPatch()
    );
    return (higherMajor || higherMinor || higherPatch);
  };

}
