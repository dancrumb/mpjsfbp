/**
 * Created by danrumney on 9/28/16.
 */

var NetworkRouter = function (connections) {
  this.connections = connections;
  console.log("NetworkRouter", connections);
};

function findOtherEnd(process, port, direction) {

  var target = this.connections[process][direction][port];

  return {
    process: target.process,
    port: target.port
  }
}

NetworkRouter.prototype.getSendTarget = function (source) {
  return findOtherEnd(source.process, source.port, 'out');

};

NetworkRouter.prototype.getReceiveTargets = function (source) {
  return findOtherEnd(source.process, source.port, 'in');
};


module.exports = NetworkRouter;
