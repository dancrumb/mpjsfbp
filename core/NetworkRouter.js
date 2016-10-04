/**
 * Created by danrumney on 9/28/16.
 */

var NetworkRouter = function (connections) {
  this.connections = connections;
  console.log("NetworkRouter", connections);
};

function findOtherEnd(process, port, direction) {
  var portDetails = port.split('.');
  if (portDetails.length === 1) {
    port = portDetails[0]
  } else {
    if (portDetails[0] !== process) {
      throw new Error("Process and Port mismatch!");
    }
    port = portDetails[1]
  }

  console.log("Finding '%s' target for %s.%s", direction, process, port);

  var target = this.connections[process][direction][port];
  return target || [];
}

NetworkRouter.prototype.getSendTarget = function (source) {
  return findOtherEnd.call(this, source.process, source.port, 'out');

};

NetworkRouter.prototype.getReceiveTargets = function (source) {
  return findOtherEnd.call(this, source.process, source.port, 'in');
};


module.exports = NetworkRouter;
