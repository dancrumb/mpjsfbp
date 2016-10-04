'use strict';


var Fiber = require('fibers'),
  FBPProcessStatus = require('./FBPProcessStatus'),
  IP = require('./IP'),
  PortManager = require('./PortManager'),
  InputPort = require('./InputPort'),
  OutputPort = require('./OutputPort'),
  FBPProcessMessageType = require('./FBPProcessMessageType');

var osProcess = process;


var FBPProcess = module.exports = function () {
  this._status = FBPProcessStatus.NOT_INITIALIZED;
  this.ownedIPs = 0;
  var fbpProcess = this;

  this.componentFiber = Fiber(function () {
    fbpProcess.component.call(fbpProcess);
    fbpProcess.setStatus(FBPProcessStatus.DORMANT);
  }.bind(this));
  console.log("FBPProcess created\n");


  osProcess.once('message', function (message) {
    if (message.type !== FBPProcessMessageType.INITIALIZE) {
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


    details.in.forEach(function (portName) {
      var inputPort = new InputPort(fbpProcess, portName);
      inputPort.on("ipRequested", function (e) {

        osProcess.once('message', function (message) {
          var ip = null;
          console.log('inbound: %j', message);
          if (message.type === FBPProcessMessageType.IP_INBOUND) {
            var details = message.details;
            ip = new IP();
            ip.type = details.type;
            ip.contents = details.contents;
          } else if (message.type === FBPProcessMessageType.IIP_INBOUND) {
            var data = message.details;
            ip = new IP(data);
          }

          if (ip) {
            ip.owner = fbpProcess;
            fbpProcess.setStatus(FBPProcessStatus.ACTIVE);
            fbpProcess.componentFiber.run(ip);
          }
        });

        osProcess.send({
          type: FBPProcessMessageType.IP_REQUESTED,
          details: {
            process: fbpProcess.name,
            port: e.portName
          }
        });
        fbpProcess.setStatus(FBPProcessStatus.WAITING_TO_RECEIVE);
      });

      fbpProcess.addInputPort(inputPort);
    });

    details.out.forEach(function (portName) {
      var outputPort = new OutputPort(fbpProcess, portName);
      outputPort.on("ipSubmitted", function (e) {
        osProcess.send({
          type: FBPProcessMessageType.IP_AVAILABLE,
          details: {
            process: fbpProcess.name,
            port: e.portName,
            ip: e.ip
          }
        });

        osProcess.once('message', function (message) {
          if (message.type === FBPProcessMessageType.IP_ACCEPTED) {
            fbpProcess.activate();
          }
        });

        fbpProcess.setStatus(FBPProcessStatus.WAITING_TO_SEND);
      });

      fbpProcess.addOutputPort(outputPort);
    });

    osProcess.on('message', function (message) {
      if (message.type === FBPProcessMessageType.ACTIVATION_REQUEST) {
        fbpProcess.activate();
      }
    });

    osProcess.on('message', function (message) {
      if (message.type === FBPProcessMessageType.COMMENCE) {
        if (fbpProcess.selfStarting) {
          fbpProcess.activate();
        }
      }
    });

    console.log("FBPProcess initialized: " + this);
    this.setStatus(FBPProcessStatus.INITIALIZED);

  }.bind(this))

};

FBPProcess.prototype.setStatus = function (newStatus) {
  var oldStatus = this._status;
  this._status = newStatus;

  osProcess.send({
    type: FBPProcessMessageType.STATUS_UPDATE,
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
