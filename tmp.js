// Load in our dependencies
var fs = require('fs');
var Papa = require('papaparse');

// Define our helpers
// TODO: Polish our helpers
function parseCsvStr(csvStr) {
  var results = Papa.parse(csvStr, {
    header: true
  });
  if (results.errors.length) {
    console.error('Error encountered', results.errors[0]);
    throw new Error(results.errors[0].message);
  }
  return results.data;
}
function readVendorFile(filepath) {
  return fs.readFileSync(__dirname + '/vendor/' + filepath, 'utf8').trim();
}

// Load in our stop data
var csvStopTimesStr = readVendorFile('sfmta-60/stop_times.txt');
console.log('start...');
var stopTimes = parseCsvStr(csvStopTimesStr);
console.log('stop');

console.log(stopTimes.slice(0, 10));
