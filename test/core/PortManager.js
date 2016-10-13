/**
 * Created by danrumney on 5/27/16.
 */

var PortManager = require('../../src/core/PortManager');


describe('PortManager', function() {

  it('provides access to input ports', function() {
    var pm = new PortManager({
      inports: { 'IN' : { portName: 'IN' } }
    });

    var port = pm.openInputPort('IN');
    expect(port).to.be.ok;

    pm = new PortManager({
      outports: { 'IN' : { portName: 'IN' } }
    });

    port = pm.openInputPort('IN');
    expect(port).not.to.be.ok;
  });

  it('provides access to output ports', function() {
    var pm = new PortManager( {
      outports: { 'OUT' : { portName: 'OUT' } }
    });

    var port = pm.openOutputPort('OUT');
    expect(port).to.be.ok;

    pm = new PortManager( {
      inports: { 'OUT' : { portName: 'OUT' } }
    });

    port = pm.openOutputPort('OUT');
    expect(port).not.to.be.ok;

  });

  it('provides access to input port arrays', function() {
    var pm = new PortManager( {
      inports: {
        'IN[0]' : { portName: 'IN[0]' },
        'IN[1]' : { portName: 'IN[1]' },
        'IN[2]' : { portName: 'IN[2]' }
      }
    });

    var port = pm.openInputPortArray('IN');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager('PROCESS', {
      outports: {
        'IN[0]' : { portName: 'IN[0]' },
        'IN[1]' : { portName: 'IN[1]' },
        'IN[2]' : { portName: 'IN[2]' }
      }
    });

    port = pm.openInputPortArray('IN');
    expect(port).not.to.be.ok;

  });

  it('provides access to output port arrays', function() {
    var pm = new PortManager( {
      outports: {
        'OUT[0]' : { portName: 'OUT[0]' },
        'OUT[1]' : { portName: 'OUT[1]' },
        'OUT[2]' : { portName: 'OUT[2]' }
      }
    });

    var port = pm.openOutputPortArray('OUT');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager( {
      inports: {
        'OUT[0]' : { portName: 'OUT[0]' },
        'OUT[1]' : { portName: 'OUT[1]' },
        'OUT[2]' : { portName: 'OUT[2]' }
      }
    });

    port = pm.openOutputPortArray('OUT');
    expect(port).not.to.be.ok;
  });

  it('allows you to add input ports', function () {
    var pm = new PortManager();
    pm.addInputPort({portName : 'IN'});
    pm.addOutputPort({portName : 'OUT'});
    expect(pm.openInputPort('IN')).to.be.ok;
    expect(pm.openInputPort('OUT')).to.not.be.ok;
  });

  it('allows you to add output ports', function () {
    var pm = new PortManager('PROCESS');
    pm.addInputPort({portName : 'IN'});
    pm.addOutputPort({portName : 'OUT'});
    expect(pm.openOutputPort('IN')).to.not.be.ok;
    expect(pm.openOutputPort('OUT')).to.be.ok;
  });
});
