var fbp = require('../src')
  , path = require('path');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var gendata = network.defProc('/components/gendata.js', 'Gen');
var reader = network.defProc('./components/reader.js', 'Read');
var copier = network.defProc('./components/copier.js', 'Copy');
var recvr = network.defProc('./components/recvr.js', 'Recvr');

network.initialize(gendata, 'COUNT', '20');
network.connect(gendata, 'OUT', copier, 'IN', 5);
network.initialize(reader, 'FILE', path.resolve(__dirname, 'data/text.txt'));
network.connect(reader, 'OUT', copier, 'IN', 5);
network.connect(copier, 'OUT', recvr, 'IN', 5);

// --- run ---

network.run({trace: false});
