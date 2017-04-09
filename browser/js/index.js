// Load in our dependencies
// Based on http://leafletjs.com/examples/quick-start/
var assert = require('assert');
var escapeHtml = require('escape-html');
var L = require('leaflet');
var ProtobufTypes = require('./protobuf-types');

// Define a parser helper
function parseProtobufTypeArr(consoleLabel, protobufClass, protobufStrArr) {
  console.time(consoleLabel);
  var retArr = protobufStrArr.map(function decodeProtobufStr (protobufStr) {
    return protobufClass.decode(Buffer.from(protobufStr, 'utf8'));
  });
  console.timeEnd(consoleLabel);
  return retArr;
}

// Define our Application constructor
function Application(params) {
  // Verify we have our parameters
  assert(params.el);

  // Bind Leaflet to our element
  // http://leafletjs.com/reference-1.0.3.html#map-factory
  // TODO: Determine good starting point for each city
  //   Maybe make SF Bay Area multiple locations with same files
  //   So SF and Oakland all start in nice points
  var map = this.map = L.map(params.el, {
    zoom: 13
  });

  // Define our layers
  // DEV: We are using OpenStreetmap as inspired by Mapnificent. No need to use Mapbox
  // https://switch2osm.org/using-tiles/getting-started-with-leaflet/
  var osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    minZoom: 8,
    maxZoom: 18
  });
  osmLayer.addTo(map);
  // TODO: Disable stops layer after development complete
  var stopMarkersLayer = this.stopMarkersLayer = L.layerGroup([]);
  stopMarkersLayer.addTo(map);

  // Bind controls for our layers
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
Application.prototype = {
  loadData: function (params) {
    // Localize/assert our parameters
    var stopTimes = params.stopTimes; assert(stopTimes);
    var stops = params.stops; assert(stops);
    var trips = params.trips; assert(trips);

    // Slice our stop data for development
    // TODO: Remove dev edit
    // stops = stops.slice(0, 10);

    // Parse our parameters via Protobuf
    // stopTimes = parseProtobufTypeArr('Parsing stop times', ProtobufTypes.StopTime, stopTimes);
    // DEV: We are seeing 300ms parsing time although this doesn't have insight into JSON-P comprehension
    stops = parseProtobufTypeArr('Parsing stops', ProtobufTypes.Stop, stops);
    // DEV: We are seeing 1000ms parsing time although this doesn't have insight into JSON-P comprehension
    trips = parseProtobufTypeArr('Parsing trips', ProtobufTypes.Trip, trips);
    var stopInfoArr = stops;

    // Recenter our map
    this.map.panTo([stopInfoArr[0].stop_lat, stopInfoArr[0].stop_lon]);

    // Draw dots for each of our stations
    // TODO: Make stations debuggable so group them in a layer or something
    var that = this;
    stopInfoArr.forEach(function generateStopMarker (stopInfo) {
      // Generate our marker
      // [{stop_id: '98', stop_code: '198', stop_name: '2ND ST ...', stop_desc: ' ',
      //   stop_lat: '37...', stop_lon: '-122...', zone_id: ' ', stop_url: ' '}, ...]
      // to '2ND ST ... (id: 98, code: 198)'
      var popupStr = stopInfo.stop_name + ' (id: ' + escapeHtml(stopInfo.stop_id) + ', ' +
        'code: ' + escapeHtml(stopInfo.stop_code) + ')';
      var stopMarker = L.circleMarker([stopInfo.stop_lat, stopInfo.stop_lon], {
        stroke: false,
        fillOpacity: 1.0,
        radius: 3
      }).bindPopup(popupStr);

      // Bind our marker
      that.stopMarkersLayer.addLayer(stopMarker);
    });
  }
};
window.Application = module.exports = Application;
