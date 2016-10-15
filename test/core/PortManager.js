/**
 * Created by danrumney on 5/27/16.
 */

var PortManager = require('../../src/core/PortManager');

var makeMockPort = (name) => { return {portName: name, open: function(){} }};

describe('PortManager', function() {

  it('provides access to input ports', function() {
    var pm = new PortManager({
      inports: { 'IN' : makeMockPort('IN') }
    });

    var port = pm.openInputPort('IN');
    expect(port).to.be.ok;

    pm = new PortManager({
      outports: { 'IN' : makeMockPort('IN')  }
    });

    port = pm.openInputPort('IN');
    expect(port).not.to.be.ok;
  });

  it('provides access to output ports', function() {
    var pm = new PortManager( {
      outports: { 'OUT' : makeMockPort('OUT')}
    });

    var port = pm.openOutputPort('OUT');
    expect(port).to.be.ok;

    pm = new PortManager( {
      inports: { 'OUT' : makeMockPort('OUT') }
    });

    port = pm.openOutputPort('OUT');
    expect(port).not.to.be.ok;

  });

  it('provides access to input port arrays', function() {
    var pm = new PortManager( {
      inports: {
        'IN[0]' : makeMockPort('IN[0]') ,
        'IN[1]' :  makeMockPort('IN[1]') ,
        'IN[2]' :  makeMockPort('IN[2]')
      }
    });

    var port = pm.openInputPortArray('IN');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager('PROCESS', {
      outports: {
        'IN[0]' : makeMockPort('IN[0]'),
        'IN[1]' : makeMockPort('IN[1]'),
        'IN[2]' : makeMockPort('IN[2]')
      }
    });

    port = pm.openInputPortArray('IN');
    expect(port).not.to.be.ok;

  });

  it('provides access to output port arrays', function() {
    var pm = new PortManager( {
      outports: {
        'OUT[1]' : makeMockPort('OUT[1]'),
        'OUT[0]' : makeMockPort('OUT[0]'),
        'OUT[2]' : makeMockPort('OUT[2]')
      }
    });

    var port = pm.openOutputPortArray('OUT');
    expect(port).to.be.ok;
    expect(port).to.have.length(3);

    pm = new PortManager( {
      inports: {
        'OUT[0]' : makeMockPort('OUT[0]' ),
        'OUT[1]' : makeMockPort('OUT[1]' ),
        'OUT[2]' : makeMockPort('OUT[2]' )
      }
    });

    port = pm.openOutputPortArray('OUT');
    expect(port).not.to.be.ok;
  });

  it('allows you to add input ports', function () {
    var pm = new PortManager();
    pm.addInputPort(makeMockPort('IN'));
    pm.addOutputPort(makeMockPort('OUT'));
    expect(pm.openInputPort('IN')).to.be.ok;
    expect(pm.openInputPort('OUT')).to.not.be.ok;
  });

  it('allows you to add output ports', function () {
    var pm = new PortManager('PROCESS');
    pm.addInputPort(makeMockPort('IN'));
    pm.addOutputPort(makeMockPort('OUT'));
    expect(pm.openOutputPort('IN')).to.not.be.ok;
    expect(pm.openOutputPort('OUT')).to.be.ok;
  });
});
