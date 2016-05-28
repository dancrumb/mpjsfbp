'use strict';

var chai = require('chai');
var IP = require('../core/IP');
var Fiber = require('fibers');
var Process = require('../core/Process');

global.expect = chai.expect;

global.MockSender = function (inputArray) {
  return function () {
    var outport = this.openOutputPort('OUT');
    var proc = this;
    inputArray.forEach(function (item) {
      outport.send(proc.createIP(item));
    });
  };
};

global.MockReceiver = function (outputArray) {
  return function () {
    var inport = this.openInputPort('IN');
    var ip;
    while ((ip = inport.receive()) !== null) {
      if (ip.type === IP.NORMAL) {
        outputArray.push(ip.contents);
      }
      this.dropIP(ip);
    }
  };
};

global.TestFiber = function(action) {
  Fiber(function() {
    var mockProcess = new Process("test", function() {console.log("Test Process");});

    Fiber.current.fbpProc = mockProcess;
    action(mockProcess);
  }).run();
};
