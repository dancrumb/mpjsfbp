/**
 * Created by danrumney on 5/27/16.
 */

var PortManager = require('../../core/PortManager');


describe('PortManager', function() {

  it('provides access to input ports', function() {
    var pm = new PortManager('PROCESS', {
      inports: {
        'IN' : {}
      }
    });

    var port = pm.openInputPort('IN');
    expect(port).to.be.ok;

    pm = new PortManager('PROCESS', {
      outports: {
        'IN' : {}
      }
    });

    port = pm.openInputPort('IN');
    expect(port).not.to.be.ok;

  });

  it('provides access to output ports', function() {
    var pm = new PortManager('PROCESS', {
      outports: {
        'OUT' : {}
      }
    });

    var port = pm.openOutputPort('OUT');
    expect(port).to.be.ok;

    pm = new PortManager('PROCESS', {
      inports: {
        'OUT' : {}
      }
    });

    port = pm.openOutputPort('OUT');
    expect(port).not.to.be.ok;

  });

  it('provides access to input port arrays', function() {
    var pm = new PortManager('PROCESS', {
      inports: {
        'IN[0]' : {},
        'IN[1]' : {},
        'IN[2]' : {}
      }
    });

    var port = pm.openInputPortArray('IN');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager('PROCESS', {
      outports: {
        'IN[0]' : {},
        'IN[1]' : {},
        'IN[2]' : {}
      }
    });

    port = pm.openInputPortArray('IN');
    expect(port).not.to.be.ok;

  });

  it('provides access to output ports', function() {
    var pm = new PortManager('PROCESS', {
      outports: {
        'OUT[0]' : {},
        'OUT[1]' : {},
        'OUT[2]' : {}
      }
    });

    var port = pm.openOutputPortArray('OUT');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager('PROCESS', {
      inports: {
        'OUT[0]' : {},
        'OUT[1]' : {},
        'OUT[2]' : {}
      }
    });

    port = pm.openOutputPortArray('OUT');
    expect(port).not.to.be.ok;

  });

});
