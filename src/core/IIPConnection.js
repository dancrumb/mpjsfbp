import Connection from './Connection';
import IP from './IP';

class IIPConnection extends Connection {
  constructor(data) {
    super();
    this.contents.enqueue(data);
  }

  getIP(proc, callback) {
    if (this.closed) {
      return null;
    }

    const ip = new IP(this.contents.dequeue());
    this.close();
    callback(null, ip);
  }
}

IIPConnection.prototype.closeFromDownstream = IIPConnection.prototype.close;

export default IIPConnection;
