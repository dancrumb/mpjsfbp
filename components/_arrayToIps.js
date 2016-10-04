// Take an `array` of values and send each value as an IP into `outport`
module.exports = function (array, outport) {
  array.forEach(function (value) {
    var ip = this.createIP(value);
    outport.send(ip);
  }.bind(this));
};
