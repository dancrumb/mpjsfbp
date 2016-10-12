import Network from '../../src/core/Network';
import fs from 'fs';

describe('Network', () => {
  it('can load FBP components from this module\'s core via path', () => {
    const network = new Network();
    const process = network.defineProcess('./components/copier.js', 'copier');

    expect(process.location).to.have.a.property('moduleLocation').and.to.contain('src/components/copier.js');
  });

  it('can load FBP components from this module\'s core via package/component', () => {
    const network = new Network();
    const process = network.defineProcess('jsfbp/copier', "copier");

    expect(process.location).to.have.a.property('moduleLocation').and.to.contain('/components/copier.js');
  });

  it('can load FBP components directly from modules', () => {
    const network = new Network();
    const process = network.defineProcess('dummy-module', "dummy");

    expect(process.location).to.have.a.property('moduleLocation').and.to.equal('dummy-module');
  });

  it('can load FBP components that are part of a larger package', () => {
    const network = new Network();
    const process = network.defineProcess('dummy-module/getP3', 'getP3');

    expect(process.location).to.have.a.property('moduleLocation').and.to.contain('dummy-module');
    expect(process.location).to.have.a.property('componentField').and.to.contain('getP3');
  });

  it('can be created from an FBP file', function (done) {
    this.timeout(3000);

    fs.readFile(`${__dirname}/network.fbp`, 'utf8', (err, graph) => {
      if (err) {
        return done(err);
      }

      const network = Network.createFromGraph(graph);
      expect(network.getProcessList()).to.have.members(['sender0', 'sender1', 'collate', 'receiver']);
      expect(network.getProcessConnections("sender0")).to.eql({
        "out": {
          "OUT": { "process": "collate", "port": "IN[0]", "capacity": 5 }
        },
        "in": {
          "IN": [ { "data": '["1,m1", "2,m2", "3,m3"]' } ]
        }
      });
      expect(network.getProcessConnections("sender1")).to.eql({
        "out": {
          "OUT": { "process": "collate", "port": "IN[1]", "capacity": 5 }
        },
        "in": {
          "IN": [ { "data": '["1,d11", "1,d12", "2,d21", "3,d31", "3,d32", "3,d33", "4,d41"]' } ]
        }
      });
      expect(network.getProcessConnections("collate")).to.eql({
        "out": {
          "OUT": { "process": "receiver", "port": "IN", "capacity": 10 }
        },
        "in": {
          "CTLFIELDS": [ { "data": "1" } ],
          "IN[0]": [ { "process": "sender0", "port": "OUT" } ],
          "IN[1]": [ { "process": "sender1", "port": "OUT" } ]
        }
      });
      expect(network.getProcessConnections("receiver")).to.eql({
        "out": {},
        "in": {
          "IN": [ { "process": "collate", "port": "OUT" } ]
        }
      });

      const receiverProcess = network.getProcessByName("receiver");
      expect(receiverProcess).to.be.ok;
      done();
    });
  });

  it('correctly identifies empty IIPs', () => {
    expect(() => {
      Network.createFromGraph("'' -> IN RECVR(jsfbp/recvr)");
    }).not.to.throw(Error);
  });

  it('correctly identifies duplicate process names', () => {
    const network = new Network();
    network.defineProcess('./components/copier.js', 'copier');
    expect(() => {
      network.defineProcess('./components/copier.js', 'copier');
    }).to.throw(Error);
  });

  it('requires Component to be given a name', () => {
    const network = new Network();
    expect(() => {
      network.defineProcess('./componenent/copier.js');
    }).to.throw(Error);
  });

  it('supports connection capacity', () => {
    let network = Network.createFromGraph("'2' -> IN GEN(jsfbp/gendata) OUT -> (100) IN RECVR(jsfbp/recvr)");
    expect(network._connections['GEN'].out['OUT'].capacity).to.equal(100);

    network = Network.createFromGraph("'2' -> IN GEN(jsfbp/gendata) OUT ->  IN RECVR(jsfbp/recvr)");
    expect(network._connections['GEN'].out['OUT'].capacity).to.equal(10);
  });

  it('supports connecting IIPs via strings', () => {
    const network = new Network();

    network.defineProcess('', 'foo');
    network.sinitialize('foo.bar', '[]');

    const connections = network.getProcessConnections('foo');
    expect(connections).to.be.ok;
    expect(connections).to.eql({
      "out": {},
      "in": {"bar": [{data: "[]"}]}
    });
    expect(network.getProcessPortNames('foo')).to.eql({ "out": [], "in": ["bar"]});
  });

  it('supports connecting Processes via strings', () => {
    const network = new Network();

    network.defineProcess('', 'foo');
    network.defineProcess('', 'bar');
    network.sconnect('foo.out', 'bar.in');

    let connections = network.getProcessConnections('bar');
    expect(connections).to.be.ok;
    expect(connections).to.eql({
      "out": {},
      "in": {"in": [{process: 'foo', port: 'out'}]}
    });
    expect(network.getProcessPortNames('bar')).to.eql({ "out": [], "in": ["in"]});

    connections = network.getProcessConnections('foo');
    expect(connections).to.be.ok;
    expect(connections).to.eql({
      "out": {"out": {process: 'bar', port: 'in', "capacity": 10}},
      "in": {}
    });
    expect(network.getProcessPortNames('foo')).to.eql({ "out": ["out"], "in": []});
  });
});
