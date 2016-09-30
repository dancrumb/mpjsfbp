var _ = require('lodash');

var PortManager = function (processName, ports) {
  this.inports = {};
  this.outports = {};
  if (ports) {
    _.forEach(ports.inports, this.addInputPort.bind(this));
    _.forEach(ports.outports, this.addOutputPort.bind(this));
  }

  this.name = processName || 'UNKNOWN';
};

PortManager.prototype.addInputPort = function (port) {
  this.inports[port.portName] = port;
};
PortManager.prototype.addOutputPort = function (port) {
  this.outports[port.portName] = port;
};

/*
 * Given a set of ports an a base name XXX, returns all the ports in the set that
 * have the name XXX[<index>]
 */
function getPortArray(ports, processName, portName) {
  var re = new RegExp(portName + '\\[\\d+\\]');
  var portFilter = re.test.bind(re);

  var portArray = Object.keys(ports)
    .filter(portFilter)
    .sort()
    .map(_.partial(portOpener, ports, ''));

  if (portArray.length === 0) {
    console.log('Port ' + processName + '.' + portName + ' not found');
    return null;
  }

  return portArray;
}

function portOpener(ports, direction, name, opt) {
  var port = ports[name];
  if (port) {
    return port;
  } else {
    if (direction === 'OUT' && opt != 'OPTIONAL') {
      console.log('Port ' + this.name + '.' + name + ' not found');
    }
    return null;
  }
}

PortManager.prototype.openInputPort = function (name) {
  return portOpener(this.inports, 'IN', name);
};

PortManager.prototype.openInputPortArray = function (name) {
  return getPortArray(this.inports, this.name, name);
};

PortManager.prototype.openOutputPort = function (name, opt) {
  return portOpener(this.outports, 'OUT', name, opt);
};

PortManager.prototype.openOutputPortArray = function (name) {
  return getPortArray(this.outports, this.name, name);
};

module.exports = PortManager;
