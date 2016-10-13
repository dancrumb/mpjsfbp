class PortScaffold {
  constructor(options) {
    this.name = options.name;
    this.type = options.type;
    this.eos = false;

    this.buffer = options.buffer;
    this.cursor = 0;
  }

  receive() {
    if(this.type !== "IN" && this.type !== "IIP") {
      throw new Error(`Called 'receive' on an outport: ${this.name}`);
    }
    if(this.eos) {
      return null;
    }

    const ip = this.buffer[this.cursor];
    this.cursor++;

    this.eos = this.cursor >= this.buffer.length;


    return ip;
  }

  send(ip) {
    if(this.type !== "OUT") {
      throw new Error(`Called 'send' on an inport: ${this.name}`);
    }

    this.buffer.push(ip);
  }

  getBuffer() {
    return this.buffer;
  }
}

export default PortScaffold;