/**
 * Created by danrumney on 9/30/16.
 */
var sendArray = require('./_arrayToIps');
module.exports = function decomposer() {
  var inport = this.openInputPort('IN');
  var outport = this.openOutputPort('OUT');

  var dataIP = inport.receive();
  var values = JSON.parse(dataIP.contents);
  this.dropIP(dataIP);
  sendArray.call(this, values, outport);

};
