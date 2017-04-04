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
// stopTimes = stopTimes.slice(0, 10);

// Group our trip datas by their id
var stopTimesMapByTripId = _.groupBy(stopTimes, function groupByTripId (stopTime) {
  return stopTime.trip_id;
});

// Define time parsing helper
var TIME_STR_REGEXP = /(\d{2}):(\d{2}):(\d{2})/;
function parseTimeStr(timeStr) {
  var timeParts = timeStr.match(TIME_STR_REGEXP);
  assert(timeParts, 'Unable to match timeStr: ' + timeStr);
  return (parseInt(timeParts[1], 10) * 60 * 60 +
          parseInt(timeParts[2], 10) * 60 +
          parseInt(timeParts[3], 10));
}

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
  var firstArrivalTimeStr = firstStop.arrival_time;
  assert(firstArrivalTimeStr);

  // Generate our return data
  return [
    tripId,
    parseTimeStr(firstArrivalTimeStr),
    stopTimeArr.map(function stripStopTimesData (stopTime, i) {
      // Assume trips are circular
      // TODO: Figure out circular trip detection
      var nextStopTime = stopTimeArr[i + 1] || stopTimeArr[0];
      assert(nextStopTime);

      // Parse stop info
      // https://momentjs.com/docs/#/parsing/string-format/
      var currentDepartureTimeStr = stopTime.departure_time;
      assert(currentDepartureTimeStr);
      var currentDepartureTime = parseTimeStr(currentDepartureTimeStr);

      var nextArrivalTimeStr = nextStopTime.arrival_time;
      assert(nextArrivalTimeStr);
      var nextArrivalTime = parseTimeStr(nextArrivalTimeStr);

      // Resolve time to our next stop
      if (currentDepartureTime >= nextArrivalTime) {
        nextArrivalTime += 24 * 60 * 60;
      }
      assert(currentDepartureTime < nextArrivalTime,
        'Expected "' + currentDepartureTimeStr + '" to be less than "' + nextArrivalTimeStr + '" after modulo ' +
        '(trip_id: ' + stopTime.trip_id + ', stop_id: ' + stopTime.stop_id + ')');
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
// DEV: 518kb gzipped with stop id and time to next stop
// DEV: 435kb gzipped if we remove 1 order of magnitude from time to next stop
console.log(JSON.stringify(retArr));
