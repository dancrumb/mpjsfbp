var fbp = require('../src');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var gendata = network.defProc('/components/gendata', 'Gen');
var copier = network.defProc('/components/copier_nonlooper', 'CNL');
var recvr = network.defProc('./components/recvr', 'Recvr');

network.initialize(gendata, 'COUNT', '200');
network.connect(gendata, 'OUT', copier, 'IN', 10);
network.connect(copier, 'OUT', recvr, 'IN', 5);

// --- run ---

network.run({trace: false});
