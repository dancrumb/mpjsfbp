import {
  EventEmitter
} from 'events';
import bunyan from 'bunyan';


/**
 * @extends EventEmitter
 */
class Port extends EventEmitter {
  /**
   *
   * @param component {Component}
   * @param portName {string}
   */
  constructor(component, portName) {
    super();
    if (component) {
      this.processName = component.name;
      this.component = component;
    } else {
      this.processName = '';
    }
    this.portName = portName;
    this.log = bunyan.createLogger({
      name: "Port (" + this.processName + "." + this.portName + ")"
    });

    this.closed = false;
  }

  /**
   *
   * @returns {string}
   */
  get name() {
    return this.portName;
  }

  /**
   *
   * @returns {boolean}
   */
  isOpen() {
    return !this.closed;
  }

  /**
   * Opens a Port
   */
  open() {
    this.closed = false;
  }

  /**
   *
   * @fires Port#portClosed
   */
  close() {
    if (!this.closed) {
      this.closed = true;
      this.emit('portClosed');
    }
  }

  /**
   * @returns {number} the total number of IPs associated with this Port. Could be IPs waiting to come int
   * or IPs in the downstream connection.
   */
  getConnectionDepth() {
    this.emit('connectionDepthRequest');
    return this.component.awaitResponse();
  }
}

export default Port;
