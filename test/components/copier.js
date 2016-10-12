import copier from '../../src/components/copier';

describe('copier', () => {
  it('should copy multiple IPs', () => {
    const scaffold = new ComponentScaffold({
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
