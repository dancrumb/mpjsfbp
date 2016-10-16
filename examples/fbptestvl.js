import fbp from '../src';

// --- define network ---
const network = new fbp.Network({ componentRoot: __dirname});

const gendata = network.defProc('/components/gendata.js', 'Gen');
const copier = network.defProc('./components/copier.js', 'Copy');
const disc = network.defProc('./components/discard.js', 'Disc');
// var recvr = fbp.defProc(require('../components/recvr.js'), 'recvr'); // equivalent

network.initialize(gendata, 'COUNT', '100000000');
network.connect(gendata, 'OUT', copier, 'IN', 5);
network.connect(copier, 'OUT', disc, 'IN', 5);

// --- run ---

network.run({trace: false});
