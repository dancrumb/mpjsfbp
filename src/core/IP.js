import Enum from './Enum';

class IP {
  constructor(contents) {
    this.owner = null;
    this.type = IP.Types.NORMAL;
    this.contents = contents;
  }

  toString() {
    return `IP: { \n type:${IP.Types.__lookup(this.type)}, \n owner: ${this.owner},\n contents: ${(this.contents === null) ? "<null>" : "<data>"}\n}`
  }
}

IP.Types = new Enum([
  "NORMAL",
  "OPEN",
  "CLOSE"
]);

["NORMAL", "OPEN", "CLOSE"].forEach(type => {
  Object.defineProperty(IP, type, {
    get() {
      console.error(`Accessing IP types from IP object directly is deprecated. Please use IP.Types.${type}`);
      return IP.Types[type]
    }
  });
});

export default IP;
