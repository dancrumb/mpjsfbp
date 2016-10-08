import {
  EventEmitter
} from 'events';

class FIFO extends EventEmitter {
  constructor() {
    super();

    this.queue = [];
    this.cursor = 0;
    this.length = 0;
  }

  enqueue(value) {
    this.queue.push(value);
    this.length += 1;
    this.emit('fifoValueAdded');
    if (this.length === 1) {
      this.emit('fifoNoLongerEmpty');
    }
  }

  dequeue() {
    const value = this.queue[this.cursor];
    this.cursor += 1;
    this.length -= 1;
    if (this.cursor > this.queue.length / 2) {
      this.queue = this.queue.slice(this.cursor);
      this.length = this.queue.length;
      this.cursor = 0;
    }
    this.emit('fifoValueRemoved');
    if (this.isEmpty()) {
      this.emit('fifoEmpty');
    }

    return value;
  }

  isEmpty() {
    return this.length === 0;
  }
}


export default FIFO;
