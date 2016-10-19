import FIFO from './FIFO';
import {
  EventEmitter
} from 'events';
import IP from './IP';
import bunyan from './bunyan-stub';
import Promise from 'bluebird';
import eventToPromise from 'event-to-promise'


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
   * @returns {Promise}
   */
  getIP() {
    const newIPGetter = () => new Promise((resolve, reject) => {
      const ip = this.contents.dequeue();
      this.log.info({
        "type": "ipDequeue",
        "name": this.name,
        "ip": ip
      });
      resolve(ip);
    });

    this.log.info({
      "type": "connectionState",
      "cursor": this.contents.cursor,
      "length": this.contents.length
    });

    var ipResolution = "";
    let newIP;
    if (!this.couldSendData()) {
      ipResolution = "dataDepleted";
      newIP = Promise.resolve(null);
    } else if (this.hasData()) {
      ipResolution = "dataAvailable";
      newIP = newIPGetter();
    } else {
      ipResolution = "waitingForData";

      const fifoHasData = eventToPromise(this.contents, 'fifoNoLongerEmpty');
      const connectionComplete = eventToPromise(this, 'connectionCompleted');
      newIP = Promise.some([fifoHasData, connectionComplete]).then(() => {
        fifoHasData.cancel();
        connectionComplete.cancel();
        return newIPGetter();
      });
    }

    this.log.info({
      "type": "getIPResolution",
      "resolution": ipResolution
    });
    return newIP;
  }

  /**
   *
   * @param {IP} ip
   * @returns {Promise}
   */
  putIP(ip) {
    if (this.closed) {
      return Promise.reject(new Error("Tried to put an IP into a closed connection"));
    }

    const connectionContents = this.contents;

    var ipPutter = () => new Promise((resolve, reject) => {
      this.log.info({
        "type": "ipEnqueue",
        "name": this.name,
        "ip": ip
      });
      connectionContents.enqueue(ip);
      resolve();
    });

    if (connectionContents.length >= this.capacity) {
      return eventToPromise(connectionContents, 'fifoValueRemoved').then(ipPutter);
    } else {
      return ipPutter();
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
