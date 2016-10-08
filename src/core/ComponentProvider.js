import Fiber from 'fibers';
import FBPProcessStatus from './FBPProcessStatus';
import IP from './IP';
import PortManager from './PortManager';
import InputPort from './InputPort';
import OutputPort from './OutputPort';
import FBPProcessMessageType from './FBPProcessMessageType';
import _ from 'lodash';

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

class ComponentProvider {
  constructor() {
    this.ownedIPs = 0;
    this.running = false;
    const componentProvider = this;

    this.componentFiber = Fiber(() => {
      try {
        componentProvider.component.call(componentProvider);
        this.running = false;
        componentProvider.setStatus(FBPProcessStatus.DORMANT);
      } catch (e) {
        console.error("CAUGHT COMPONENT ERROR");
        console.error("ERROR: %s", JSON.stringify(e, replaceErrors));
        process.send({
          type: FBPProcessMessageType.ERROR,
          details: e
        });
      }
    });
    console.log("ComponentProvider created");


    process.once('message', message => {
      if (message.type !== FBPProcessMessageType.INITIALIZE) {
        throw new Error("Uninitialized ComponentProvider received message that wasn't 'INITIALIZE'");
      }
      const initializationDetails = message.details;

      this.component = require(initializationDetails.component.moduleLocation);
      if (initializationDetails.component.componentField) {
        this.component = initializationDetails.component.componentField;
      }


      this.name = initializationDetails.name;
      this.portManager = new PortManager(this.name);
      this.selfStarting = initializationDetails.selfStarting;


      this.initializeInPorts(initializationDetails);
      this.initializeOutPorts(initializationDetails);

      process.on('message', this.handleProcessStateChanges.bind(this));

      console.log(`ComponentProvider initialized: ${this}`);
      this.setStatus(FBPProcessStatus.INITIALIZED);

    })

  }

  handleProcessStateChanges(message) {
    const componentProvider = this;
    if (message.type === FBPProcessMessageType.ACTIVATION_REQUEST) {
      try {
        componentProvider.activate();
      } catch (e) {
        console.error("CAUGHT ACTIVATION ERROR");
        console.error("ERROR: %s", JSON.stringify(e, replaceErrors));
        process.send({
          type: FBPProcessMessageType.ERROR,
          details: e
        });
      }
    } else if (message.type === FBPProcessMessageType.COMMENCE) {
      if (componentProvider.selfStarting) {
        try {
          componentProvider.activate();
        } catch (e) {
          console.error("CAUGHT COMPONENT ERROR");
          console.error("ERROR: %s", JSON.stringify(e, replaceErrors));
          process.send({
            type: FBPProcessMessageType.ERROR,
            details: e
          });
        }
      }
    } else if (message.type === FBPProcessMessageType.PROCESS_COMPLETING) {
      console.log(`Shutting down ${componentProvider.name}`);
      componentProvider.shutdown();
    }
  }

  initializeInPorts(initializationDetails) {
    const componentProvider = this;

    initializationDetails.in.forEach(portName => {
      const inputPort = new InputPort(componentProvider, portName);
      inputPort.on("ipRequested", e => {

        process.on('message', message => {
          let ip = null;
          console.log('inbound to %s.%s: %j', initializationDetails.name, portName, message);
          if (message.type === FBPProcessMessageType.IP_INBOUND) {
            const details = message.details;
            ip = new IP();
            ip.type = details.type;
            ip.contents = details.contents;
          }

          if (ip) {
            ip.owner = componentProvider;
            componentProvider.setStatus(FBPProcessStatus.ACTIVE);
            componentProvider.componentFiber.run(ip);
          }
        });
        process.send({
          type: FBPProcessMessageType.IP_REQUESTED,
          details: {
            process: componentProvider.name,
            port: e.portName
          }
        });
        componentProvider.setStatus(FBPProcessStatus.WAITING_TO_RECEIVE);
      });

      inputPort.on('portClosed', () => {
        process.send({
          type: FBPProcessMessageType.PORT_CLOSURE,
          details: {
            process: componentProvider.name,
            port: inputPort.portName
          }
        });
      });

      componentProvider.addInputPort(inputPort);
    });


  }

  initializeOutPorts(initializationDetails) {
    const componentProvider = this;
    initializationDetails.out.forEach(portName => {
      const outputPort = new OutputPort(componentProvider, portName);
      outputPort.on("ipSubmitted", e => {
        process.send({
          type: FBPProcessMessageType.IP_AVAILABLE,
          details: {
            process: componentProvider.name,
            port: e.portName,
            ip: e.ip
          }
        });

        process.once('message', message => {
          if (message.type === FBPProcessMessageType.IP_ACCEPTED) {
            componentProvider.activate();
          }
        });

        componentProvider.setStatus(FBPProcessStatus.WAITING_TO_SEND);
      });

      outputPort.on('portClosed', () => {
        process.send({
          type: FBPProcessMessageType.PORT_CLOSURE,
          details: {
            process: componentProvider.name,
            port: outputPort.portName
          }
        });
      });

      componentProvider.addOutputPort(outputPort);
    });
  }

  setStatus(newStatus) {
    process.send({
      type: FBPProcessMessageType.STATUS_UPDATE,
      name: this.name,
      newStatus
    }, error => {
      if (error) {
        console.error(error);
      }
    });
  }

  toString() {
    return `ComponentProvider: { \n  name: ${this.name}\n  ports: ${this.portManager}\n  status: ${this.getStatusString()}\n  selfStarting: ${this.isSelfStarting()}\n}`;
  }

  getStatusString() {
    return FBPProcessStatus.__lookup(this._status);
  }

  isSelfStarting() {
    return this.selfStarting;
  }

  createIP(data) {
    const ip = new IP(data);
    this.ownedIPs++;
    ip.owner = this;
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

  disownIP(ip) {
    if (ip.owner != this) {
      throw new Error(`${this.name} IP being disowned is not owned by this ComponentProvider: ${ip.toString()}`);
    }
    this.ownedIPs--;
    ip.owner = null;
  }

  dropIP(ip) {
    let cont = ip.contents;
    if (ip.type != this.IPTypes.NORMAL) {
      cont = `${this.IPTypes.__lookup(ip.type)}, ${cont}`;
    }

    this.disownIP(ip);
  }

  activate() {
    if (this.running) {
      throw new Error(`Attempted to activate an active FBP Process: ${this.name}`);
    }
    this.running = true;
    this.setStatus(FBPProcessStatus.ACTIVE);
    this.componentFiber.run();
  }

  shutdown() {
    if (!this.running) {
      throw new Error(`Attempted to shutdown a non-active FBP Process: ${this.name}`);
    }
    _.forEach(this.portManager.inports, inport => {
      inport.close();
    });
    _.forEach(this.portManager.outports, outport => {
      outport.close();
    });
    this.setStatus(FBPProcessStatus.DONE);
  }

  /*
   * Port Methods
   */
  addInputPort(port) {
    this.portManager.addInputPort(port);
  }

  addOutputPort(port) {
    this.portManager.addOutputPort(port);
  }

  openInputPort(name) {
    return this.portManager.openInputPort(name);
  }

  openInputPortArray(name) {
    return this.portManager.openInputPortArray(name);
  }

  openOutputPort(name, opt) {
    return this.portManager.openOutputPort(name, opt);
  }

  openOutputPortArray(name) {
    return this.portManager.openOutputPortArray(name);
  }
}

ComponentProvider.prototype.IPTypes = IP.Types;

new ComponentProvider();
