import Port from './Port';

/**
 * @extends Port
 */
class InputPort extends Port {
  /**
   *
   * @param {Component} component
   * @param port
   */
  constructor(component, port) {
    super(component, port);

    if (component) {
      component.addInputPort(this);
    } else {
      this.log.info(`No component passed to input port: ${port}`);
    }
  }

  /**
   *
   * @returns {IP|null}
   */
  receive() {
    if (this.closed) {
      this.log.info({
        "type": "inputPortReceiveFromClosed",
        "port": this.name,
        "component": (this.component ? this.component.name : null)
      });
      return null;
    }
    this.log.info({
      "type": "inputPortReceive",
      "port": this.name,
      "component": (this.component ? this.component.name : null)
    });

    this.emit("ipRequested", {
      portName: this.name
    });

    let ip = this.component.awaitResponse();

    this.log.info({
      "type": "ipReceivedAtInputPort",
      "port": this.name,
      "component": this.component.name,
      "ip": (ip ? ip : {})
    });

    if (!ip) {
      ip = null;
    }
    return ip;
  }
}

export default InputPort;
