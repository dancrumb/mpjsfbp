import Connection from './Connection';
import Promise from 'bluebird';

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
   * @returns {Promise.<null>}
   */
  getIP() {
    console.log(`{ "type": "getIPResolution", "resolution": "EOS"}`);
    return Promise.resolve(null);
  }
}

export default NullConnection;
