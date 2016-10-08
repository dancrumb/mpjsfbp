'use strict';

var display = require('../../lib/components/display');

describe('display', function () {
  it('displays any incoming IPs', function () {
    var scaffold = new ComponentScaffold({
        inports: {
          'IN': [1, 2, 3, 4, 5, 6]
        },
        outports: {

        },
        droppedIPs: [1, 2, 3, 4, 5, 6]
      }
    );

    scaffold.run(display);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.ensureAllIPsAccountedFor(expect);
    scaffold.runTests(it);
  });
  it('displays and forwards any incoming IPs', function () {
    var scaffold = new ComponentScaffold({
        inports: {
          'IN': [1, 2, 3, 4, 5, 6]
        },
        outports: {
          'OUT': [1, 2, 3, 4, 5, 6]
        },
        droppedIPs: []
      }
    );

    scaffold.run(display);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.ensureAllIPsAccountedFor(expect);
    scaffold.runTests(it);
  });
});
