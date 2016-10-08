import Port from './Port';
import Fiber from 'fibers';

class OutputPort extends Port {
  constructor(process, port) {
    super(process, port);
    process.addOutputPort(this);
  }

  send(ip) {
    this.componentProvider.disownIP(ip);

    this.emit("ipSubmitted", {
      portName: this.name,
      ip
    });
    return Fiber.yield();

  }
}

export default OutputPort;
