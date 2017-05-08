# maptalks.routeplayer

[![CircleCI](https://circleci.com/gh/maptalks/maptalks.routeplayer.svg?style=shield)](https://circleci.com/gh/maptalks/maptalks.routeplayer)
[![NPM Version](https://img.shields.io/npm/v/maptalks.routeplayer.svg)](https://github.com/maptalks/maptalks.routeplayer)

Route Player plugin for maptalks.js.

![screenshot]()

## Examples

* [Play of 100 routes](https://maptalks.github.io/maptalks.routeplayer/demo/).

## Install
  
* Install with npm: ```npm install maptalks.routeplayer```. 
* Download from [dist directory](https://github.com/maptalks/maptalks.routeplayer/tree/gh-pages/dist).
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
            [121.475031060928,31.2611187865471,301000],
            [121.47940842604,31.263466566376,541000]
        ]
    }
];
var player = new maptalks.RoutePlayer(route, map);
player.play();
</script>
```

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
