import {
  Enum
} from 'enumify';

class FBPProcessMessageType extends Enum {}


FBPProcessMessageType.initEnum([
  'IP_AVAILABLE',
  'IP_ACCEPTED',

  'IP_REQUESTED',
  'IP_INBOUND',
  'EOS_INBOUND',

  'INITIALIZE',
  'INITIALIZATION_COMPLETE',

  'ACTIVATION_REQUEST',
  'COMPONENT_COMPLETE',

  'ASYNC_CALLBACK',
  'CALLBACK_COMPLETE',

  'CONNECTION_DEPTH_REQUEST',
  'CONNECTION_DEPTH',

  'COMMENCE',
  'PORT_CLOSURE',
  'PROCESS_COMPLETING',
  'SHUTDOWN_PROCESS',

  'ERROR'
]);

export default FBPProcessMessageType;
