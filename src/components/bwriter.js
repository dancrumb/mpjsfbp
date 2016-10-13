"use strict";
/**
 * This component writes a binary file based on IPs that it receives.
 * The IPs are written out as the IPs come in, so the writing goes in pace with data flowing in.
 * This should make things a lot faster (and less memory hungry) for large files.
 * File name is given by the FILE inport
 */

var fs = require('fs');
var _ioHelper = require('./_ioHelper');

var WRITE_SIZE = 4;

module.exports = function reader(runtime) {
  var chunkSize = _ioHelper.getChunkSize.call(this, WRITE_SIZE);

  var filePort = this.openInputPort('FILE');
  var ip = filePort.receive();
  var fname = ip.contents;
  this.dropIP(ip);

  console.log("Opening file: " + fname);
  var openResult = this.runAsyncCallback(_ioHelper.openFile(fname, 'w', this));

  var fileDescriptor = openResult[1];
  if (fileDescriptor == undefined) {
    console.log("OPEN error: " + openResult);
    return;
  }
  console.log("Got fd: " + fileDescriptor);

  var inPort = this.openInputPort('IN');
  console.log("Starting write");
  var bracket = inPort.receive();
  if (bracket.type != this.IPTypes.OPEN) {
    console.log("ERROR: Received non-OPEN bracket");
    console.log(bracket);
    return;
  }
  this.dropIP(bracket);

  writeFile.call(this, fileDescriptor, inPort, chunkSize);

  fs.closeSync(fileDescriptor);
};

function writeFile(fileDescriptor, inPort, size) {
  var buffer = new Buffer(size);
  var byteCount = 0;
  do {
    var inIP = inPort.receive();
    if (inIP.type == this.IPTypes.NORMAL) {
      buffer.writeUInt8(inIP.contents, byteCount);
      byteCount++;
      if (byteCount === size) {
        var success = writeBuffer.call(this, fileDescriptor, buffer, byteCount);
        if (!success) {
          return;
        }
        byteCount = 0;
      }
    }
    this.dropIP(inIP);
  } while (inIP.type != this.IPTypes.CLOSE);
  if (byteCount > 0) {
    writeBuffer.call(this, fileDescriptor, buffer, byteCount);
  }
}


function writeBuffer(fileDescriptor, writeBuffer, byteCount) {
  var writeResult = this.runAsyncCallback(writeData(fileDescriptor, writeBuffer, byteCount));
  if (writeResult[0]) {
    console.error(writeResult[0]);
    return false;
  }
  if (writeResult[1] !== byteCount) {
    console.error("Insufficient data written!");
    return false;
  }

  return true;
}

function writeData(fd, writeBuffer, count) {
  return function (done) {
    fs.write(fd, writeBuffer, 0, count, null, function (err, written) {
      done([err, written]);
    });
  }
}
