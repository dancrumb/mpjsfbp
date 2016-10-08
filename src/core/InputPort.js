import Port from './Port';
import Fiber from 'fibers';

class InputPort extends Port {
  constructor(process, port) {
    super(process, port);

    if (process) {
      process.addInputPort(this);
    } else {
      console.log(`No componentProvider passed to input port: ${port}`);
    }
  }

  receive() {
    if (this.closed) {
      return null;
    }

    this.emit("ipRequested", {
      portName: this.name
    });

    let ip = Fiber.yield();

    console.log('Received: %j', ip ? {
      type: ip.type,
      contents: ip.contents
    } : null);

    if (!ip) {
      ip = null;
      this.close();
    }
    return ip;
  }
}

export default InputPort;
