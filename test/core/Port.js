/**
 * Created by danrumney on 5/27/16.
 */

import Port  from '../../src/core/Port';


describe('Port', function() {


  it('can be instantiated without a componentProvider', function() {
    var port = new Port(null, 'PORT');
    expect(port.name).to.be.equal('PORT');
  });

  it('can be instantiated with a componentProvider', function() {
    var componentMock = { name: "COMP" };
    var port = new Port(componentMock, "PORT");

    expect(port.processName).to.be.equal("COMP");
    expect(port.name).to.be.equal("PORT");
    expect(port.component).to.deep.equal(componentMock);
  });

  it('is open on creation', () => {
    var port = new Port(null, 'PORT');
    expect(port.isOpen()).to.be.true;
  });

  it('fires a portClosed event when closed', (done) => {
    var port = new Port(null, 'PORT');
    var portClosedSpy = sinon.spy();

    port.on('portClosed', portClosedSpy);
    port.close();
    expect(port.isOpen()).to.be.false;

    process.nextTick(() => {
      expect(portClosedSpy).to.have.been.calledOnce;
      port.close();
      process.nextTick(() => {
        expect(portClosedSpy).to.have.been.calledOnce;
        done();
      });
    });
  })
});
