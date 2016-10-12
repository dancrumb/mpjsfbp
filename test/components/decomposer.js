import decomposer from '../../src/components/decomposer';

describe('decomposer', () => {
  it('generates multiple IPs from a single IIP containing an array of values', () => {
    const scaffold = new ComponentScaffold({
        inports: {
          IN: ["[1, 2, 3, 4, 5]"]
        },
        outports: {
          OUT: [1, 2, 3, 4, 5]
        },
        droppedIPs: ["[1, 2, 3, 4, 5]"]
      }
    );

    scaffold.run(decomposer);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.runTests(it);
  });

  it('generates no IPs from a single IIP containing an empty array', () => {
    const scaffold = new ComponentScaffold({
        inports: {
          IN: ["[]"]
        },
        outports: {
          OUT: []
        },
        droppedIPs: ["[]"]
      }
    );

    scaffold.run(decomposer);
    scaffold.verifyOutputs(expect);
    scaffold.verifyDroppedIPs(expect);
    scaffold.runTests(it);
  });
});
