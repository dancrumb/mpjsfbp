import Port from './Port';
import Promise from 'bluebird';
import _ from 'lodash';
import IIPConnection from './IIPConnection';

/**
 * @extends Port
 */
class InputPort extends Port {
  /**
   *
   * @param {Component} component
   * @param {string} portName
   * @param {*} otherEnds
   */
  constructor(component, portName, otherEnds) {
    super(component, portName, otherEnds);

    if (component) {
      component.addInputPort(this);
    } else {
      this.log.info(`No component passed to input port: ${portName}`);
    }

    _.forEach(otherEnds, (otherEnd) => {
      if (otherEnd.data) {
        this.connections.push(new IIPConnection(otherEnd.data));
      } else {
        this.connections.push(new RemoteProcessConnection(otherEnd.process, otherEnd.port))
      }

    })
  }

  componentName() {
    return (this.component ? this.component.name : null);
  }

  /**
   * Receives an IP from the InputPort.
   *
   * This is a fiber-blocking call, so the called will see it as synchronous.
   *
   * @returns {IP|null} `null` is returned if the incoming stream of IPs is at its end. Otherwise an IP will be returned
   */
  receive() {
    this.log.info({
      "type": "InputPort#receive",
      "closed": this.closed,
      "port": this.name,
      "component": this.componentName()
    });

    if (this.closed) {
      return Promise.resolve(null);
    }

    return new Promise((resolve, reject) => {
      this.emit("ipRequested", {
        portName: this.name
      });

      let ip = this.component.requestIP(this);

      this.log.info({
        "type": "ipReceivedAtInputPort",
        "port": this.name,
        "component": this.component.name,
        "ip": (ip ? ip : {})
      });

      if (!ip) {
        ip = null;
      }
      resolve(ip);
    });
  }
}

export default InputPort;
