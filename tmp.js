// Load in our dependencies
var _ = require('underscore');
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

// TODO: Remove DEV slicing
stopTimes = stopTimes.slice(0, 10);

// Group our trip datas by their id
var stopTimesMapByTripId = _.groupBy(stopTimes, function groupByTripId (stopTime) {
  return stopTime.trip_id;
});

// Strip away data we don't need
var retObj = stopTimesMapByTripId;
var VALID_KEYS = ['arrival_time', 'stop_id'];
_.each(retObj, function iterateStopTimeArrs (stopTimeArr, tripId) {
  stopTimeArr.forEach(function stripStopTimesData (stopTime) {
    Object.keys(stopTime).forEach(function stripStopTimeData (key) {
      if (VALID_KEYS.indexOf(key) === -1) {
        delete stopTime[key];
      }
    });
  });
});
console.log(retObj);
