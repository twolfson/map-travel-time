// Load in dependencies
var assert = require('assert');
var mapTravelTime = require('../');

// Start our tests
describe('map-travel-time', function () {
  it('returns awesome', function () {
    assert.strictEqual(mapTravelTime(), 'awesome');
  });
});
