import FIFO from './FIFO';
import {
  EventEmitter
} from 'events';
import IP from './IP';
import bunyan from 'bunyan';

/**
 *
 */
class Connection extends EventEmitter {
  /**
   *
   * @param size
   */
  constructor(size) {
    super();
    this.closed = false;

    this.capacity = size;
    this.contents = new FIFO();

    this.log = bunyan.createLogger({
      name: "Connection"
    });

    this.contents.on('fifoValueAdded', () => {
      this.emit('ipAvailable');
      this.emit('ipAccepted');
    });
    this.contents.on('fifoEmpty', () => {
      if (this.closed) {
        this.emit('connectionCompleted');
      }
    });
  }

  /**
   * Checks whether this connection could potentially send a process-activating IP
   * @returns {boolean}
   */
  couldActivateAProcess() {
    return this.couldSendData()
  }

  /**
   * Checks whether this connection could send an IP right now or potentially in the future
   * @returns {boolean}
   */
  couldSendData() {
    return this.isOpen() || !this.contents.isEmpty();
  }

  /**
   *
   * @param callback
   */
  getIP(callback) {
    const dequeuer = () => {
      const ip = this.contents.dequeue();
      this.contents.removeListener('fifoNoLongerEmpty', dequeuer);
      this.removeListener('connectionCompleted', dequeuer);
      this.log.info({
        "type": "ipDequeue",
        "name": this.name,
        "ip": ip
      });
      callback(null, ip);
    };

    this.log.info({
      "type": "connectionState",
      "cursor": this.contents.cursor,
      "length": this.contents.length
    });
    if (!this.couldSendData()) {
      this.log.info({
        "type": "getIPResolution",
        "resolution": "dataDepleted"
      });
      process.nextTick(() => callback(null, null));
    } else if (this.hasData()) {
      this.log.info({
        "type": "getIPResolution",
        "resolution": "dataAvailable"
      });
      process.nextTick(dequeuer);
    } else {
      this.log.info({
        "type": "getIPResolution",
        "resolution": "waitingForData"
      });
      this.contents.once('fifoNoLongerEmpty', dequeuer);
      this.once('connectionCompleted', dequeuer);
    }
  }

  /**
   *
   * @param {IP} ip
   * @param {function} callback
   */
  putIP(ip, callback) {
    if (this.closed) {
      callback(new Error("Tried to put an IP into a closed connection"));
    }

    const connectionContents = this.contents;

    var ipEnqueuer = () => {
      this.log.info({
        "type": "ipEnqueue",
        "name": this.name,
        "ip": ip
      });
      connectionContents.enqueue(ip);
      callback();
    };

    if (connectionContents.length >= this.capacity) {
      connectionContents.once('fifoValueRemoved', ipEnqueuer);
    } else {
      process.nextTick(ipEnqueuer);
    }
  }

  /**
   * Checks whether this connection is open
   * @returns {boolean}
   */
  isOpen() {
    return !this.closed;
  }

  /**
   * Closes this connection
   *
   * @fires Connection#connectionClosed
   * @fires Connection#connectionCompleted
   */
  close() {
    this.log.info({
      "type": "closingConnection",
      "ips": this.pendingIPCount()
    });
    this.closed = true;
    this.emit('connectionClosed');
    if (this.contents.isEmpty()) {
      this.emit('connectionCompleted');
    }
  }

  /**
   * Checks whether there are IPs in this connection
   * @returns {boolean}
   */
  hasData() {
    return !this.contents.isEmpty();
  }

  /**
   * Clears the connection of all IPs
   */
  purgeData() {
    this.contents.reset();
  }

  /**
   *
   * @returns {number} The number of IPs not yet cleared from this connection
   */
  pendingIPCount() {
    return this.contents.length;
  }
}

export default Connection;


/**
 * Indicates that a Connection has closed. However, it is possible that it still contains data, waiting to drain
 * @event Connection#connectionClosed
 */
/**
 * Indicates that a Connection is completed, meaning that it is closed and it has no more data to provide
 * @event Connection#connectionCompleted
 */
