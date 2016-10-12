import randdelay from '../../src/components/randdelay';

describe('randdelay', () => {
  it('should randomly delay a single IP', function (done) {
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
    scaffold.run(randdelay, () => {
      scaffold.verifyOutputs(expect);
      scaffold.verifyDroppedIPs(expect);
      scaffold.runTests(it);

      const diffTime = Date.now() - startTime;
      expect(Math.abs(diffTime - DELAY)).to.be.below(DELAY);

      done();
    });
  });

  it('should randomly delay multiple IPs', function (done) {
    const DELAY = 500;
    const DELAY_MAX_DIFF = 300;
    const DELAY_TOTAL = DELAY * 5;
    this.timeout(DELAY_TOTAL + DELAY_MAX_DIFF);

    const scaffold = new ComponentScaffold({
        iips: {
          'INTVL': DELAY
        },
        inports: {
          IN: [ 1, 2, 3, 4, 5 ]
        },
        outports: {
          OUT: [ 1, 2, 3, 4, 5 ]
        },
        droppedIPs: [DELAY]
      }
    );


    const startTime = Date.now();
    scaffold.run(randdelay, () => {
      scaffold.verifyOutputs(expect);
      scaffold.verifyDroppedIPs(expect);
      scaffold.runTests(it);

      const diffTime = Date.now() - startTime;
      expect(Math.abs(diffTime - DELAY_TOTAL)).to.be.below(DELAY_TOTAL);

      done();
    });
  });
});
