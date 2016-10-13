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
  'WAITING_FOR_CALLBACK',
  'DORMANT',
  'CLOSED',
  'DONE'
]);

export default FBPProcessStatus;
