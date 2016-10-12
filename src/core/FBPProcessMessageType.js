import {
  Enum
} from 'enumify';

class FBPProcessMessageType extends Enum {}


FBPProcessMessageType.initEnum([
  'IP_ACCEPTED',
  'IP_INBOUND',
  'EOS_INBOUND',
  'INITIALIZE',
  'INITIALIZATION_COMPLETE',
  'COMPONENT_COMPLETE',
  'IP_REQUESTED',
  'IP_AVAILABLE',
  'ACTIVATION_REQUEST',
  'COMMENCE',
  'PORT_CLOSURE',
  'PROCESS_COMPLETING',
  'SHUTDOWN_PROCESS',
  'ERROR'
]);

export default FBPProcessMessageType;
