/**
 * This component reads a file and sends one IP per byte of the file to OUT
 * The IPs are streamed out as the file is read, so the network can start flowing as soon as reading begins.
 * This should make things a lot faster (and less memory hungry) for large files.
 * File name is given by the FILE inport
 */

import fs from 'fs';

import _ioHelper from './_ioHelper';

const READ_SIZE = 4;

export default function reader(runtime) {
  const chunkSize = _ioHelper.getChunkSize.call(this, READ_SIZE);

  const inport = this.openInputPort('FILE');
  const ip = inport.receive();
  const fname = ip.contents;
  this.dropIP(ip);

  console.log(`Opening file: ${fname}`);
  const openResult = runtime.runAsyncCallback(_ioHelper.openFile(fname, 'r', this));

  const fileDescriptor = openResult[1];
  if (fileDescriptor == undefined) {
    console.log(`OPEN error: ${openResult}`);
    return;
  }
  console.log(`Got fd: ${fileDescriptor}`);

  const outport = this.openOutputPort('OUT');
  console.log("Starting read");
  outport.send(this.createIPBracket(this.IPTypes.OPEN));
  readFile(runtime, this, fileDescriptor, outport, chunkSize);

  fs.closeSync(fileDescriptor);
  outport.send(this.createIPBracket(this.IPTypes.CLOSE));

};

function readFile(runtime, proc, fileDescriptor, outport, chunkSize) {
  do {
    const readResult = runtime.runAsyncCallback(readData(fileDescriptor, chunkSize));
    if (readResult[0]) {
      console.error(readResult[0]);
      return;
    }
    var bytesRead = readResult[1];
    const data = readResult[2];

    for (let i = 0; i < bytesRead; i++) {
      const byte = data[i];
      console.log(`Got byte: ${byte}`);
      outport.send(proc.createIP(byte));
    }
  } while (bytesRead === chunkSize);
}

function readData(fd, size) {
  return done => {
    fs.read(fd, new Buffer(size), 0, size, null, (err, bytesRead, buffer) => {
      done([err, bytesRead, buffer]);
    });
  }
}
