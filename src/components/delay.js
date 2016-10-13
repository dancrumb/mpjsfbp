'use strict';

module.exports = function delay(runtime) {
  //  var proc = fbp.getCurrentProc();
  var inport = this.openInputPort('IN');
  var intvlport = this.openInputPort('INTVL');
  var outport = this.openOutputPort('OUT');
  var intvl_ip = intvlport.receive();
  var intvl = intvl_ip.contents;
  this.dropIP(intvl_ip);

  while (true) {
    var ip = inport.receive();
    if (ip === null) {
      break;
    }

    this.runAsyncCallback(genSleepFun(this, intvl));

    outport.send(ip);
  }
};

function genSleepFun(proc, ms) {
  return function (done) {
    //console.log(proc.name + ' start sleep: ' + ms + ' msecs');

    setTimeout(function () {
      done();
    }, ms);
  };
}
