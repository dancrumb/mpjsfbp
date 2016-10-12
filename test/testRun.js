var fs  = require('fs');
var Network = require('../src/core/Network');

fs.readFile(`${__dirname}/core/network.fbp`, 'utf8', function (err, graph) {
    if (err) {
      console.error(err);
    } else {
      var network = Network.createFromGraph(graph);
      network.run(function () {
        console.log(arguments);
      });
    }
});
