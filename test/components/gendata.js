import gendata from '../../src/components/gendata';

describe('gendata', () => {
  it('generates incrementing IPs according to the IN port', () => {
    const scaffold = new ComponentScaffold({
        inports: {
          'IN': [9]
        },
        outports: {
          OUT: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        },
        droppedIPs: [9]
      }
    );

    scaffold.run(gendata);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.runTests(it);
  });
});
