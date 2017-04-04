// Load in our dependencies
var fs = require('fs');
var readVendorFile = function (filepath) { return fs.readFileSync(__dirname + '/../vendor/' + filepath, 'utf8').trim(); };

// Load in our stop data
var csvStopTimesStr = readVendorFile('sfmta-60/stop_times.txt');
