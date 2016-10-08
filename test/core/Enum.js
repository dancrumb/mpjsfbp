var Enum = require('../../lib/core/Enum');

describe('Enum', function () {
  it('should create an enum and provide a lookup function', function () {
    var myEnum = Enum(['a', 'b', 'c']);
    expect(myEnum).to.have.ownProperty('a')
      .and.to.have.ownProperty('b')
      .and.to.have.ownProperty('c');
    expect(myEnum.__lookup(myEnum.a)).to.equal('a');
    expect(myEnum.__lookup(myEnum.b)).to.equal('b');
    expect(myEnum.__lookup(myEnum.c)).to.equal('c');
  });

  it('should not be writable', function () {
    var myEnum = Enum(['a']);

    var prevValue = myEnum.a;
    expect(() => myEnum.a = -1 ).to.throw(Error);

    var prevLookupFunction = myEnum.__lookup;
    expect(() => myEnum.__lookup = 100).to.throw(Error);
  });
});
