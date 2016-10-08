export default constants => {
  const _map = {};
  const enumTable = {
    __lookup(constantValue) {
      return _map[constantValue] || null;
    }
  };

  let counter = 1;
  constants.forEach(name => {
    if (name === '__lookup') {
      throw 'You must not specify a enum constant named "__lookup"! This name is reserved for the lookup function.';
    }
    enumTable[name] = counter;
    _map[counter] = name;
    counter++;
  });

  return Object.freeze(enumTable);
};
