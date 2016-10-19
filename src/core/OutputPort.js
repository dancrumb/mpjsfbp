import Port from './Port';

/**
 * @extends Port
 */
class OutputPort extends Port {
  constructor(process, port, otherEnd) {
    super(process, port, otherEnd);
    process.addOutputPort(this);
  }

  /**
   *
   * @param ip {IP}
   */
  send(ip) {
    this.component.submitIP(ip);
  }
}

export default OutputPort;
