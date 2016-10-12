var fbp = require('../src/');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

network.defProc('/components/gendata.js', 'Gen');
network.defProc('jsfbp/copier', 'Copy');
network.defProc('jsfbp/recvr', 'Recvr');

//network.initialize(gendata, 'COUNT', '2000');
//network.connect(gendata, 'OUT', copier, 'IN', 5);
//network.connect(copier, 'OUT', recvr, 'IN', 5);

network.sinitialize('Gen.COUNT', '2000');
network.sconnect('Gen.OUT', 'Copy.IN', 5);
network.sconnect('Copy.OUT', 'Recvr.IN', 5);

// --- run ---

network.run({trace: false});
