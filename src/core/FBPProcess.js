/**
 * Created by danrumney on 9/26/16.
 */

import {
  fork
} from 'child_process';

import {
  EventEmitter
} from 'events';
import FBPProcessMessageType from './FBPProcessMessageType';
import FBPProcessStatus from './FBPProcessStatus';
import ProcessConnection from './ProcessConnection';
import _ from 'lodash';
import ipcSignaller from './IPCSignaller';

const signalHandlers = {
  IP_AVAILABLE(message) {
    const details = message.details;
    const connection = this.downstreamConnections[details.port][0];

    this.setStatus(FBPProcessStatus.WAITING_TO_SEND);
    connection.putIP(details.ip, () => {
      this.setStatus(FBPProcessStatus.ACTIVE);
      this.ipAccepted();
    })
  },
  IP_REQUESTED(message) {
    const details = message.details;
    if (this.status.name !== FBPProcessStatus.ACTIVE.name) {
      console.log(`{ "type": "unexpectedMessage", "process": "${this.name}", "state": "${this.status.name}", "messageId": "${message.id}", "messageType": "${message.type.name}", "messageDetails": ${JSON.stringify(message.details)}}`);
      throw new Error("Received IP_REQUESTED unexpectedly");
    }
    this.setStatus(FBPProcessStatus.WAITING_TO_RECEIVE);
    console.log(`Looking for a connection on ${details.port}`);
    var connectionForReceive = this.getConnectionForReceive(details.port);
    if (!connectionForReceive) {
      console.error(`No connection found for '${details.port}' port of '${this.name}' process`);
      //throw new Error("No connection available to handle IP_REQUESTED");
      this.setStatus(FBPProcessStatus.ACTIVE);
      this.signal(FBPProcessMessageType.EOS_INBOUND);
    } else {
      connectionForReceive.getIP((err, ip) => {
        this.setStatus(FBPProcessStatus.ACTIVE);
        if (ip === null) {
          this.signal(FBPProcessMessageType.EOS_INBOUND);
        } else {
          this.signal(FBPProcessMessageType.IP_INBOUND, {
            port: details.port,
            ip
          });
        }
      })
    }
  },
  INITIALIZATION_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.INITIALIZED);
  },
  COMPONENT_COMPLETE(message) {
    this.setStatus(FBPProcessStatus.DORMANT);
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

    this.openUpstreamProcesses = 0;
    this.upstreamConnections = {};
    this.downstreamConnections = {};

    this.iipConnections = [];

    this.processDetails = processDetails;

    this.component.on('error', e => {
      console.error('Process %s just died: %j', processDetails.name, e);
    });


    this.component.on('message', message => {
      const handler = signalHandlers[(message.type.name)];

      if (handler) {
        console.log(`{ "type": "messageHandler", "receiver": "${this.name}", "messageId": "${message.id}", "messageType": "${message.type.name}", "messageDetails": ${JSON.stringify(message.details)} }`);
        handler.call(this, message, this.component);

      } else if (message.type === FBPProcessMessageType.PORT_CLOSURE) {
        this.emit('closePort', message.details);
      } else if (message.type === FBPProcessMessageType.ERROR) {
        this.emit('error', message.details);
      } else {
        console.log(`{"type":"error", "error": "Unknown message: ${JSON.stringify(message)}"}`);
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
      });
    });
    this.signal(FBPProcessMessageType.INITIALIZE, this.processDetails);
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
    //console.log(portConnections);
    var connectionsWithData = _.filter(portConnections, (conn) => conn.hasData());
    if (connectionsWithData.length === 0) {
      var connectionsWithPotential = _.filter(portConnections, (conn) => conn.couldActivateAProcess());
      return _.sample(connectionsWithPotential);
    } else {
      return _.sample(connectionsWithData);
    }
  }

  commence() {
    if (this.openUpstreamProcesses === 0) {
      console.log(`{"type": "selfStarting", "name": "${this.name}"}`);
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
    if ((this.status !== FBPProcessStatus.DORMANT) && (this.status !== FBPProcessStatus.INITIALIZED)) {
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
