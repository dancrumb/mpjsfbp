var fbp = require('../src')
  , path = require('path');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var reader = network.defProc('./components/reader', 'Read');
var reverse = network.defProc('./components/reverse', 'Rev');
var reverse2 = network.defProc('./components/reverse', 'Rev2');
var recvr = network.defProc('./components/recvr', 'Recvr');

network.initialize(reader, 'FILE', path.resolve(__dirname, 'data/text.txt'));
network.connect(reader, 'OUT', reverse, 'IN', 5);
network.connect(reverse, 'OUT', reverse2, 'IN', 5);
network.connect(reverse2, 'OUT', recvr, 'IN', 1);

// --- run ---

network.run({trace: true});
