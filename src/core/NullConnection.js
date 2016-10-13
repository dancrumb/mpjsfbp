import Connection from './Connection';
import IP from './IP';

/**
 * @extends Connection
 */
class NullConnection extends Connection {
  /**
   *
   */
  constructor() {
    super();
    this.closed = true;
  }

  /**
   *
   * @param callback
   */
  getIP(callback) {
    console.log(`{ "type": "getIPResolution", "resolution": "EOS"}`);
    callback(null, null);
  }
}

export default NullConnection;
