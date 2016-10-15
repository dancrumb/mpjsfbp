import {
  getElementWithSmallestBacklog
} from '../core/Utils';

export default function lbal() {
  const inport = this.openInputPort('IN');
  const array = this.openOutputPortArray('OUT');
  let selectedPort = null;
  let substream_level = 0;
  while (true) {
    const ip = inport.receive();
    if (ip === null) {
      break;
    }

    if (substream_level == 0) {
      selectedPort = getElementWithSmallestBacklog(array, selectedPort);
    }
    if (ip.type == this.IPTypes.OPEN)
      substream_level++;
    else if (ip.type == this.IPTypes.CLOSE)
      substream_level--;

    selectedPort.send(ip);
  }
};
