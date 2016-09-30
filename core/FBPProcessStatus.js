var Enum = require('./Enum');

module.exports = Enum([
  'NOT_INITIALIZED',
  'INITIALIZED',
  'ACTIVE',
  'WAITING_TO_RECEIVE',
  'WAITING_TO_SEND',
  'DORMANT',
  'CLOSED',
  'DONE'
]);
