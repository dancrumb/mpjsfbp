import IP from './IP';
import PortManager from './PortManager';
import InputPort from './InputPort';
import OutputPort from './OutputPort';
import FBPProcessMessageType from './FBPProcessMessageType';
import FBPProcessStatus from './FBPProcessStatus';
import _ from 'lodash';
import ipcSignaller from './IPCSignaller';
import bunyan from './bunyan-stub';
import Promise from 'bluebird';
import 'babel-polyfill';
import ipc from 'node-ipc';
import eventToPromise from 'event-to-promise'





function replaceErrors(key, value) {
  if (value instanceof Error) {
    const error = {};

    Object.getOwnPropertyNames(value).forEach(key => {
      error[key] = value[key];
    });
    return error;
  }
  return value;
}

class Component extends PortManager {
  constructor() {
    super();

    this.name = "UNNAMED";
    this.ownedIPs = 0;
    this.running = false;
    this.log = bunyan.createLogger({
      name: "Component (" + this.name + ")"
    });

    this.ipcConnections = {};

    this.state = FBPProcessStatus.NOT_INITIALIZED;

    const component = this;

    this.componentRoutine = Promise.coroutine(function* () {
      try {
        this.log.info({
          "type": "componentStart",
          "name": this.name
        });
        component.component.call(component);
        this.signal(FBPProcessMessageType.COMPONENT_COMPLETE);
        this.running = false;
      } catch (e) {
        console.error("CAUGHT COMPONENT ERROR");
        console.error("ERROR: %s", JSON.stringify(e, replaceErrors));
        this.signal(FBPProcessMessageType.ERROR, e);
      }
    });


    const initializeComponent = message => {
      if (message.type.name !== FBPProcessMessageType.INITIALIZE.name) {
        throw new Error("Uninitialized Component received message that wasn't 'INITIALIZE'");
      }
      if (this.component) {
        throw new Error("INITIALIZE received by initialized component");
      }
      this.log.info("initializingComponent");

      const initializationDetails = message.details;
      this.log.info(initializationDetails);
      this.name = initializationDetails.name;
      this.networkId = initializationDetails.networkId;

      try {
        this.component = require(initializationDetails.component.moduleLocation);
      } catch (e) {
        this.log.error({
          "type": "error",
          "name": this.name,
          "reason": "Failure to load component module: " + initializationDetails.component.moduleLocation
        });
        this.signal(FBPProcessMessageType.ERROR, e);
      }
      if (initializationDetails.component.componentField) {
        this.component = initializationDetails.component.componentField;
      }


      process.on('message', this.handleMessage.bind(this));

      ipc.config.id = this.networkId + ':' + this.name;

      ipc.serve();

      ipc.server.on('start', () => {
        this.log.info({
          "type": "componentInitialized",
          "name": this.name
        });
        this.state = FBPProcessStatus.INITIALIZED;
        this.signal(FBPProcessMessageType.INITIALIZATION_COMPLETE);
      });

      ipc.server.start();

    };

    const initializeConnections = (message) => {
      if (message.type.name !== FBPProcessMessageType.CONNECT.name) {
        throw new Error("Unconnected Component received message that wasn't 'CONNECT'");
      }
      if (this.status !== FBPProcessMessageType.INITIALIZED) {
        throw new Error("CONNECT request recieved for a Component not in the INITIALIZED state");
      }
      const connectionDetails = message.details;
      this.initializeInPorts(connectionDetails);
      this.initializeOutPorts(connectionDetails);
      this.state = FBPProcessStatus.READY;
      this.signal(FBPProcessMessageType.CONNECTION_COMPLETE);
    };

    eventToPromise(process, 'message').then((message) => {
      initializeComponent(message);
      return eventToPromise(process, 'message');
    }).then((message) => {
      initializeConnections(message);
    });
    //process.once('message', initializeComponent)

  }

  handleMessage(message) {
    const component = this;
    if (message.type.name === FBPProcessMessageType.ACTIVATION_REQUEST.name) {
      try {
        component.activate();
      } catch (e) {
        console.error("CAUGHT ACTIVATION ERROR");
        console.error("ERROR: %s", JSON.stringify(e, replaceErrors));
        this.signal(FBPProcessMessageType.ERROR, e);
      }
    } else if (message.type.name === FBPProcessMessageType.PROCESS_COMPLETING.name) {
      this.log.info({
        "type": "componentShutdown",
        "name": component.name
      });
      component.shutdown();
    }
  }

  initializeInPorts(initializationDetails) {
    const component = this;

    _.forEach(initializationDetails.in, (portDetails, portName) => {
      const inputPort = new InputPort(component, portName, portDetails);

      console.log("PortDetails: %j", portDetails);


      inputPort.on('portClosed', () => {
        this.signal(FBPProcessMessageType.PORT_CLOSURE, {
          process: component.name,
          port: inputPort.portName
        });
      });

      inputPort.on('connectionDepthRequest', e => {
        process.once('message', message => {
          if (message.type.name === FBPProcessMessageType.CONNECTION_DEPTH.name) {
            this.returnResponse(message.details.depth);
          }
        });
        this.signal(FBPProcessMessageType.CONNECTION_DEPTH_REQUEST, {
          process: component.name,
          port: inputPort.portName
        });
      });

      inputPort.on("ipRequested", e => {
        this.log.info({
          "type": "ipRequestedFromInputPort",
          "port": inputPort.portName,
          "event": e
        });
        process.once('message', message => {
          this.log.info({
            "type": "ipRequestedResponseHandler",
            "receiver": this.name,
            "messageId": message.id,
            "messageType": message.type.name,
            "messageDetails": message.details
          });
          if (message.type.name === FBPProcessMessageType.IP_INBOUND.name) {
            this.log.info({
              "type": "inboundIP",
              "process": initializationDetails.name,
              "port": e.portName,
              "message": message
            });
            const details = message.details;
            const ip = new IP();
            ip.type = details.ip.type;
            ip.contents = details.ip.contents;

            this.returnResponse(ip);
          } else if (message.type.name === FBPProcessMessageType.EOS_INBOUND.name) {
            this.log.info({
              "type": "inboundEOS",
              "process": initializationDetails.name,
              "port": e.portName
            });
            this.returnResponse(null);
          }
        });

        this.signal(FBPProcessMessageType.IP_REQUESTED, {
          process: component.name,
          port: e.portName
        });
      });

      component.addInputPort(inputPort);
    });


  }

  requestIP(port) {

    console.log("Send request to %s", this.networkId + ":" + port.otherEnd.process);
    console.log(ipc.of);
    ipc.of[this.networkId + ":" + port.otherEnd.process].emit('ipRequested', port.otherEnd.port)
  }

  initializeOutPorts(initializationDetails) {
    const component = this;
    _.forEach(initializationDetails.out, (portDetails, portName) => {
      const outputPort = new OutputPort(component, portName);

      outputPort.on('portClosed', () => {
        this.signal(FBPProcessMessageType.PORT_CLOSURE, {
          process: component.name,
          port: outputPort.portName
        });
      });

      outputPort.on('connectionDepthRequest', e => {
        process.once('message', message => {
          if (message.type.name === FBPProcessMessageType.CONNECTION_DEPTH.name) {
            this.returnResponse(message.details.depth);
          }
        });
        this.signal(FBPProcessMessageType.CONNECTION_DEPTH_REQUEST, {
          process: component.name,
          port: outputPort.portName
        });
      });

      outputPort.on("ipSubmitted", e => {
        process.once('message', message => {
          if (message.type.name === FBPProcessMessageType.IP_ACCEPTED.name) {
            this.returnResponse();
          }
        });

        this.signal(FBPProcessMessageType.IP_AVAILABLE, {
          process: component.name,
          port: e.portName,
          ip: e.ip
        });
      });

      component.addOutputPort(outputPort);
    });
  }

  toString() {
    return `Component: { 
        name: ${this.name}\n  
        inports: ${this.inports}\n
        outports: ${this.outports}\n
      }`;
  }

  createIP(data) {
    const ip = new IP(data);
    this.ownedIPs++;
    return ip;
  }

  createIPBracket(bktType, x) {
    if (x == undefined) {
      x = null;
    }
    const ip = this.createIP(x);
    ip.type = bktType;

    return ip;
  }

  dropIP(ip) {
    let cont = ip.contents;
    if (ip.type != this.IPTypes.NORMAL) {
      cont = `${ip.type.name}, ${cont}`;
    }
  }

  runAsyncCallback(callback) {
    this.signal(FBPProcessMessageType.ASYNC_CALLBACK);
    return new Promise((resolve, reject) => {
      callback((results) => {
        this.signal(FBPProcessMessageType.CALLBACK_COMPLETE);
        resolve(results);
      });
    });
  }

  activate() {
    this.log.info({
      "type": "componentActivateRequest",
      "name": this.name
    });
    if (this.running) {
      throw new Error(`Attempted to activate an active FBP Process: ${this.name}`);
    }
    this.running = true;
    this.returnResponse();
  }

  shutdown() {
    if (!this.running) {
      throw new Error(`Attempted to shutdown a non-active FBP Process: ${this.name}`);
    }
    _.forEach(this.inports, inport => {
      inport.close();
    });
    _.forEach(this.outports, outport => {
      outport.close();
    });
  }

  returnResponse(response) {
    this.log.info({
      "type": "returnResponse",
      "response": response
    });
    this.componentRoutine(response);
  }

  signal(type, details) {
    ipcSignaller.call(this, type, details);
  }
}

Component.prototype.IPTypes = IP.Types;

new Component();
