# maptalks.routeplayer

[![NPM Version](https://img.shields.io/npm/v/maptalks.routeplayer.svg)](https://github.com/maptalks/maptalks.routeplayer)

Route Player plugin for maptalks.js.

*  support 2d/3d Layer.
* high-performance
* customizable

![screenshot](https://user-images.githubusercontent.com/13678919/45591786-16929580-b98e-11e8-95fe-83ee73a15d1b.png)

## Examples

* [Basic demo](https://maptalks.github.io/maptalks.routeplayer/demo/base.html).
* [with GLTFLayer](https://maptalks.github.io/maptalks.routeplayer/demo/gltflayer.html).
* [with ThreeLayer](https://maptalks.github.io/maptalks.routeplayer/demo/threelayer.html).
* [simple road](https://maptalks.github.io/maptalks.routeplayer/demo/road.html).
* [drive road](https://maptalks.github.io/maptalks.routeplayer/demo/drive.html).
* [test perf by VectorLayer](https://maptalks.github.io/maptalks.routeplayer/demo/perf-base.html).
* [test perf by GLTFLayer](https://maptalks.github.io/maptalks.routeplayer/demo/perf-3d.html).

## Install

  
* Install with npm: 

```sh
npm install maptalks 
npm install maptalks.routeplayer
```

* Use unpkg CDN:

```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.routeplayer/dist/maptalks.routeplayer.js"></script>
```

## Usage

As a plugin, maptalks.routeplayer must be loaded after maptalks.js in browsers.

### HTML

```html
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.routeplayer/dist/maptalks.routeplayer.js"></script>
<script>
    const route = [{
            coordinate: [120, 31, 0],
            time: 301000
        },
        {
            coordinate: [122, 32, 0],
            time: 541000
        },
        //other coordinates
    ];
    const data = maptalks.formatRouteData(route, {});
    const player = new maptalks.RoutePlayer(data, {
        speed: 4,
        debug: false
    });
    console.log(player);
    player.play();
</script>
```

### ESM

```js
import {
    RoutePlayer,
    formatRouteData
} from 'maptalks.routeplayer';
const route = [{
        coordinate: [120, 31, 0],
        time: 301000
    },
    {
        coordinate: [122, 32, 0],
        time: 541000
    },
    //other coordinates
];
const data = formatRouteData(route, {});
const player = new RoutePlayer(data, {
    speed: 4,
    debug: false
});
console.log(player);
player.play();
```

## API Reference

### `formatRouteData(route,options)`

format route data util for `RoutePlayer`

```js
const route = [{
        coordinate: [120, 31, 0],
        time: 301000
    },
    {
        coordinate: [122, 32, 0],
        time: 541000
    },
    //other coordinates
];
const data = formatRouteData(route, {});
```

* support custome coordinateKey and timeKey

```js
const route = [{
        coord: [120, 31, 0],
        t: 301000
    },
    {
        coord: [122, 32, 0],
        t: 541000
    },
    //other coordinates
];
const data = formatRouteData(route, {
    coordinateKey: 'coord',
    timeKey: 't'
});
```

* support Automatically generate timestamps
if your data no time, you can:

```js
const route = [{
        coordinate: [120, 31, 0],
    },
    {
        coordinate: [122, 32, 0]
    },
    //other coordinates
];
const data = formatRouteData(route, {
    duration: 1000 * 60 * 10
});
```

The automatically generated time is milliseconds, by `new Date().getTime()`

**duration unit is milliseconds**

### `RoutePlayer`

#### constructor

```javascript
new RoutePlayer(routeData, options)
```

* routeData **Array** an object array containing routes data, from `formatRouteData` function run result 
* options **Object**
    - unitTime **Number** unit time, default is 1 ,Internally used milliseconds as a unit, if the time unit of your data is not milliseconds, please set its value,For example, if your data time unit is seconds, we can set it to 1000
    - speed **Number** the speed of play
    - debug **Boolean** 
    - autoPlay **Boolean** Whether auto play
    - repeat **Boolean** Whether repeat play

```js
import {
    RoutePlayer,
    formatRouteData
} from 'maptalks.routeplayer';
const route = [{
        coordinate: [120, 31, 0],
        time: 301000
    },
    {
        coordinate: [122, 32, 0],
        time: 541000
    },
    //other coordinates
];
const data = formatRouteData(route, {});
const player = new RoutePlayer(data, {
    speed: 4,
    debug: false,
    autoPlay: true
});
console.log(player);
player.play();
```

#### methods

* `remove()`
* `add()`
* `play()`
* `pause()`
* `reset()` Restore all states to their original state

```js
function replay() {
    player.reset();
    player.play();
}
```

* `cancel()` Equivalent to `reset`
* `isPlaying()`
* `isPlayend()`
* `finish()`
* `getSpeed()`
* `setSpeed(speed)` It can be analogized to the speed of a video

```js
player.setSpeed(10);
```

* `setIndex(index)` Set the current playback position to a coordinate node

```js
player.setIndex(10);
```

* `setTime(time)` Set the current playback position to a certain time

```js
     const t = player.getStartTime() / 2 + player.getEndTime() / 2;
     player.setTime(t);
```

* `setPercent(percent)` Set the current playback position as a percentage of distance

```js
player.setPercent(0.3);
```

* `setData(data)` reset route data

```js
const newData = formatRouteData(route, {});
player.setData(data);
```

* `getCurrentTime()`
* `getStartCoordinate()` Get the coordinates of the first node
* `getStartInfo()` Obtain information about the starting point, including coordinates, rotation information, etc

```js
   const info = player.getStartInfo();
   console.log(info.coordinate);
   //for 3d model rotation
   console.log(info.rotationZ);
   console.log(info.rotationX);

   function updateModelPosition(e) {
       const {
           coordinate,
           rotationZ,
           rotationX
       } = e;
       if (!currentModel) {
           return;
       }
       // if (Math.abs(rotationX) > 40) {
       //     console.log(rotationX);
       // }
       currentModel.setCoordinates(coordinate);
       currentModel.setRotation(rotationX, 0, rotationZ + modelOffsetAngle);
   }
   currentModel = new maptalks.GLTFMarker(info.coordinate, {
       symbol,
   });
   gltfLayer.addGeometry(currentModel);
   updateModelPosition(info)
```

* `getData()`
* `getStartTime()`
* `getEndTime()`
* `getUnitTime()`
* `setUnitTime(t)`

```js
//if your data time unit is second,1 second= 1000 ms
player.setUnitTime(1000);
```

* `getCurrentCoordinate()` Get the coordinates of the current playback point

#### events

```js
      player.on('playstart playing playend pause', e => {
          console.log(e.type);
      })
```

* `add`
* `remove`
* `playstart`
* `playing`

```js
function updateModelPosition(e) {
    const {
        coordinate,
        rotationZ,
        rotationX
    } = e;
    if (!currentModel) {
        return;
    }
    // if (Math.abs(rotationX) > 40) {
    //     console.log(rotationX);
    // }
    currentModel.setCoordinates(coordinate);
    currentModel.setRotation(rotationX, 0, rotationZ + modelOffsetAngle);
}
player.on('playing', e => {
    if (autoUpdateMapCenter) {
        map.setCenter(e.coordinate);
    }
    updateModelPosition(e);
    // point.setCoordinates(e.coordinate);
});
```

* `playend`
* `vertex` Passing through coordinate nodes during playback

```js
function showVertex(e, vertexs, layer) {
    const data = e.data;
    const index = e.index;
    console.log(index);
    if (!vertexs[index]) {
        const coordinate = data.coordinate;
        const point = new maptalks.Marker(coordinate, {
            symbol: {
                markerType: 'ellipse',
                markerWidth: 5,
                markerHeight: 5,
                textSize: 12,
                textName: index,
                textFill: '#fff'
            }
        });
        vertexs[index] = point;
    }
    const point = vertexs[index];
    if (!point.getLayer()) {
        point.addTo(layer);
    }

    const needRemoves = vertexs.slice(index + 1, Infinity);
    if (needRemoves.length) {
        layer.removeGeometry(needRemoves);
    }
}

let vertexs = [];
player.on('vertex', e => {
    showVertex(e, vertexs, debugLayer);
});
```

* `settime` it will when you setTime/setIndex/setPercent
* `reset`
* `cancel`
* `pause`
* `finish`

## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.
