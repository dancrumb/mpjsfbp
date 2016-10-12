import Port from './Port';
import Fiber from 'fibers';

/**
 * @extends Port
 */
class OutputPort extends Port {
  constructor(process, port) {
    super(process, port);
    process.addOutputPort(this);
  }

  /**
   *
   * @param ip {IP}
   */
  send(ip) {
    this.emit("ipSubmitted", {
      portName: this.name,
      ip
    });

    this.component.awaitResponse();
  }
}

export default OutputPort;
