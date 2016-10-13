'use strict';

var _ioHelper = require('./_ioHelper');
var sendArray = require('./_arrayToIps');

// Reader based on Bruno Jouhier's code
module.exports = function reader(runtime) {
  var inport = this.openInputPort('FILE');
  var ip = inport.receive();
  var fname = ip.contents;
  this.dropIP(ip);

  var result = this.runAsyncCallback(_ioHelper.readFile(fname, "utf8", this));

  if (result[0]) {
    console.log(`readFile: ${result}`);
    return;
  }

  var outport = this.openOutputPort('OUT');
  var array = result[1].split('\n');
  sendArray.call(this, array, outport);

};
