'use strict';

var Enum = require('./Enum');

var IP = module.exports = function IP(contents) {
  this.owner = null;
  this.type = IP.Types.NORMAL;
  this.contents = contents;
};

IP.Types = new Enum([
  "NORMAL",
  "OPEN",
  "CLOSE"
]);

["NORMAL", "OPEN", "CLOSE"].forEach(function (type) {
  Object.defineProperty(IP, type, {
    get: function () {
      console.error("Accessing IP types from IP object directly is deprecated. Please use IP.Types." + type);
      return IP.Types[type]
    }
  });
});

IP.prototype.toString = function () {
  return "IP: { \n" +
    " type:" + IP.Types.__lookup(this.type) + ", \n" +
    " owner: " + this.owner + ",\n" +
    " contents: " + ((this.contents === null) ? "<null>" : "<data>") + "\n" +
    "}"
}
