import delay from '../../src/components/delay';

describe('delay', () => {
  it('should exactly delay a single IP', function (done) {
    const DELAY = 500;
    const DELAY_MAX_DIFF = 150;
    this.timeout(DELAY + DELAY_MAX_DIFF);


    const scaffold = new ComponentScaffold({
        iips: {
          'INTVL': DELAY
        },
        inports: {
          IN: [ 42 ]
        },
        outports: {
          OUT: [ 42 ]
        },
        droppedIPs: [DELAY]
      }
    );


    const startTime = Date.now();
    scaffold.run(delay, () => {
      scaffold.verifyOutputs(expect);
      scaffold.verifyDroppedIPs(expect);
      scaffold.runTests(it);

      const diffTime = Date.now() - startTime;
      expect(Math.abs(diffTime - DELAY)).to.be.below(DELAY_MAX_DIFF);

      done();
    });
  });

  it('should exactly delay multiple IPs', function (done) {
    const DELAY = 500;
    const DELAY_MAX_DIFF = 300;
    const TOTAL_DELAY = DELAY * 3;
    this.timeout(TOTAL_DELAY + DELAY_MAX_DIFF);

    const scaffold = new ComponentScaffold({
        iips: {
          'INTVL': DELAY
        },
        inports: {
          IN: [ 1, 2, 3 ]
        },
        outports: {
          OUT: [ 1, 2, 3 ]
        },
        droppedIPs: [DELAY]
      }
    );


    const startTime = Date.now();
    scaffold.run(delay, () => {
      scaffold.verifyOutputs(expect);
      scaffold.verifyDroppedIPs(expect);
      scaffold.runTests(it);

      const diffTime = Date.now() - startTime;
      expect(Math.abs(diffTime - TOTAL_DELAY)).to.be.below(DELAY_MAX_DIFF);

      done();
    });
  });
});
