import FIFO from './FIFO';
import {
  EventEmitter
} from 'events';

class Connection extends EventEmitter {
  constructor() {
    super();
    this.closed = false;
    this.contents = new FIFO();
  }

  isOpen() {
    return !this.closed;
  }

  close() {
    this.closed = true;
  }

  hasData() {
    return !this.contents.isEmpty();
  }

  purgeData() {
    this.contents = new FIFO();
  }

  pendingIPCount() {
    return this.contents.length;
  }
}

export default Connection;
