// Load in our dependencies
var _ = require('underscore');
var fs = require('fs');
var Papa = require('papaparse');

// Define our helpers
// TODO: Polish our helpers
// DEV: We trim loaded data to prevent empty lines being parsed
function readVendorFile(filepath) {
  // If we have already parsed our file into JSON, then load that
  // DEV: JSON loads much faster, hence our preference
  var cacheFilepath = filepath + '.json';
  try {
    var cachedStr = fs.readFileSync(cacheFilepath, 'utf8');
    var cachedRetVal = JSON.parse(cachedStr);
    return cachedRetVal;
  // When an error occurs
  } catch (err) {
    // If the error was about our file not existing
    if (err.code === 'ENOENT') {
      // Do nothing
    // Otherwise, throw it
    } else {
      throw err;
    }
  }

  // Load our initial file
  var csvStr = fs.readFileSync(filepath, 'utf8');
  csvStr = csvStr.trim();

  // Parse our CSV result
  var results = Papa.parse(csvStr, {
    header: true
  });
  if (results.errors.length) {
    console.error('Error encountered', results.errors[0]);
    throw new Error(results.errors[0].message);
  }
  var retVal = results.data;

  // Save our data to JSON as caching
  fs.writeFileSync(cacheFilepath, JSON.stringify(retVal), 'utf8');

  // Return our ret val
  return retVal;
}

// Load in our stop data
console.log('Loading file...');
var stopTimes = readVendorFile(__dirname + '/vendor/sfmta-60/stop_times.txt');
console.log('File loaded');

// TODO: Remove DEV slicing
// stopTimes = stopTimes.slice(0, 10);

// Group our trip datas by their id
var stopTimesMapByTripId = _.groupBy(stopTimes, function groupByTripId (stopTime) {
  return stopTime.trip_id;
});

// Strip away data we don't need
// DEV: We use a similar compression to Google Calendar's timezones
//   i.e. ['trip_id', ['stop_id', 'timestamp']]
//   This reduces us from 260kb gzipped to 170kb gzipped
//   Due to sheer number of repeated keys/references
var VALID_KEYS = ['stop_id'];
var retArr = _.map(stopTimesMapByTripId, function iterateStopTimeArrs (stopTimeArr, tripId) {
  return [
    tripId,
    stopTimeArr.map(function stripStopTimesData (stopTime) {
      return _.values(_.pick(stopTime, VALID_KEYS));
    })
  ];
});

// Output our data
// DEV: 170kb gzipped with only stop ids bound to trip id
//   node tmp.js | gzip | wc -c
console.log(JSON.stringify(retArr));
