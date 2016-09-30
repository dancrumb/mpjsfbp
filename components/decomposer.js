/**
 * Created by danrumney on 9/30/16.
 */
module.exports = function decomposer() {
  var inport = this.openInputPort('IN');
  var outport = this.openOutputPort('OUT');

  var dataIP = inport.receive();
  var values = JSON.parse(dataIP.contents);
  this.dropIP(dataIP);
  values.forEach(function (value) {
    var ip = this.createIP(value);
    outport.send(ip);
  }.bind(this))

};
