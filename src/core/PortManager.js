var _ = require('lodash');

var PortManager = function (ports) {
  this.inports = {};
  this.outports = {};
  if (ports) {
    _.forEach(ports.inports, this.addInputPort.bind(this));
    _.forEach(ports.outports, this.addOutputPort.bind(this));
  }
};

PortManager.prototype.addInputPort = function (port) {
  this.inports[port.portName] = port;
};
PortManager.prototype.addOutputPort = function (port) {
  this.outports[port.portName] = port;
};

/*
 * Given a set of ports an a base name ABC, returns all the ports in the set that
 * have the name ABC[<index>]
 */
function getPortArray(ports, portName) {
  var re = new RegExp(portName + '\\[\\d+\\]');
  var portFilter = re.test.bind(re);

  var portArray = Object.keys(ports)
    .filter(portFilter)
    .sort()
    .map(_.partial(portOpener, ports, ''));

  if (portArray.length === 0) {
    console.log('Port ' + portName + ' not found');
    return null;
  }

  return portArray;
}

function portOpener(ports, direction, name, opt) {
  var port = ports[name];
  if (port) {
    port.open();
    return port;
  } else {
    if (direction === 'OUT' && opt != 'OPTIONAL') {
      console.log('Port ' + name + ' not found');
    }
    return null;
  }
}

PortManager.prototype.openInputPort = function (name) {
  return portOpener(this.inports, 'IN', name);
};

PortManager.prototype.openInputPortArray = function (name) {
  return getPortArray(this.inports, name);
};

PortManager.prototype.openOutputPort = function (name, opt) {
  return portOpener(this.outports, 'OUT', name, opt);
};

PortManager.prototype.openOutputPortArray = function (name) {
  return getPortArray(this.outports, name);
};

PortManager.prototype.toString = function () {
  return "in: " + Object.keys(this.inports) + "; " +
    "out: " + Object.keys(this.outports);
};

module.exports = PortManager;
