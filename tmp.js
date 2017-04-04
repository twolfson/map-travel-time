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
console.log('start...');
var stopTimes = readVendorFile(__dirname + '/vendor/sfmta-60/stop_times.txt');
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
