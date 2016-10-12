import concat from '../../src/components/concat';

describe('concat', () => {
  it('concatenates all incoming IPs to a single output port', () => {
    const scaffold = new ComponentScaffold({
        inports: {
          'IN[0]': [1, 2, 3],
          'IN[1]': [4, 5, 6]
        },
        outports: {
          OUT: [1, 2, 3, 4, 5, 6]
        },
        droppedIPs: []
      }
    );

    scaffold.run(concat);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.ensureAllIPsAccountedFor(expect);
    scaffold.runTests(it);
  });
});
