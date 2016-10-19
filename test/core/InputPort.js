/**
 * Created by danrumney on 5/27/16.
 */

import InputPort  from '../../src/core/InputPort';


describe.skip('InputPort', function() {

  it('automatically adds itself to a componentProvider on instantiation', () => {
    var fakeComponent = {
      addInputPort(port) {}
    };
    var componentProviderSpy = sinon.spy(fakeComponent, 'addInputPort');

    var inputPort = new InputPort(fakeComponent, 'PORT')

    expect(componentProviderSpy).to.have.been.calledWith(inputPort);
  });

  it('returns null when closed', () => {
    var inputPort = new InputPort(null, 'PORT');
    inputPort.close();
    var ip = inputPort.receive();

    expect(ip).to.be.null;
  });

  it('returns an IP when receive is called', () => {
    var fakeIP = {};
    var fakeComponent = {
      addInputPort(port) {},
      awaitResponse() {
        return fakeIP;
      }
    };

    var inputPort = new InputPort(fakeComponent, 'PORT');
    var ip = inputPort.receive();

    expect(ip).to.be.equal(fakeIP);
  });

});
