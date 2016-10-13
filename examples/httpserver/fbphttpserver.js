var fbp = require('../..');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var receiver = network.defProc(require('../../components/httpserver'));
var myproc = network.defProc(require('./myproc'));
var send = network.defProc(require('./myresponse'));

network.initialize(receiver, 'PORTNO', '8080');
network.connect(receiver, 'OUT', myproc, 'IN', 6);
network.connect(myproc, 'OUT', send, 'IN', 6);

// --- run ---

network.run({trace: true});
