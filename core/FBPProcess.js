'use strict';


var Fiber = require('fibers'),
  FBPProcessStatus = require('./FBPProcessStatus'),
  IP = require('./IP'),
  PortManager = require('./PortManager'),
  InputPort = require('./InputPort'),
  OutputPort = require('./OutputPort');

var FBPProcess = module.exports = function () {
  this._status = FBPProcessStatus.NOT_INITIALIZED;
  this.ownedIPs = 0;
  this.componentFiber = Fiber(function () {
    this.component.call(this);
  }.bind(this));
  console.log("FBPProcess created\n");

  process.once('message', function (message) {
    if (message.type !== "INITIALIZE") {
      throw new Error("Uninitialized FBPProcess received message that wasn't 'INITIALIZE'");
    }
    var details = message.details;

    this.component = require(details.component.moduleLocation);
    if (details.component.componentField) {
      this.component = details.component.componentField;
    }


    this.portManager = new PortManager(this.name);
    this.selfStarting = details.selfStarting;
    this.name = details.name;

    var fbpProcess = this;

    details.in.forEach(function (portName) {
      var inputPort = new InputPort(fbpProcess, portName);
      inputPort.on("ipRequested", function (e) {
        process.send({
          type: "IP_REQUESTED",
          details: {
            process: fbpProcess.name,
            port: e.portName
          }
        });
        fbpProcess.setStatus(FBPProcessStatus.WAITING_TO_RECEIVE);

        process.once('message', function (message) {
          var ip = null;
          if (message.type === 'IP_INBOUND') {
            var details = message.details;
            ip = details.ip;
          } else if (message.type === 'IIP_INBOUND') {
            var data = message.details;
            ip = new IP(data);
          }

          if (ip) {
            ip.owner = fbpProcess;
            fbpProcess.setStatus(FBPProcessStatus.ACTIVE);
            fbpProcess.componentFiber.run(ip);
          }
        });
      });

      fbpProcess.addInputPort(inputPort);
    });

    details.out.forEach(function (portName) {
      var outputPort = new OutputPort(fbpProcess, portName);
      outputPort.on("ipSubmitted", function (e) {
        process.send({
          type: "IP_AVAILABLE",
          details: {
            process: fbpProcess.name,
            port: e.portName,
            ip: e.ip
          }
        });

        process.once('message', function (message) {
          if (message.type === 'IP_ACCEPTED') {
            fbpProcess.setStatus(FBPProcessStatus.ACTIVE);
            fbpProcess.componentFiber.run();
          }
        });

        fbpProcess.setStatus(FBPProcessStatus.WAITING_TO_SEND);
      });

      fbpProcess.addOutputPort(outputPort);
    });

    console.log("FBPProcess initialized: " + this);
    this.setStatus(FBPProcessStatus.INITIALIZED);
    if (this.selfStarting) {
      this.activate();
    }
  }.bind(this))

};

FBPProcess.prototype.setStatus = function (newStatus) {
  var oldStatus = this._status;
  this._status = newStatus;

  process.send({
    type: "STATUS_UPDATE",
    name: this.name,
    oldStatus: oldStatus,
    newStatus: newStatus
  }, function (error) {
    if (error) {
      console.error(error);
    }
  });
};

FBPProcess.prototype.IPTypes = IP.Types;

FBPProcess.prototype.toString = function () {
  return "FBPProcess: { \n" +
    "  name: " + this.name + "\n" +
    "  ports: " + this.portManager + "\n" +
    "  status: " + this.getStatusString() + "\n" +
    "  selfStarting: " + this.isSelfStarting() + "\n" +
    "}";
};

FBPProcess.prototype.getStatusString = function () {
  return FBPProcessStatus.__lookup(this._status);
};

FBPProcess.prototype.isSelfStarting = function () {
  return this.selfStarting;
};

FBPProcess.prototype.createIP = function (data) {
  var ip = new IP(data);
  this.ownedIPs++;
  ip.owner = this;
  return ip;
};

FBPProcess.prototype.createIPBracket = function (bktType, x) {
  if (x == undefined) {
    x = null;
  }
  var ip = this.createIP(x);
  ip.type = bktType;

  return ip;
};

FBPProcess.prototype.disownIP = function (ip) {
  if (ip.owner != this) {
    throw new Error(this.name + ' IP being disowned is not owned by this FBPProcess: ' + ip.toString());
  }
  this.ownedIPs--;
  ip.owner = null;
};

FBPProcess.prototype.dropIP = function (ip) {
  var cont = ip.contents;
  if (ip.type != this.IPTypes.NORMAL) {
    cont = this.IPTypes.__lookup(ip.type) + ", " + cont;
  }

  this.disownIP(ip);
};

FBPProcess.prototype.activate = function () {
  if (this._status === FBPProcessStatus.ACTIVE) {
    throw new Error('Attempted to activate an active FBP Process: ' + this.name);
  }
  this.setStatus(FBPProcessStatus.ACTIVE);
  this.componentFiber.run();
};

/*
 * Port Methods
 */
FBPProcess.prototype.addInputPort = function (port) {
  this.portManager.addInputPort(port);
};
FBPProcess.prototype.addOutputPort = function (port) {
  this.portManager.addOutputPort(port);
};

FBPProcess.prototype.openInputPort = function (name) {
  return this.portManager.openInputPort(name);
};

FBPProcess.prototype.openInputPortArray = function (name) {
  return this.portManager.openInputPortArray(name);
};

FBPProcess.prototype.openOutputPort = function (name, opt) {
  return this.portManager.openOutputPort(name, opt);
};

FBPProcess.prototype.openOutputPortArray = function (name) {
  return this.portManager.openOutputPortArray(name);
};

new FBPProcess();
