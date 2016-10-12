import path from 'path';
import parseFBP from 'parsefbp';
import FBPProcessStatus from './FBPProcessStatus';
import _ from 'lodash';
import FBPProcess from './FBPProcess';
import ProcessConnection from './ProcessConnection';
import IIPConnection from './IIPConnection';

/*
 _connections Definition for component P with inports I,J and outport O
 Remote processes are R and S
 IIP into P.J

 R.O -> P.I
 P.O -> S.I
 'foo' -> P.J

 {
 R: {
 out: { O: { component: 'P', port: 'I', capacity: 20 } },
 in :{}
 },
 P: {
 out: { O: { component: 'S', port: 'I' } },
 in: { I: [ { component: 'R', port: 'O' } ], J: [ { data: 'foo' } ] }
 },
 S: {
 out: {},
 in: { I: [ { component: 'P', port: 'O' } ] }
 }
 }
 */

/**
 *
 */
class Network {
  /**
   *
   * @param options
   */
  constructor(options) {
    this._processes = {};

    this._connections = {};
    if (options) {
      this.componentRoot = options.componentRoot;
    }
  }

  /**
   *
   * @param graphString
   * @param localRoot
   * @returns {Network}
   */
  static createFromGraph(graphString, localRoot) {
    const graphDefinition = parseFBP(graphString, {
      caseSensitive: true
    });

    const network = new Network({
      componentRoot: localRoot
    });

    _.forEach(graphDefinition.processes, (processDefinition, processName) => {
      network.defineProcess(processDefinition.component, processName);
    });

    graphDefinition.connections.forEach(connection => {
      const target = connection.tgt;
      if ('data' in connection) {
        network.initialize(target.process, getPort(target), connection.data);
      } else {
        const source = connection.src;
        network.connect(source.process, getPort(source), target.process, getPort(target), connection.capacity);
      }
    });

    return network;
  }

  /**
   * Given a `process`, this returns an object that describes the connections to and from the process
   * @param {string} processName
   * @returns {*}
   */
  getProcessConnections(processName) {
    if (typeof processName !== "string") {
      throw new Error("Non-string passed to getProcessConnections. Did you pass a process instead of its name?");
    }
    if (!this._connections[processName]) {
      this._connections[processName] = {
        out: {},
        in: {}
      }
    }

    return this._connections[processName];
  }

  /**
   *
   * @param fbpProcess
   * @param portName
   * @param string
   */
  initialize(fbpProcess, portName, string) {
    const processName = (typeof fbpProcess === "string") ? fbpProcess : fbpProcess.name;
    attachInputToProcess(this, processName, portName, {
      data: string
    });
  }

  /**
   *
   * @param moduleName
   * @param name
   * @returns {*}
   */
  defineProcess(moduleName, name) {
    if (!name) {
      throw new Error(`No name passed to defineProcess:${moduleName}`);
    } else if (this._processes[name]) {
      throw new Error(`Duplicate name specified in defineProcess:${moduleName}`);
    } else {
      const moduleLocation = locateComponent(moduleName, this.componentRoot || '');
      this._processes[name] = {
        name,
        location: moduleLocation
      };
      return this._processes[name];
    }
  }

  /**
   *
   * @param processName
   * @returns {*}
   */
  getProcessByName(processName) {
    return this._processes[processName];
  }

  /**
   *
   * @returns {Array}
   */
  getProcessList() {
    return _.keys(this._processes);
  }

  /**
   *
   * @param processName
   * @returns {{in, out}}
   */
  getProcessPortNames(processName) {
    const connections = this.getProcessConnections(processName);
    return { in: _.keys(connections.in),
      out: _.keys(connections.out)
    }
  }

  /**
   *
   * @param upstreamProcess
   * @param upstreamPortName
   * @param downstreamProcess
   * @param downstreamPortName
   * @param capacity
   */
  connect(
    upstreamProcess,
    upstreamPortName,
    downstreamProcess,
    downstreamPortName,
    capacity) {
    const upstreamProcessName = (typeof upstreamProcess === 'string') ? upstreamProcess : upstreamProcess.name;
    const downstreamProcessName = (typeof downstreamProcess === "string") ? downstreamProcess : downstreamProcess.name;
    attachInputToProcess(this, downstreamProcessName, downstreamPortName, {
      process: upstreamProcessName,
      port: upstreamPortName
    });

    const upstreamConnections = this.getProcessConnections(upstreamProcessName);
    const processOutPorts = upstreamConnections.out;
    if (processOutPorts[upstreamPortName]) {
      console.log(`Cannot connect one output port (${upstreamProcess}.${upstreamPortName}) to multiple input ports`);
      return;
    }

    processOutPorts[upstreamPortName] = {
      process: downstreamProcessName,
      port: downstreamPortName,
      capacity: capacity || 10
    };
  }

  /**
   *
   * @param sinport
   * @param string
   */
  sinitialize(sinport, string) {
    const other = getPortInfo.call(this, sinport);

    this.initialize(other.proc, other.port, string);
  }

  /**
   *
   * @param soutport
   * @param sinport
   * @param capacity
   */
  sconnect(soutport, sinport, capacity) {
    const up = getPortInfo.call(this, soutport);
    const down = getPortInfo.call(this, sinport);

    this.connect(up.proc, up.port, down.proc, down.port, capacity);
  }

  /**
   *
   * @param processName
   * @returns {boolean}
   */
  processIsSelfStarting(processName) {
    const connections = this.getProcessConnections(processName);
    const inputs = connections.in;
    return !_.some(inputs, inputDetails => 'process' in inputDetails[0])
  }

  /**
   *
   * @param processName
   * @param portName
   * @returns {*}
   */
  processPortHasData(processName, portName) {
    const container = this.getContainer(processName);
    return container.portHasData(portName);
  }

  /**
   *
   * @param processName
   * @param portName
   * @returns {*}
   */
  processPortIsOpen(processName, portName) {
    const container = this.getContainer(processName);
    return container.portIsOpen(portName);
  }

  /**
   *
   * @param processName
   */
  getContainer(processName) {
    return _.find(this.processes, container => container.name === processName);
  }

  /**
   *
   * @param [options] {object}
   * @param callback {function}
   */
  run(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    callback = callback || (() => {});

    const networkProcesses = this._processes;
    const network = this;


    this.processes = _.reduce(networkProcesses, (processes, details, processName) => {
      const ports = network.getProcessPortNames(processName);

      const fbpProcess = new FBPProcess({
        name: processName,
        component: details.location,
        in: ports.in,
        out: ports.out
      });

      fbpProcess.on('error', e => {
        callback(new ProcessError(fbpProcess.name, e));
      });

      fbpProcess.on('statusChange', e => {
        console.log(`{ "type": "statusChange", "newStatus": "${e.newStatus.name}", "name": "${e.name}" }`);
        fbpProcess.status = e.newStatus;

        let allInitialized = true;
        let allDone = true;
        _.forEach(network.processes, processContainer => {
          console.log(`{ "type": "statusCheck", "name": "${processContainer.name}", "status": "${processContainer.status.name}"}`);
          allInitialized = allInitialized && processContainer.status.name === FBPProcessStatus.INITIALIZED.name;
          allDone = allDone && processContainer.status.name === FBPProcessStatus.DONE.name;
        });

        if (allInitialized) {
          console.log(`{ "type": "networkMessage", "message": "All processes initialized - time to commence"}`);
          _.forEach(network.processes, pc => {
            pc.commence();
          });
        }

        if (allDone) {
          _.forEach(network.processes, (process) => process.terminate());
          callback();
        }
      });


      fbpProcess.on('processDormant', () => {
        var readyForShutdown = fbpProcess.isReadyForShutdown();
        console.log("Process Dormant: %s, %s", fbpProcess.name, readyForShutdown);
        if (readyForShutdown) {
          fbpProcess.shutdownProcess();
        }
      });


      processes[processName] = fbpProcess;
      return processes;
    }, {});

    _.forEach(this._connections, (processConnections, processName) => {
      const fbpProcess = this.processes[processName];

      _.forEach(processConnections.out, (outport, portName) => {
        const connection = new ProcessConnection(outport.capacity);
        connection.connectProcesses(fbpProcess, portName, this.processes[outport.process], outport.port);
      });

      _.forEach(processConnections.in, (inConnections, portName) => {
        _.forEach(inConnections, inConnection => {
          if ('data' in inConnection) {
            const connection = new IIPConnection(inConnection.data);
            fbpProcess.addUpstreamConnection(portName, connection);
          }
        })
      });
    });

    _.invokeMap(this.processes, 'initialize');

  }
}

function locateComponent(componentName, localRoot) {
  let componentField;
  let moduleLocation;

  if (componentName.match('^[.]{1,2}/')) {
    moduleLocation = path.resolve(path.join(__dirname, '..', componentName));
  } else if (componentName.includes('/')) {
    moduleLocation = componentName.slice(0, componentName.indexOf('/'));
    componentField = componentName.slice(componentName.indexOf('/') + 1);
    if (moduleLocation === 'jsfbp') {
      moduleLocation = path.resolve(path.join(__dirname, '..', 'components', `${componentField}.js`));
      componentField = undefined;
    } else if (moduleLocation === '') {
      moduleLocation = path.join(localRoot, componentField);
      componentField = undefined;
    }
  } else {
    moduleLocation = componentName;
  }
  return {
    moduleLocation,
    componentField
  };
}

function getPort(connectionEnd) {
  let port = connectionEnd.port;
  if ('index' in connectionEnd) {
    port += `[${connectionEnd.index}]`;
  }
  return port;
}


function attachInputToProcess(network, processName, portName, input) {
  const processConnections = network.getProcessConnections(processName);

  if (!processConnections.in[portName]) {
    processConnections.in[portName] = [];
  }

  processConnections.in[portName].push(input);
}

function getPortInfo(sinport) {
  const i = sinport.lastIndexOf('.');
  const procname = sinport.substring(0, i);
  const port = sinport.substring(i + 1);
  const proc = this._processes[procname];
  return {
    port,
    proc
  };
}


/**
 * @extends Error
 */
class ProcessError extends Error {
  constructor(processName, error) {
    super();
    this.name = "ProcessError";
    this.message = `Error from ${processName}${JSON.stringify(error)}`;
    this.stack = error.stack;
    this.error = error;
  }
}



export default Network;
