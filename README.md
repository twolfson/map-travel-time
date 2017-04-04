# map-travel-time [![Build status](https://travis-ci.org/twolfson/map-travel-time.svg?branch=master)](https://travis-ci.org/twolfson/map-travel-time)

Map that projects travel times from a point

Based on [Mapnificent][], cloned due to lack of maintenance, documentation, and desire for better travel time visibility

[Mapnificent]: https://github.com/mapnificent/mapnificent

TODO: It's not feasible to load all stop times in browser. It yields too much data even after stripping and gzipping:

```
$ sed -E "s/([0-9]+)([0-9]{2}),[0-9:]+,[0-9:]+,[0-9]+,([0-9]+), , , ,/\2,\3/g" vendor/sfmta-60/stop_times2.txt | head
trip_id,arrival_time,departure_time,stop_id,stop_sequence,stop_headsign,pickup_type,drop_off_type,shape_dist_traveled
58,1
58,2
58,3
58,4
58,5
58,6
58,7
58,8
58,9
$ sed -E "s/([0-9]+)([0-9]{2}),[0-9:]+,[0-9:]+,[0-9]+,([0-9]+), , , ,/\2,\3/g" vendor/sfmta-60/stop_times2.txt | gzip | wc -c
1674522 # 1.6MB
```

This is when we cut off time data and try to shrink all valuable info. We now know why Mapnificent only loads stops =/ and fuzzes times

## Getting Started
Install the module with: `npm install map-travel-time`

```js
var mapTravelTime = require('map-travel-time');
mapTravelTime(); // 'awesome'
```

## Documentation
_(Coming soon)_

TODO: Document LiveReload
TODO: Attribute Transit Feeds for GTFS data and OneBus for pointing us in proper direction
TODO: Add screenshots to tests
TODO: Add screenshot to README

## Examples
_(Coming soon)_

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint via `npm run lint` and test via `npm test`.

## Donating
Support this project and [others by twolfson][twolfson-projects] via [donations][twolfson-support-me].

<http://twolfson.com/support-me>

[twolfson-projects]: http://twolfson.com/projects
[twolfson-support-me]: http://twolfson.com/support-me

## Unlicense
As of Apr 02 2017, Todd Wolfson has released this repository and its contents to the public domain.

It has been released under the [UNLICENSE][].

[UNLICENSE]: UNLICENSE
