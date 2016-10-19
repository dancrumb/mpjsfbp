/**
 * Created by danrumney on 10/11/16.
 */
import {
  ChildProcess
} from 'child_process';
export default function (type, details) {
  var isFromProcessToComponent = (this.component && (this.component instanceof ChildProcess));

  var messageId = ""; //`${this.name}-${isFromProcessToComponent ? "P" : "C"}-${(new Date).getTime()}-${Math.round(Math.random()*1000)}`;

  var sender = isFromProcessToComponent ? this.component : process;

  this.log.info({
    "type": "signalSentFrom" + (isFromProcessToComponent ? 'Process' : 'Component'),
    "id": messageId,
    "messageType": type.name,
    "name": this.name,
    "details": details
  });
  sender.send({
    type,
    id: messageId,
    details
  });
};
