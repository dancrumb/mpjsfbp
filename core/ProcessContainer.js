/**
 * Created by danrumney on 9/26/16.
 */

var fork = require('child_process').fork;
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');
var FIFO = require('./FIFO');
var FBPProcessMessageType = require('./FBPProcessMessageType');
var FBPProcessStatus = require('./FBPProcessStatus');

var ProcessContainer = function (processDetails) {
  EventEmitter.call(this);

  console.log("Creating FBPProcess");
  this.name = processDetails.name;
  this.status = FBPProcessStatus.NOT_INITIALIZED;
  this.process = fork(__dirname + '/FBPProcess.js');
  this.activationSignalSent = false;

  this.process.on('error', function (e) {
    console.error('Process %s just died: %j', processDetails.name, e);
  });
  var osProcess = this.process;
  if (!osProcess) {
    console.error("FBPProcess not created");
  }

  this.outgoingConnections = _.reduce(processDetails.capacities, function (connections, capacity, portName) {
    connections[portName] = {
      capacity: capacity,
      queue: new FIFO()
    };
    return connections;
  }, {});

  osProcess.on('message', function (message) {
    if (message.type === FBPProcessMessageType.STATUS_UPDATE) {
      this.emit('statusChange', {
        name: message.name,
        oldStatus: message.oldStatus,
        newStatus: message.newStatus
      });
      this.status = message.newStatus;
      if (this.status === FBPProcessStatus.ACTIVE) {
        this.activationSignalSent = false;
      }
    } else if (message.type === FBPProcessMessageType.IP_AVAILABLE) {
      var details = message.details;
      var connection = this.outgoingConnections[details.port];
      connection.queue.enqueue(details.ip);
      if (connection.queue.length < connection.capacity) {
        osProcess.send({
          type: FBPProcessMessageType.IP_ACCEPTED
        });
      }
      this.emit('ipAvailable', details);
    } else if (message.type === FBPProcessMessageType.IP_REQUESTED) {
      this.emit('ipRequested', message.details);
    } else if (message.type === FBPProcessMessageType.ERROR) {
      this.emit('error', message.details);
    } else {
      console.log('Unknown message: %j', message);
    }
  }.bind(this));

  osProcess.send({
    type: FBPProcessMessageType.INITIALIZE,
    details: processDetails
  });
};

util.inherits(ProcessContainer, EventEmitter);

ProcessContainer.prototype.deliverIIP = function (portName, data) {
  this.process.send({
    type: FBPProcessMessageType.IIP_INBOUND,
    details: data
  });
};

ProcessContainer.prototype.deliverIP = function (portName, ip) {
  this.process.send({
    type: FBPProcessMessageType.IP_INBOUND,
    details: ip
  });
};

ProcessContainer.prototype.commence = function (portName, ip) {
  this.process.send({
    type: FBPProcessMessageType.COMMENCE,
    details: ip
  });
};

ProcessContainer.prototype.requestIP = function (portName) {
  var connection = this.outgoingConnections[portName];
  if (!connection) {
    throw new Error("Requested an IP from an unknown port: " + portName);
  }
  if (connection.queue.isEmpty()) {
    throw new Error("Requested an IP from an empty connection:" + portName);
  }

  var ip = connection.queue.dequeue();
  if (connection.queue.length >= connection.capacity) {
    this.process.send({
      type: FBPProcessMessageType.IP_ACCEPTED
    });
  }
  return ip;

};

ProcessContainer.prototype.signalIPAvailable = function () {
  if (
    (this.status === FBPProcessStatus.DORMANT || this.status === FBPProcessStatus.INITIALIZED) &&
    !this.activationSignalSent) {
    console.log('Activiating %s due to incoming IP', this.name);
    this.activationSignalSent = true;
    this.process.send({
      type: FBPProcessMessageType.ACTIVATION_REQUEST
    })
  }
};

ProcessContainer.prototype.portHasData = function (portName) {
  return !this.outgoingConnections[portName].queue.isEmpty();
};

module.exports = ProcessContainer;
