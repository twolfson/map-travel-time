// Load in our dependencies
// Based on http://leafletjs.com/examples/quick-start/
var L = require('leaflet');

// Define our main function
function main() {
  // Create our element for Leaflet
  var mapEl = document.createElement('div');
  mapEl.className = 'map';
  document.body.appendChild(mapEl);

  // Bind Leaflet to our element
  // http://leafletjs.com/reference-1.0.3.html#map-factory
  var map = L.map(mapEl, {
    center: [51.505, -0.09],
    zoom: 13
  });

  // Add our map layer
  // DEV: We are using OpenStreetmap as inspired by Mapnificent. No need to use Mapbox
  // https://switch2osm.org/using-tiles/getting-started-with-leaflet/
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data © <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    minZoom: 8,
    maxZoom: 18
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
main();
