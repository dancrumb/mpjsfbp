import fs from 'fs';

function makeFBPFSCallback(fsFunction, path, flags) {
  return done => {
    fs[fsFunction].call(fs, path, flags, (err, result) => {
      done([err, result]);
    });
  }
}

export default {
  getChunkSize(defaultSize) {
    let size = defaultSize || 1;
    const sizePort = this.openInputPort('SIZE');
    if (sizePort) {
      const sizeIP = sizePort.receive();
      if (sizeIP) {
        size = parseInt(sizeIP.contents, 10);
      }
      this.dropIP(sizeIP);
    }
    return size;
  },

  openFile(path, flags) {
    return makeFBPFSCallback('open', path, flags);
  },

  readFile(path, flags) {
    return makeFBPFSCallback('readFile', path, flags);
  }
};
