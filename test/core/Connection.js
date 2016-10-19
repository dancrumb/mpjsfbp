/**
 * Created by danrumney on 5/27/16.
 */

var Connection = require('../../src/core/Connection');
var IP  = require ('../../src/core/IP');


describe.skip('Connection', function() {
  it('fires an ipAvailable event when an IP becomes available', function (done) {
    var spy = sinon.spy();
    var conn = new Connection(1);
    conn.on('ipAvailable', spy);

    var ip = new IP('TEST');
    conn.putIP(ip, () => {
      expect(spy).to.have.beenCalledOnce;
      done();
    });
  });

  it('fires an ipAccepted event when an IP has been accepted', function (done) {
    var spy = sinon.spy();
    var conn = new Connection(1);
    conn.on('ipAccepted', spy);

    var ip = new IP('TEST');
    conn.putIP(ip, () => {
      expect(spy).to.have.beenCalledOnce;
      done();
    });
  });

  it('does not accept an IP when it is over capacity until room is made', function (done) {
    var ipAcceptedSpy = sinon.spy();
    var conn = new Connection(1);
    conn.on('ipAccepted', ipAcceptedSpy);

    var ip = new IP('TEST');
    conn.putIP(ip, () => {
      expect(ipAcceptedSpy).to.have.been.calledOnce;
      ip = new IP('TEST');
      conn.putIP(ip, () => process.nextTick(done));

      process.nextTick(() => {
        expect(ipAcceptedSpy).to.have.been.calledOnce;
        conn.getIP(() => {
          expect(ipAcceptedSpy).to.have.been.calledTwice;
        });
        }
      );
    });
  });

  it('fires connectionClosed when the Connection is closed and there is data', (done) => {
    var connectionClosedSpy = sinon.spy();
    var conn = new Connection(1);
    conn.on('connectionClosed', connectionClosedSpy);

    expect(conn.isOpen()).to.be.true;
    conn.close();
    expect(conn.isOpen()).to.be.false;

    process.nextTick(() => {
      expect(connectionClosedSpy).to.have.been.calledOnce;
      done();
    })
  });

  it('fires connectionCompleted when the Connection is closed and there is no data', (done) => {
    var connectionCompletedSpy = sinon.spy();
    var conn = new Connection(1);
    conn.on('connectionCompleted', connectionCompletedSpy);

    conn.close();

    process.nextTick(() => {
      expect(connectionCompletedSpy).to.have.been.calledOnce;
      done();
    })
  });

  it('does not fire connectionCompleted when the connection is closed and contains data until data is drained', (done) => {
    var connectionCompletedSpy = sinon.spy();
    var connectionClosedSpy = sinon.spy();

    var conn = new Connection(1);
    conn.on('connectionClosed', connectionClosedSpy);
    conn.on('connectionCompleted', connectionCompletedSpy);

    var ip = new IP('TEST');
    conn.putIP(ip, () => {
      conn.close();

      process.nextTick(() => {
        expect(connectionClosedSpy).to.have.been.calledOnce;
        expect(connectionCompletedSpy).not.to.have.been.called;
        conn.getIP(() => {
          expect(connectionClosedSpy).to.have.been.calledOnce;
          expect(connectionCompletedSpy).to.have.been.calledOnce;
          done();
        });
      });
    })
  });

  it('can be purged of data', (done) => {
    var spy = sinon.spy();
    var conn = new Connection(1);
    conn.on('ipAvailable', spy);

    var ip = new IP('TEST');
    conn.putIP(ip, () => {
      expect(conn.pendingIPCount()).to.equal(1);
      expect(conn.hasData()).to.be.true;
      conn.purgeData();
      expect(conn.pendingIPCount()).to.equal(0);
      expect(conn.hasData()).to.be.false;
      done();
    });
  });

  it('returns null when an IP is request from a closed Connection', () => {

  });
});
