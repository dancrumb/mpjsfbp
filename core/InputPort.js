'use strict';

var Port = require('./Port');
var Fiber = require('fibers');

var InputPort = function (process, port) {
  this.parent.constructor.call(this, process, port);

  if (process) {
    process.addInputPort(this);
  } else {
    console.log("No process passed to input port: " + port);
  }
};

InputPort.prototype = Object.create(Port.prototype);
InputPort.prototype.constructor = InputPort;
InputPort.prototype.parent = Port.prototype;

InputPort.prototype.receive = function () {
  if (this.closed) {
    return null;
  }

  this.emit("ipRequested", {
    portName: this.name
  });
  var ip = Fiber.yield();
  console.log('Received: %j', ip ? {
    type: ip.type,
    contents: ip.contents
  } : null);
  return ip || null;
};

InputPort.prototype.close = function () {
  var conn = this.conn;
  conn.closeFromInPort();
  this.closed = true;

};


module.exports = InputPort;
