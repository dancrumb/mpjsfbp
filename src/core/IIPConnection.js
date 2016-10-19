import Connection from './Connection';
import IP from './IP';

/**
 * A connection linking an IIP to a Process
 * @extends Connection
 */
class IIPConnection extends Connection {
  /**
   *
   * @param data The data that makes up the IIP
   */
  constructor(data) {
    super();
    this.data = data;
    this.contents.enqueue(new IP(data));
  }

  /**
   * IIPConnections cannot activate Processes, so this is always going to be false
   * @returns {boolean} false
   */
  couldActivateAProcess() {
    return false;
  }

  getIP() {
    return super.getIP().then((ip) => {
      this.close();
      return ip;
    });
  }

  reset() {
    this.contents.reset([new IP(this.data)]);
    this.closed = false;
  }

  closeFromDownstream() {
    this.close();
  }
}

export default IIPConnection;
