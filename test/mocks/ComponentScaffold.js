import _ from 'lodash';
import IP from '../../src/core/IP';
import sync from 'synchronize';
import PortScaffold from './PortScaffold';
import RuntimeScaffold from './RuntimeScaffold';

class ComponentScaffold {
  constructor(options) {
    if(typeof options !== 'object') {
      throw new Error('ComponentScaffold needs port information and (optionally) tests.');
    }
    this.inports = _.reduce(options.inports, (inports, buffer, portname) => {
      inports[portname] = new PortScaffold({
        name: portname,
        type: "IN",
        buffer: ComponentScaffold.makeIPs(buffer)
      });

      return inports;
    }, {});

    this.inports = _.reduce(options.iips, (inports, buffer, portname) => {
      inports[portname] = new PortScaffold({
        name: portname,
        type: "IIP",
        buffer: ComponentScaffold.makeIPs([buffer])
      });

      return inports;
    }, this.inports);

    this.outports = _.reduce(options.outports, (outports, expectation, portname) => {
      outports[portname] = {};

      outports[portname].port = new PortScaffold({
        name: portname,
        type: "OUT",
        buffer: []
      });
      outports[portname].expected = ComponentScaffold.makeIPs(expectation);

      return outports;
    }, {});

    this.droppedIPs = {
      expected: ComponentScaffold.makeIPs(options.droppedIPs || []),
      actual: []
    };

    this.tests = options.tests || [];
  }

  openInputPortArray(portName) {
    const re = new RegExp(`${portName}\\[\\d+\\]`);

    const inports = this.inports;
    return Object.keys(inports)
      .filter(portName => re.test(portName))
      .sort()
      .map(portName => inports[portName]);
  }

  openInputPort(portName) {
    const inport = this.inports[portName];
    if(!inport) {
      console.error(`Request for non-existent port: ${portName}`);
    }
    return inport;
  }

  openOutputPortArray(portName) {
    const re = new RegExp(`${portName}\\[\\d+\\]`);

    const outports = this.outports;
    return Object.keys(outports)
      .filter(portName => re.test(portName))
      .sort()
      .map(portName => outports[portName].port);
  }

  openOutputPort(portName, optional) {
    const outport = this.outports[portName];
    if(!outport) {
      if(optional !== 'OPTIONAL') {
        console.error(`Request for non-existent port: ${portName}`);
      }
      return null;
    }
    return outport.port;
  }

  dropIP(ip) {
    this.droppedIPs.actual.push(ip);
  }

  static makeIPs(values) {
    return values.map(val => {
      if(val instanceof IP) {
        return val
      } else {
        return new IP(val);
      }
    });
  }

  static openIP() {
    const ip = new IP();
    ip.type = IP.Types.OPEN;
    return ip;
  }

  static closeIP() {
    const ip = new IP();
    ip.type = IP.Types.CLOSE;
    return ip;
  }

  run(component, cb) {
    const runtime = new RuntimeScaffold();
    const mockProcess = {
      dropIP: this.dropIP.bind(this),
      openInputPort: this.openInputPort.bind(this),
      openInputPortArray: this.openInputPortArray.bind(this),
      openOutputPort: this.openOutputPort.bind(this),
      openOutputPortArray: this.openOutputPortArray.bind(this),
      IPTypes: IP.Types,
      createIPBracket(type) {
        const ip = new IP();
        ip.type = type;
        return ip;
      },
      createIP(value) {
        return new IP(value);
      }
    };
    if(cb) {
      sync.fiber(() => {
        component.call(mockProcess, runtime);
        cb();
      })
    } else {
      component.call(mockProcess, runtime);
    }
  }

  verifyOutputs(expect) {
    _.forEach(this.outports, portInfo => {
      expect(portInfo.expected.length).to.be.equal(portInfo.port.getBuffer().length);
      _.forEach(_.zip(portInfo.expected, portInfo.port.getBuffer().actual), _.spread((exp, act) => {
        expect(exp).to.equalPropertiesOn(act);
      }));
    })
  }

  verifyDroppedIPs(expect) {
    expect(this.droppedIPs.expected.length).to.be.equal(this.droppedIPs.actual.length);
    _.forEach(_.zip(this.droppedIPs.expected, this.droppedIPs.actual), _.spread((exp, act) => {
      expect(exp).to.equalPropertiesOn(act);
    }));
  }

  runTests(it) {
    _.forEach(this.tests, (test, description) => {
      it(description, test);
    })
  }

  ensureAllIPsAccountedFor(expect) {
    const inIPs = _.reduce(this.inports, (ips, inport) => ips.concat(inport.buffer), []);
    const outIPs = _.reduce(this.outports, (ips, outport) => ips.concat(outport.expected), this.droppedIPs.expected);

    expect(outIPs.length).to.not.be.below(inIPs.length);
    expect(outIPs).to.include.deep.members(inIPs);

    console.log(inIPs);
    console.log(outIPs);
  }
}

export default ComponentScaffold;