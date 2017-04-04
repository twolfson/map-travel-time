// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var moment = require('moment');
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
stopTimes = stopTimes.slice(0, 10);

// Group our trip datas by their id
var stopTimesMapByTripId = _.groupBy(stopTimes, function groupByTripId (stopTime) {
  return stopTime.trip_id;
});

// Strip away data we don't need
// DEV: We use a similar compression to Google Calendar's timezones
//   i.e. ['trip_id', ['stop_id', 'time_to_next_stop']]
//   This reduces us from 260kb gzipped to 170kb gzipped
//   Due to sheer number of repeated keys/references
var VALID_KEYS = ['stop_id'];
var retArr = _.map(stopTimesMapByTripId, function iterateStopTimeArrs (stopTimeArr, tripId) {
  // Extract our first arrival time for serialization
  var firstStop = stopTimeArr[0];
  assert(firstStop);
  var firstArrivalTime = firstStop.arrival_time;
  assert(firstArrivalTime);

  // Generate our return data
  return [
    tripId,
    stopTimeArr[0].arrival_time,
    stopTimeArr.map(function stripStopTimesData (stopTime, i) {
      // Assume trips are circular
      // TODO: Figure out circular trip detection
      var nextStop = stopTimeArr[i + 1] || stopTimeArr[0];
      assert(nextStop);

      // Parse stop info
      // https://momentjs.com/docs/#/parsing/string-format/
      var currentDepartureTimeStr = stopTime.departure_time;
      assert(currentDepartureTimeStr);
      var currentDepartureTime = moment('1970-01-01T' + currentDepartureTimeStr + 'Z');
      assert(currentDepartureTime.isValid(), 'Time isn\'t valid: 1970-01-01T' + currentDepartureTimeStr + 'Z');

      var nextArrivalTimeStr = stopTime.arrival_time;
      assert(nextArrivalTimeStr);
      var nextArrivalTime = moment('1970-01-01T' + nextArrivalTimeStr + 'Z');
      assert(nextArrivalTime.isValid());

      // Resolve time to our next stop
      assert(currentDepartureTime.isBefore(nextArrivalTime));
      var timeToNextStop = nextArrivalTime - currentDepartureTime;

      // Generate and return our data
      var values = _.values(_.pick(stopTime, VALID_KEYS));
      assert.strictEqual(values.length, VALID_KEYS.length);
      return values.concat([timeToNextStop]);
    })
  ];
});

// Output our data
// DEV: 170kb gzipped with only stop ids bound to trip id
//   node tmp.js | gzip | wc -c
console.log(JSON.stringify(retArr));
