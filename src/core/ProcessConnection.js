import FBPProcessStatus from './FBPProcessStatus';
import Connection from './Connection';
import _ from 'lodash';

const osProcess = process;

/**
 * @extends Connection
 */
class ProcessConnection extends Connection {
  /**
   *
   */
  constructor() {
    super();

    this.name = null;
    this.downstream = null; // downstream component
    this.upstream = null;
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

export default ProcessConnection;
