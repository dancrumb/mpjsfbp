import {
  Enum
} from 'enumify';

class FBPProcessStatus extends Enum {}

FBPProcessStatus.initEnum([
  'NOT_INITIALIZED',
  'INITIALIZED',
  'ACTIVE',
  'WAITING_TO_RECEIVE',
  'WAITING_TO_SEND',
  'DORMANT',
  'CLOSED',
  'DONE'
]);

export default FBPProcessStatus;
