import FBPProcessStatus from './FBPProcessStatus';
import ProcessConnection from './ProcessConnection';
import _ from 'lodash';
import ipc from 'node-ipc';


const osProcess = process;

/**
 * @extends ProcessConnection
 */
class RemoteProcessConnection extends ProcessConnection {

  /**
   *
   */
  constructor(local, remote, networkId) {
    super();

    this.local = local;
    this.remote = remote;

    this.remoteIPC = networkId + ':' + remote.process;
    ipc.connectTo(this.localIPC);

    ipc.server.on('ipSubmitted:' + this.local.port, (data) => {

    });

  }

  getIP() {
    ipc.of[this.localIPC].emit('ipRequested:' + this.remote.port);
  }

  /**
   *
   * @param proc
   */
  close(proc) {
    super.close();
    if (proc === this.downstream.process) {
      if (this.hasData()) {
        console.log(`${proc.name}: ${this.contents.length} IPs dropped because of close on ${this.name}`);
      }
      this.purgeData();
    }
  }

  /**
   *
   * @param {FBPProcess} upstreamProcess
   * @param {string} outport
   * @param {FBPProcess} downstreamProcess
   * @param {string} inport
   */
  connectProcesses(upstreamProcess, outport, downstreamProcess, inport) {
    this.name = downstreamProcess.name;

    this.upstream = {
      process: upstreamProcess,
      portName: outport
    };
    upstreamProcess.addDownstreamConnection(outport, this);

    this.downstream = {
      process: downstreamProcess,
      portName: inport
    };
    downstreamProcess.addUpstreamConnection(inport, this);

  }
}

export default RemoteProcessConnection;
