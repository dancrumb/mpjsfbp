'use strict';
var copier = require('../../lib/components/copier');

describe('copier', function () {
  it('should copy multiple IPs', function () {
    var scaffold = new ComponentScaffold({
        inports: {
          IN: [1, 2, 3, 4, 5]
        },
        outports: {
          OUT: [1, 2, 3, 4, 5]
        },
        droppedIPs: []
      }
    );

    scaffold.run(copier);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.runTests(it);
  });
});
