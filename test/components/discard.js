import discard from '../../src/components/discard';

describe('discard', () => {
  it('should discard a single IP', () => {
    const scaffold = new ComponentScaffold({
        inports: {
          IN: [1, 2, 3, 4]
        },
        outports: {
          OUT: []
        },
        droppedIPs: [1, 2, 3, 4]
      }
    );

    scaffold.run(discard);

    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.runTests(it);
  });
});
