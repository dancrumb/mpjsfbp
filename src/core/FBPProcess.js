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

const signalHandlers = {
  IP_AVAILABLE(message) {
    const details = message.details;
    const connection = this.connections[details.port][0];
    console.log('connection: %j', connection);

    connection.putIP(this.name, details.ip, () => {
      this.ipAccepted();
    })
  }
};

class FBPProcess extends EventEmitter {
  constructor(processDetails) {
    super();

    console.log("Creating ComponentProvider");
    this.name = processDetails.name;
    this.status = FBPProcessStatus.NOT_INITIALIZED;
    this.componentProvider = fork(`${__dirname}/ComponentProvider.js`);
    this.activationSignalSent = false;

    this.openUpstreamProcesses = 0;
    this.connections = {};

    this.componentProvider.on('error', e => {
      console.error('Process %s just died: %j', processDetails.name, e);
    });


    this.componentProvider.on('message', message => {
      const handler = signalHandlers[FBPProcessMessageType.__lookup(message.type)];
      if (handler) {
        handler.call(this, message, this.componentProvider);
      } else if (message.type === FBPProcessMessageType.STATUS_UPDATE) {
        this.emit('statusChange', {
          name: message.name,
          oldStatus: message.oldStatus,
          newStatus: message.newStatus
        });
        this.status = message.newStatus;
        if (this.status === FBPProcessStatus.ACTIVE) {
          this.activationSignalSent = false;
        } else if (this.status === FBPProcessStatus.DORMANT) {
          this.emit('processDormant');
        }
      } else if (message.type === FBPProcessMessageType.IP_REQUESTED) {
        const details = message.details;
        console.log(this.connections);
        const connections = this.connections[details.port];
        console.log('connections: %j', connections);
        var readyConnection = _(connections).filter((connection) => connection.hasData()).sample();
        if (readyConnection) {
          readyConnection.getIP(this.name, (error, ip) => {
            console.log('IP received by %s.%s from Connection: %j', this.name, details.port, ip);
            this.deliverIP(details.port, ip);
          });
        } else {
          throw new Error("Not ready to deliver an IP")
        }
      } else if (message.type === FBPProcessMessageType.PORT_CLOSURE) {
        this.emit('closePort', message.details);
      } else if (message.type === FBPProcessMessageType.ERROR) {
        this.emit('error', message.details);
      } else {
        console.log('Unknown message: %j', message);
      }
    });

    this.componentProvider.send({
      type: FBPProcessMessageType.INITIALIZE,
      details: processDetails
    });
  }

  addUpstreamConnection(portName, connection) {
    if (connection instanceof ProcessConnection) {
      this.openUpstreamProcesses++;
    }
    _addConnection.call(this, portName, connection);
  }

  addDowntreamConnection(portName, connection) {
    _addConnection.call(this, portName, connection);
  }

  deliverIP(portName, ip) {
    console.log('Delivering IP %j to %s', ip, this.name);
    this.componentProvider.send({
      type: FBPProcessMessageType.IP_INBOUND,
      details: ip
    });
  }

  commence(portName, ip) {
    this.componentProvider.send({
      type: FBPProcessMessageType.COMMENCE,
      details: ip
    });
  }

  shutdownProcess() {
    this.componentProvider.send({
      type: FBPProcessMessageType.SHUTDOWN_PROCESS
    });
  }

  signalIPAvailable() {
    if (
      (this.status === FBPProcessStatus.DORMANT || this.status === FBPProcessStatus.INITIALIZED) && !this.activationSignalSent) {
      console.log('Activating %s due to incoming IP', this.name);
      this.activationSignalSent = true;
      this.componentProvider.send({
        type: FBPProcessMessageType.ACTIVATION_REQUEST
      })
    }
  }

  ipAccepted() {
    //TODO: Signal that IP has been accepted
    this.componentProvider.send({
      type: FBPProcessMessageType.IP_ACCEPTED
    });
  }

  getIIP(source) {
    if (source.hasBeenRead) {
      return null;
    } else {
      source.hasBeenRead = true;
      return source.data;
    }
  }
}

var _addConnection = function (portName, connection) {
  if (!this.connections[portName]) {
    this.connections[portName] = [];
  }

  this.connections[portName].push(connection);
};

export default FBPProcess;
