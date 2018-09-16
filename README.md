# maptalks.routeplayer

[![NPM Version](https://img.shields.io/npm/v/maptalks.routeplayer.svg)](https://github.com/maptalks/maptalks.routeplayer)

Route Player plugin for maptalks.js based on [VectorLayer](http://maptalks.org/maptalks.js/api/0.x/VectorLayer.html).

![screenshot](https://user-images.githubusercontent.com/13678919/45591786-16929580-b98e-11e8-95fe-83ee73a15d1b.png)

## Examples

* [Route play](https://maptalks.github.io/maptalks.routeplayer/demo/).

## Install
  
* Install with npm: ```npm install maptalks.routeplayer```. 
* Download from [dist directory](https://github.com/maptalks/maptalks.routeplayer/tree/master/dist).
* Use unpkg CDN: ```https://unpkg.com/maptalks.routeplayer/dist/maptalks.routeplayer.min.js```

## Usage

As a plugin, ```maptalks.routeplayer``` must be loaded after ```maptalks.js``` in browsers.
```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.routeplayer/dist/maptalks.routeplayer.min.js"></script>
<script>
var route = [
    {
        "path" : [
            //[x, y, time]
            [121.475031060928, 31.2611187865471, 301000],
            [121.47940842604, 31.263466566376, 541000]
        ],
        //marker's symbol
        "markerSymbol" : null,
        //route line's symbol
        "lineSymbol" : { lineColor : '#f00' }
    }
];
var player = new maptalks.RoutePlayer(route, map);
player.play();
</script>
```

## API Reference

### `Constructor`

```javascript
new maptalks.RoutePlayer(route, map)
```

* route **Object[]** an object array containing routes data
* map **Map** maptalks map instance
* options **Object** options
    * unitTime **Number** unit time for 1ms in player, default is 1000ms
    * showRoutes **Boolean** Whether to show routes during playing

### `remove()`

stop playing and remove from map.

**Returns** `this`

### `play()`

Start to play.

**Returns** `this`

### `pause()`

Pause playing.

**Returns** `this`

### `cancel()`

Cancel playing.

**Returns** `this`

### `finish()`

Finish playing.

**Returns** `this`

### `getStartTime()`

Get player's playing start time.
Player's start time is the minimum one of all the route's start time;

**Returns** `Number`

### `getEndTime()`

Get player's playing end time.
Player's end time is the maximum one of all the route's start time;

**Returns** `Number`

### `getCurrentTime()`

Get player's current time of playing.

**Returns** `Number`

### `setTime(t)`

Set player's time to t and redraw all the things at that moment.

**Returns** `this`

### `getUnitTime()`

Get player's unit time.

**Returns** `Number`

### `setUnitTime()`

Set player's unit time.

**Returns** `this`

### `getCurrentCoordinates(index)`

Get route of the given index's current coordinate

**Returns** `Coordinate`

### `getMarkerSymbol(idx)`

Get marker symbol of route idx.

**Returns** `Object`

### `setMarkerSymbol(idx, symbol)`

Set route idx's marker symbol.

**Returns** `this`

### `getLineSymbol(idx)`

Get line symbol of route idx.

**Returns** `Object`

### `setLineSymbol(idx, symbol)`

Set route idx's line symbol.

**Returns** `this`

## Supported Browsers

IE 9-11, Chrome, Firefox, other modern and mobile browsers.

## API Reference

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is ```index.js```.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

* Install dependencies
```shell
$ npm install
```

* Watch source changes and generate runnable bundle repeatedly
```shell
$ gulp watch
```

* Tests
```shell
$ npm test
```

* Watch source changes and run tests repeatedly
```shell
$ gulp tdd
```

* Package and generate minified bundles to dist directory
```shell
$ gulp minify
```

* Lint
```shell
$ npm run lint
```
