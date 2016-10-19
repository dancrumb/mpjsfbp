/**
 * Created by danrumney on 9/26/16.
 */

import {
  fork
} from 'child-process-debug';
import {
  EventEmitter
} from 'events';
import FBPProcessMessageType from './FBPProcessMessageType';
import FBPProcessStatus from './FBPProcessStatus';
import ProcessConnection from './ProcessConnection';
import NullConnection from './NullConnection';
import _ from 'lodash';
import ipcSignaller from './IPCSignaller';
import bunyan from './bunyan-stub';


const signalHandlers = {
  IP_AVAILABLE(message) {
    const details = message.details;
    const connection = this.downstreamConnections[details.port][0];

    this.setStatus(FBPProcessStatus.WAITING_TO_SEND);
    connection.putIP(details.ip).then(() => {
      this.setStatus(FBPProcessStatus.ACTIVE);
      this.ipAccepted();
    })
  },
  IP_REQUESTED(message) {
    const details = message.details;
    if (this.status.name !== FBPProcessStatus.ACTIVE.name) {
      this.log.error({
        "type": "unexpectedMessage",
        "process": this.name,
        "state": this.status.name,
        "messageId": message.id,
        "messageType": message.type.name,
        "messageDetails": message.details
      });
      throw new Error("Received IP_REQUESTED unexpectedly");
    }
    this.setStatus(FBPProcessStatus.WAITING_TO_RECEIVE);
    var connectionForReceive = this.getConnectionForReceive(details.port);

    connectionForReceive.getIP().then((ip) => {
      this.setStatus(FBPProcessStatus.ACTIVE);
      if (ip === null) {
        this.signal(FBPProcessMessageType.EOS_INBOUND, {
          port: details.port
        });
      } else {
        this.signal(FBPProcessMessageType.IP_INBOUND, {
          port: details.port,
          ip
        });
      }
    });

  },
  INITIALIZATION_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.INITIALIZED);
  },
  CONNECTION_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.READY);
  },
  COMPONENT_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.DORMANT);
  },
  ASYNC_CALLBACK(message) {
    this.setStatus(FBPProcessStatus.WAITING_FOR_CALLBACK);
  },
  CALLBACK_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.ACTIVE);
  },
  PORT_CLOSURE(message) {
    var upstreamConnections = this.upstreamConnections[message.port];
    var downstreamConnection = this.downstreamConnections[message.port];
    _.invokeMap(upstreamConnections, 'close');
    _.invokeMap(downstreamConnection, 'close');
  },
  CONNECTION_DEPTH_REQUEST(message) {
    var upstreamConnections = this.upstreamConnections[message.port];
    var downstreamConnection = this.downstreamConnections[message.port];
    var depth = _.sumBy(upstreamConnections.concat(downstreamConnection), 'pendingIPCount');
    this.signal(FBPProcessMessageType.CONNECTION_DEPTH, {
      depth
    });
  },
  ERROR(message) {
    this.emit('error', message.details);
  }
};

/**
 *
 */
class FBPProcess extends EventEmitter {
  /**
   *
   * @param processDetails
   */
  constructor(processDetails) {
    super();

    this.name = processDetails.name;
    this.status = FBPProcessStatus.NOT_INITIALIZED;
    this.component = fork(`${__dirname}/Component.js`);
    this.log = bunyan.createLogger({
      name: "FBPProcess (" + this.name + ")"
    });


    this.openUpstreamProcesses = 0;
    this.upstreamConnections = {};
    this.downstreamConnections = {};

    this.iipConnections = [];

    this.processDetails = processDetails;

    this.component.on('error', e => {
      this.log.error('Process %s just died: %j', processDetails.name, e);
    });


    this.component.on('message', message => {
      const handler = signalHandlers[(message.type.name)];

      if (handler) {
        this.log.info({
          "type": "messageHandler",
          "receiver": this.name,
          "messageId": message.id,
          "messageType": message.type.name,
          "messageDetails": JSON.stringify(message.details)
        });
        try {
          handler.call(this, message, this.component);
        } catch (e) {
          this.log.error({
            "type": "error",
            "error": "messageHandlerFailure",
            details: e
          });
          this.emit('error', e);
        }
      } else {
        this.log.error({
          "type": "error",
          "error": "Unknown message",
          message: message
        });
      }
    });

    this.on('processDormant', () => {
      var readyForShutdown = this.isReadyForShutdown();
      this.log.info({
        "type": "processDormant",
        "name": this.name,
        "readyForShutdown": readyForShutdown
      });

      if (readyForShutdown) {
        this.shutdownProcess();
      } else {
        var dataReady = _.some(this.upstreamConnections, (connections) => {
          return _.some(connections, (connection) => {
            return connection.hasData();
          });
        });
        if (dataReady) {
          this.activate();
        }
      }
    });
    this.once('allUpstreamProcessesClosed', () => {
      if (this.status === FBPProcessStatus.DORMANT || this.status === FBPProcessStatus.INITIALIZED) {
        this.shutdownProcess();
      }
    });
  }

  initialize() {
    _.forEach(this.upstreamConnections, (connections) => {
      _.forEach(connections, (connection) => {
        connection.once('ipAvailable', () => {
          if ((this.status === FBPProcessStatus.DORMANT) || (this.status === FBPProcessStatus.INITIALIZED)) {
            this.activate();
          }
        });
        connection.once('connectionCompleted', () => {
          this.openUpstreamProcesses--;
          if (this.openUpstreamProcesses === 0) {
            this.emit('allUpstreamProcessesClosed');
          }
        });
      });
    });
    this.signal(FBPProcessMessageType.INITIALIZE, this.processDetails);
  }

  connect(connections) {
    this.signal(FBPProcessMessageType.CONNECT, connections);
  }

  /**
   *
   * @param portName
   * @param connection
   */
  addUpstreamConnection(portName, connection) {
    if (connection instanceof ProcessConnection) {
      this.openUpstreamProcesses++;
    } else {
      this.iipConnections.push(connection);
    }
    _addConnection.call(this, 'up', portName, connection);
  }

  /**
   *
   * @param portName
   * @param connection
   */
  addDownstreamConnection(portName, connection) {
    _addConnection.call(this, 'down', portName, connection);
  }

  getConnectionForReceive(portName) {
    var portConnections = this.upstreamConnections[portName];
    var connectionsWithData = _.filter(portConnections, (conn) => conn.hasData());
    if (connectionsWithData.length === 0) {
      var connectionsWithPotential = _.filter(portConnections, (conn) => conn.couldActivateAProcess());
      if (connectionsWithPotential.length === 0) {
        return new NullConnection();
      } else {
        return _.sample(connectionsWithPotential);
      }
    } else {
      return _.sample(connectionsWithData);
    }
  }

  commence() {
    if (this.openUpstreamProcesses === 0) {
      this.log.info({
        "type": "selfStarting",
        "name": this.name
      });
      this.activate();
    }
  }

  isReadyForShutdown() {
      return _.every(this.upstreamConnections, (connections) => {
        return _.every(connections, (connection) => !connection.couldActivateAProcess());
      });
    }
    /**
     *
     */
  shutdownProcess() {
    this.signal(FBPProcessMessageType.SHUTDOWN_PROCESS);
    _.forEach(this.upstreamConnections, (connections) => {
      _.forEach(connections, (connection) => connection.close());
    });
    _.forEach(this.downstreamConnections, (connections) => {
      _.forEach(connections, (connection) => connection.close());
    });

    this.setStatus(FBPProcessStatus.DONE);
  }

  signal(type, details) {
    ipcSignaller.call(this, type, details);
  }

  setStatus(newStatus) {
    this.status = newStatus;
    this.log.info({
      "type": "setStatus",
      "name": this.name,
      "newStatus": newStatus
    });


    this.emit('statusChange', {
      name: this.name,
      newStatus: this.status
    });
    if (this.status === FBPProcessStatus.DORMANT) {
      this.emit('processDormant');
    }
  }

  /**
   *
   */
  ipAccepted() {
    this.signal(FBPProcessMessageType.IP_ACCEPTED);
  }

  activate() {
    if ((this.status !== FBPProcessStatus.DORMANT) && (this.status !== FBPProcessStatus.READY)) {
      throw new Error("Tried to activate a Process that cannot be activated");
    }

    _.invokeMap(this.iipConnections, 'reset');
    this.setStatus(FBPProcessStatus.ACTIVE);
    this.signal(FBPProcessMessageType.ACTIVATION_REQUEST);
  }

  terminate() {
    this.component.disconnect();
  }

}

var _addConnection = function (direction, portName, connection) {
  var path = direction + 'streamConnections["' + portName + '"]';
  _.update(this, path, function (val) {
    return (_.isArray(val) ? val : []).concat(connection)
  });
};

export default FBPProcess;
