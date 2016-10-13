import Fiber from 'fibers';
import IP from './IP';
import PortManager from './PortManager';
import InputPort from './InputPort';
import OutputPort from './OutputPort';
import FBPProcessMessageType from './FBPProcessMessageType';
import _ from 'lodash';
import ipcSignaller from './IPCSignaller';
import bunyan from 'bunyan';



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

    const component = this;

    this.componentFiber = Fiber(() => {
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

    process.once('message', message => {
      if (message.type.name !== FBPProcessMessageType.INITIALIZE.name) {
        throw new Error("Uninitialized Component received message that wasn't 'INITIALIZE'");
      }
      if (this.component) {
        throw new Error("INITIALIZE received by initialized component");
      }
      const initializationDetails = message.details;
      this.name = initializationDetails.name;

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



      this.initializeInPorts(initializationDetails);
      this.initializeOutPorts(initializationDetails);

      process.on('message', this.handleMessage.bind(this));

      this.log.info({
        "type": "componentInitialized",
        "name": this.name
      });
      this.signal(FBPProcessMessageType.INITIALIZATION_COMPLETE);
    })

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

    initializationDetails.in.forEach(portName => {
      const inputPort = new InputPort(component, portName);

      inputPort.on('portClosed', () => {
        this.signal(FBPProcessMessageType.PORT_CLOSURE, {
          process: component.name,
          port: inputPort.portName
        });
      });

      inputPort.on("ipRequested", e => {
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

            component.componentFiber.run(ip);
          } else if (message.type.name === FBPProcessMessageType.EOS_INBOUND.name) {
            this.log.info({
              "type": "inboundEOS",
              "process": initializationDetails.name,
              "port": e.portName
            });
            component.componentFiber.run(null);
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

  initializeOutPorts(initializationDetails) {
    const component = this;
    initializationDetails.out.forEach(portName => {
      const outputPort = new OutputPort(component, portName);

      outputPort.on('portClosed', () => {
        this.signal(FBPProcessMessageType.PORT_CLOSURE, {
          process: component.name,
          port: outputPort.portName
        });
      });

      outputPort.on("ipSubmitted", e => {
        process.once('message', message => {
          if (message.type.name === FBPProcessMessageType.IP_ACCEPTED.name) {
            component.componentFiber.run();
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
    callback((results) => {
      this.signal(FBPProcessMessageType.CALLBACK_COMPLETE);
      this.componentFiber.run(results);
    });
    return this.awaitResponse();
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
    this.componentFiber.run();
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

  awaitResponse() {
    this.log.info({
      "type": "awaitingResponse",
      "name": this.name
    });
    var response = Fiber.yield();
    this.log.info({
      "type": "responseReceived",
      "name": this.name
    });
    return response;
  }

  signal(type, details) {
    ipcSignaller.call(this, type, details);
  }
}

Component.prototype.IPTypes = IP.Types;

new Component();
