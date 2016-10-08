import ProcessStatus from './FBPProcessStatus';
import Connection from './Connection';
import _ from 'lodash';

class ProcessConnection extends Connection {
  constructor(size) {
    super();

    this.name = null;
    this.capacity = size;

    this.downStreamProcess = null; // downstream componentProvider
    this.upSteamProcesses = null;
  }

  getIP(proc, callback) {
    const connectionContents = this.contents;
    if (this.hasData()) {
      process.nextTick(() => {
        _getIP(connectionContents, proc, callback);
      });
    } else {
      connectionContents.once('fifoNoLongerEmpty', () => {
        _getIP(connectionContents, proc, callback);
      });
    }
  }

  putIP(proc, ip, callback) {
    if (ip.owner != proc) {
      callback();
    }
    if (this.closed) {
      callback(new Error("Tried to put an IP into a closed connection"));
    }

    const connectionContents = this.contents;

    //TODO: Signal that IP is available to downstream process

    var ipEnqueuer = () => {
      connectionContents.enqueue(ip);
      callback();
    };

    if (connectionContents.length >= this.capacity) {
      connectionContents.once('fifoValueRemoved', ipEnqueuer);
    } else {
      process.nextTick(ipEnqueuer);
    }
  }

  closeFromUpstream() {
    this.upstreamProcsUnclosed--;
    if ((this.upstreamProcsUnclosed) <= 0) {
      this.closed = true;
    }
  }

  closeFromDownstream() {
    this.upSteamProcesses.forEach(up => {
      if (up.status == ProcessStatus.CLOSED) {
        up.status = ProcessStatus.DONE;
      }
    });
  }

  closeFromInPort(proc) {
    this.closed = true;
    if (this.hasData()) {
      console.log(`${proc.name}: ${this.contents.length} IPs dropped because of close on ${this.name}`);
    }
    this.purgeData();
    _.forEach(this.upSteamProcesses, process => {});
  }

  connectProcesses(upstreamProcess, outport, downstreamProcess, inport) {
    this.name = downstreamProcess;

    this.upSteamProcesses = {
      processName: upstreamProcess,
      portName: outport
    };
    upstreamProcess.addDowntreamConnection(outport, this);

    this.downStreamProcess = {
      processName: downstreamProcess,
      portName: inport
    };
    downstreamProcess.addUpstreamConnection(inport, upstreamProcess);

  }
}



function _getIP(connectionContents, proc, callback) {
  const ip = connectionContents.dequeue();
  callback(null, ip);
}

export default ProcessConnection;
