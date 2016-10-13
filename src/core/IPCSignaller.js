/**
 * Created by danrumney on 10/11/16.
 */
import {
  ChildProcess
} from 'child_process';
export default function (type, details) {
  var isFromProcessToComponent = (this.component && (this.component instanceof ChildProcess));

  var messageId = `${this.name}-${isFromProcessToComponent ? "P" : "C"}-${(new Date).getTime()}`;

  var sender = isFromProcessToComponent ? this.component : process;

  console.log(`{ "type": "signalSentFrom${isFromProcessToComponent ? 'Process': 'Component'}", "id": "${messageId}", "messageType": "${type.name}", "name": "${this.name}", "details": ${JSON.stringify(details) || "null"}}`);
  sender.send({
    type,
    id: messageId,
    details
  });
};
