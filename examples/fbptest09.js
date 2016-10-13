var fbp = require('../src');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var gendata = network.defProc('/components/gendata', 'Gen');
var copier = network.defProc('/components/copier_closing', 'CC');
var recvr = network.defProc('./components/recvr', 'Recvr');

network.initialize(gendata, 'COUNT', '200');
network.connect(gendata, 'OUT', copier, 'IN', 5);
network.connect(copier, 'OUT', recvr, 'IN', 1);

// --- run ---

network.run({trace: false});
