var fbp = require('../src');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var gendata = network.defProc('/components/gendata.js', 'Gen');
var copier = network.defProc('./components/copier.js', 'Copy');
var disc = network.defProc('./components/discard.js', 'Disc');
// var recvr = fbp.defProc(require('../components/recvr.js'), 'recvr'); // equivalent

network.initialize(gendata, 'COUNT', '100000000');
network.connect(gendata, 'OUT', copier, 'IN', 5);
network.connect(copier, 'OUT', disc, 'IN', 5);

// --- run ---

network.run({trace: false});
