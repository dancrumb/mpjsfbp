import {
  EventEmitter
} from 'events';

class Port extends EventEmitter {
  constructor(process, portName) {
    super();
    if (process) {
      this.processName = process.name;
      this.componentProvider = process;
    } else {
      this.processName = '';
    }
    this.portName = portName;
    this.closed = false;
  }

  get name() {
    return this.portName;
  }

  isOpen() {
    return !this.closed;
  }

  close() {
    if (!this.closed) {
      this.closed = true;
      this.emit('portClosed');
    }
  }
}


export default Port;
