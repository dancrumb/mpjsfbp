var fbp = require('../src')
  , path = require('path');

// --- define network ---
var network = new fbp.Network({ componentRoot: __dirname});

var reader = network.defProc('./components/reader', 'Read');
var copier = network.defProc('./components/copier', 'Copy');
var writer = network.defProc('./components/writer', 'Write');

network.initialize(reader, 'FILE', path.resolve(__dirname, 'data/text.txt'));
network.connect(reader, 'OUT', copier, 'IN', 1);
network.initialize(writer, 'FILE', path.resolve(__dirname, 'data/text_new.txt'));
network.connect(copier, 'OUT', writer, 'IN', 1);

// --- run ---

network.run({trace: false});
