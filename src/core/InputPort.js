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

  componentName() {
    return (this.component ? this.component.name : null);
  }

  /**
   *
   * @returns {IP|null}
   */
  receive() {
    this.log.info({
      "type": "InputPort#receive",
      "closed": this.closed,
      "port": this.name,
      "component": this.componentName()
    });
    if (this.closed) {
      return null;
    }

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
