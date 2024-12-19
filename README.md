# maptalks.routeplayer

[![NPM Version](https://img.shields.io/npm/v/maptalks.routeplayer.svg)](https://github.com/maptalks/maptalks.routeplayer)

Route Player plugin for maptalks.js.

*  support 2d/3d Layer.
* high-performance
* customizable
* Supports any map engine

![screenshot](https://user-images.githubusercontent.com/13678919/45591786-16929580-b98e-11e8-95fe-83ee73a15d1b.png)

## About Design

* This plugin focuses on the management, control, and scheduling of trajectory data. To ensure absolute low coupling(该插件专注于轨迹数据的管理、控制和调度。确保绝对低耦合)
* The source of trajectory data is not within the design scope. The data can come from GPS trajectories, mathematical equations, physical simulations, such as ABS(轨迹数据来源不在设计范围内。数据可以来自GPS轨迹、数学方程、物理模拟，如ABS)
* The display and consumption of data are fully entrusted to users. You can use any map engine, which can be 2D layers, 3D layers, 2D images, 3D models, etc. It's entirely up to you to decide(数据的展示消费完全委托给用户。您可以使用任何地图引擎，可以是二维图层、三维图层、二维图像、三维模型等。完全由您决定)

## Examples

* [Basic demo](https://maptalks.github.io/maptalks.routeplayer/demo/base.html).
* [Marker rotate](https://maptalks.github.io/maptalks.routeplayer/demo/marker-rotate.html).
* [with GLTFLayer](https://maptalks.github.io/maptalks.routeplayer/demo/gltflayer.html).
* [with ThreeLayer](https://maptalks.github.io/maptalks.routeplayer/demo/threelayer.html).
* [map animation](https://maptalks.github.io/maptalks.routeplayer/demo/map-animation.html).
* [simple road](https://maptalks.github.io/maptalks.routeplayer/demo/road.html).
* [simulated traffic](https://maptalks.github.io/maptalks.routeplayer/demo/traffic.html).
* [drive road](https://maptalks.github.io/maptalks.routeplayer/demo/drive.html).
* [test perf by VectorLayer](https://maptalks.github.io/maptalks.routeplayer/demo/perf-base.html).
* [test perf by GLTFLayer](https://maptalks.github.io/maptalks.routeplayer/demo/perf-3d.html).
* [test perf 800000 coordinate points](https://maptalks.github.io/maptalks.routeplayer/demo/perf-big.html).
* [coordinate stop](https://maptalks.github.io/maptalks.routeplayer/demo/coordinate-stop.html).
* [realtime-line](https://maptalks.github.io/maptalks.routeplayer/demo/real-line.html).
* [brige](https://maptalks.github.io/maptalks.routeplayer/demo/brige.html).
* [spring](https://maptalks.github.io/maptalks.routeplayer/demo/spring.html).
* [update data](https://maptalks.github.io/maptalks.routeplayer/demo/update-data.html).
* [UIMarker](https://maptalks.github.io/maptalks.routeplayer/demo/uimarker.html).
* [leaflet demo](https://maptalks.github.io/maptalks.routeplayer/demo/leaflet.html).

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

* support custom `unitTime`

```js
// the time unit is second
const route = [{
        coord: [120, 31, 0],
        t: 301
    },
    {
        coord: [122, 32, 0],
        t: 541
    },
    //other coordinates
];
const data = formatRouteData(route, {
    coordinateKey: 'coord',
    timeKey: 't',
    unitTime: 1000 //to millisecond
});
```

### `RoutePlayer`

#### constructor

```javascript
new RoutePlayer(routeData, options)
```

* `routeData`**Array** an object array containing routes data, from `formatRouteData` function run result 
* `options`**Object**
    - `options.unitTime` **Number** unit time, default is 1 ,Internally used milliseconds as a unit, if the time unit of your data is not milliseconds, please set its value,For example, if your data time unit is seconds, we can set it to 1000(内部使用毫秒作为单位，如果您的数据的时间单位不是毫秒，请设置其值。例如，如果您数据的时间单元是秒，我们可以将其设置为1000)
    - `options.speed` **Number** Play at double speed. Note that this is the speed of time playback, not the speed in physics. As for the speed of the path, it is determined by the time data in your path, which can be understood as the playback speed doubling function in video playback(注意这个是时间播放的速度，不是物理里的速度,至于路径的速度是有你的路径里时间数据决定，可以理解成视屏播放里的播放倍速功能)
    - `options.debug` **Boolean** 
    - `options.autoPlay` **Boolean** Whether auto play
    - `options.repeat` **Boolean** Whether repeat play

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
* `getCurrentVertex()`
* `getCoordinates()`

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

## Changelog

* 1.0.0-alpha.5

  + formatRouteData support `unitTime`
  + fix `unitTime` error when playing
  + Supports any map engine

* 1.0.0-alpha.3

  + Optimize getDistance performance
  + add `getCoordinates()` method

* 1.0.0-alpha.2

  + add `getCurrentVertex()` method

* 1.0.0-alpha.1
  + refactor [details](https://github.com/maptalks/maptalks.routeplayer/pull/46)
