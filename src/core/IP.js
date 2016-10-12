import {
  Enum
} from 'enumify';

/**
 * Information Packet per the FBP specification
 */
class IP {
  constructor(contents) {
    this.type = IP.Types.NORMAL;
    this.contents = contents;
  }

  toString() {
    return `IP: { 
  type:${this.type.name},
  contents: ${(this.contents === null) ? "<null>" : "<data>"}
}`;
  }
}

class IPTypes extends Enum {}
IPTypes.initEnum([
  "NORMAL",
  "OPEN",
  "CLOSE"
]);


IP.Types = IPTypes;

["NORMAL", "OPEN", "CLOSE"].forEach(type => {
  Object.defineProperty(IP, type, {
    get() {
      console.error(`Accessing IP types from IP object directly is deprecated. Please use IP.Types.${type}`);
      return IP.Types[type]
    }
  });
});

export default IP;
