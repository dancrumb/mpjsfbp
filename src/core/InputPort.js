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
      console.log(`No component passed to input port: ${port}`);
    }
  }

  /**
   *
   * @returns {IP|null}
   */
  receive() {
    if (this.closed) {
      return null;
    }

    this.emit("ipRequested", {
      portName: this.name
    });

    let ip = this.component.awaitResponse();

    console.log(`{"type": "ipReceivedAtInputPort", "port": "${this.name}", "component": "${this.component.name}" "ip": ${ip? ip : null}}`);

    if (!ip) {
      ip = null;
      this.close();
    }
    return ip;
  }
}

export default InputPort;
