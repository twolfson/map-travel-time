// Load in our dependencies
var _ = require('underscore');
var assert = require('assert');
var fs = require('fs');
var async = require('async');
var Papa = require('papaparse');
var logger = console;

// Define our helpers
function readVendorFile(filepath, cb) {
  // If we have already parsed our file into JSON, then load that
  // DEV: JSON loads much faster, hence our preference
  var cacheFilepath = filepath + '.json';
  fs.readFile(cacheFilepath, 'utf8', function handleReadFile (err, cachedStr) {
    // If there was an error that wasn't about our file not existing, callback with it
    if (err && err.code !== 'ENOENT') {
      return cb(err);
    }

    // If we loaded content, then callback with it
    if (cachedStr) {
      var cachedRetVal = JSON.parse(cachedStr);
      return cb(null, cachedRetVal);
    }

    // Load our initial file
    fs.readFile(filepath, 'utf8', function handleReadFile (err, csvStr) {
      // If there was an error, callback with it
      if (err) {
        return cb(err);
      }

      // Parse our CSV result
      // DEV: We trim loaded data to prevent empty lines being parsed
      csvStr = csvStr.trim();
      var results = Papa.parse(csvStr, {
        header: true
      });
      if (results.errors.length) {
        console.error('Error encountered', results.errors[0]);
        return cb(new Error(results.errors[0].message));
      }
      var retVal = results.data;

      // Save our data to JSON as caching
      fs.writeFile(cacheFilepath, JSON.stringify(retVal), 'utf8', function handleWriteFile (err) {
        // If there was an error, callback with it
        if (err) {
          return cb(err);
        }

        // Callback with our value
        cb(null, retVal);
      });
    });
  });
}

// Define our builder functions
function buildStopTimes(cb) {
  // Load in our stop times data
  var filepath = __dirname + '/../vendor/sfmta-60/stop_times.txt';
  logger.info('Loading file "' + filepath + '"...');
  readVendorFile(filepath, function handleReadVendorFile (err, stopTimes) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // TODO: Remove slice for development
    // Cut down data for development iteration
    stopTimes = stopTimes.slice(0, 10);

    // Group our trip datas by their id
    // [{trip_id: '7342058', arrival_time: '26:04:21', departure_time: '26:04:21',
    //   stop_id: '6316', stop_sequence: '8', stop_headsign: ' ', pickup_type: ' ',
    //   drop_off_type: ' ', shape_dist_traveled: ' '}
    // ->
    // {7342058/*trip_id*/: [{trip_id: '7342058', ...}, ...]
    logger.info('File loaded "' + filepath + '"');
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
      // DEV: We use `snake_case` for consistency with Protobuf standards
      return {
        trip_id: tripId,
        first_arrival_time: parseTimeStr(firstArrivalTimeStr),
        stops: stopTimeArr.map(function stripStopTimesData (stopTime, i) {
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
          // {stop_id: '1234', time_to_next_stop: 45}
          var retObj = _.pick(stopTime, VALID_KEYS);
          assert.deepEqual(Object.keys(retObj), VALID_KEYS);
          retObj.time_to_next_stop = timeToNextStop;
          return retObj;
        })
      };
    });

    // Callback with our data
    cb(null, retArr);
  });
}

function buildStops(cb) {
  var filepath = __dirname + '/../vendor/sfmta-60/stops.txt';
  readVendorFile(filepath, cb);
}

function buildTrips(cb) {
  var filepath = __dirname + '/../vendor/sfmta-60/trips.txt';
  readVendorFile(filepath, cb);
}

// Define our main function
module.exports = function (cb) {
  async.parallel([
    buildStopTimes,
    buildStops,
    buildTrips
  ], function handleResults (err, results) {
    // If there was an error, callback with it

    // Otherwise, callback with a JSON-P string
    assert.strictEqual(results.length, 3);
    cb(null, 'window.app.loadData(' + JSON.stringify({
      stopTimes: results[0],
      stops: results[1],
      trips: results[2]
    }) + ')');
  });
};

// If we are running our script directly, output to `stdout`
// DEV: 170kb gzipped with only stop ids bound to trip id
//   node tmp.js | gzip | wc -c
// DEV: 518kb gzipped with stop id and time to next stop
// DEV: 435kb gzipped if we remove 1 order of magnitude from time to next stop
// TODO: Save even more space by flattening array entirely and using string based delimiters
// TODO: Save even more space by removing quotes on ids (i.e. convert to integers)
// TODO: Save even more space by converting numbers to base16
// TODO: Normalize stops and trips (currently adding 200kb gzipped bulk)
if (require.main === module) {
  module.exports(function handleGenerateJsonP (err, jsonp) {
    // If there was an error, throw it
    if (err) {
      throw err;
    }

    // Otherwise, log our result
    console.log(jsonp);
  });
}
