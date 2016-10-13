/**
 * Created by danrumney on 5/27/16.
 */

import ProcessConnection from '../../src/core/ProcessConnection';
import IP from '../../src/core/IP';

function getFakeProcess()  {
  class FakeProcess {
    constructor() {}
    addDownstreamConnection(process) {
      this.downstreamConnection = process;
    }
    addUpstreamConnection(process) {
      this.upstreamConnection = process;
    }
  }

  var fakeProcess = new FakeProcess();
  return fakeProcess;
}

describe('ProcessConnection', function() {
  it('does nothing new', ()  => {
    var fakeUpProc = getFakeProcess();
    var fakeDownProc = getFakeProcess();

    var upAdder = sinon.spy(fakeDownProc, 'addUpstreamConnection');
    var downAdder = sinon.spy(fakeUpProc, 'addDownstreamConnection');

    var pConn = new ProcessConnection();
    pConn.connectProcesses(fakeUpProc, "UP", fakeDownProc, "DOWN");

    expect(upAdder).to.have.been.calledOnce;
    expect(downAdder).to.have.been.calledOnce;

  });
});
