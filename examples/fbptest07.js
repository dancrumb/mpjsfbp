var fbp = require('../src');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var gendata = network.defProc('/components/gendata', 'Gen');
var repl = network.defProc('./components/repl', 'Repl');
var concat = network.defProc('./components/concat', 'Concat');
var recvr = network.defProc('./components/recvr', 'Recvr');

network.initialize(gendata, 'COUNT', '20');
network.connect(gendata, 'OUT', repl, 'IN', 5);
network.connect(repl, 'OUT[0]', concat, 'IN[0]', 5);
network.connect(repl, 'OUT[1]', concat, 'IN[1]', 5);
network.connect(repl, 'OUT[2]', concat, 'IN[2]', 5);
network.connect(concat, 'OUT', recvr, 'IN', 5);

// --- run ---

network.run({
  trace: false
});
