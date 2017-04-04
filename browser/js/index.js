// Load in our dependencies
// Based on http://leafletjs.com/examples/quick-start/
var assert = require('assert');
var escapeHtml = require('escape-html');
var Papa = require('papaparse');
var L = require('leaflet');

// Define a parser helper
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

// Define our Application constructor
function Application(params) {
  // Verify we have our parameters
  assert(params.csvStopsStr);
  assert(params.el);

  // Parse our stop info
  var stopInfoArr = parseCsvStr(params.csvStopsStr);

  // Slice our stop data for development
  // TODO: Remove dev edit
  // stopInfoArr = stopInfoArr.slice(0, 10);

  // Bind Leaflet to our element
  // http://leafletjs.com/reference-1.0.3.html#map-factory
  // TODO: Determine good starting point for each city
  //   Maybe make SF Bay Area multiple locations with same files
  //   So SF and Oakland all start in nice points
  var map = L.map(params.el, {
    center: [stopInfoArr[0].stop_lat, stopInfoArr[0].stop_lon],
    zoom: 13
  });

  // Define our tile layer
  // DEV: We are using OpenStreetmap as inspired by Mapnificent. No need to use Mapbox
  // https://switch2osm.org/using-tiles/getting-started-with-leaflet/
  var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    minZoom: 8,
    maxZoom: 18
  });
  osmLayer.addTo(map);

  // Draw dots for each of our stations
  // TODO: Make stations debuggable so group them in a layer or something
  var stopMarkers = stopInfoArr.map(function generateStopMarker (stopInfo) {
    // [{stop_id: '98', stop_code: '198', stop_name: '2ND ST ...', stop_desc: ' ',
    //   stop_lat: '37...', stop_lon: '-122...', zone_id: ' ', stop_url: ' '}, ...]
    // to '2ND ST ... (id: 98, code: 198)'
    var popupStr = stopInfo.stop_name + ' (id: ' + escapeHtml(stopInfo.stop_id) + ', ' +
      'code: ' + escapeHtml(stopInfo.stop_code) + ')';
    return L.circleMarker([stopInfo.stop_lat, stopInfo.stop_lon], {
      stroke: false,
      fillOpacity: 1.0,
      radius: 3
    }).bindPopup(popupStr);
  });
  var stopMarkersLayer = L.layerGroup(stopMarkers);
  // TODO: Disable stops layer after development complete
  stopMarkersLayer.addTo(map);

  // Bind our layers to our map
  // http://leafletjs.com/examples/layers-control/
  // http://leafletjs.com/reference.html#control-layers
  L.control.layers({
    OpenStreetMap: osmLayer
  }, {
    Stops: stopMarkersLayer
  }).addTo(map);

  // When a click occurs
  // TODO: Swap this out with a plugin
  var lastClickTime = 0;
  var clickTimeout = null;
  var DOUBLE_CLICK_TOLERANCE = 300;
  map.on('click', function handleClick (evt) {
    // Clear our existing timeout
    clearTimeout(clickTimeout);

    // If the last click didn't occur recently, then start our timeout
    // TODO: Try long press as well (via mousedown/mouseup)
    var now = Date.now();
    console.log('wat', now - lastClickTime, DOUBLE_CLICK_TOLERANCE);
    if (now - lastClickTime > DOUBLE_CLICK_TOLERANCE) {
      clickTimeout = setTimeout(function handleSetTimeout () {
        // If our timeout hasn't reset, then it was a single click
        // As a result, draw our marker
        console.log('single click');
      }, DOUBLE_CLICK_TOLERANCE);
    }

    // Update our last click time
    lastClickTime = now;
  });
}
window.Application = module.exports = Application;
