/*!
 * maptalks.routeplayer v0.1.0
 * LICENSE : MIT
 * (c) 2016-2023 maptalks.org
 */
/*!
 * requires maptalks@^1.0.0-rc.18 
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('maptalks')) :
	typeof define === 'function' && define.amd ? define(['exports', 'maptalks'], factory) :
	(factory((global.maptalks = global.maptalks || {}),global.maptalks));
}(this, (function (exports,maptalks) { 'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defaults(obj, defaults) { var keys = Object.getOwnPropertyNames(defaults); for (var i = 0; i < keys.length; i++) { var key = keys[i]; var value = Object.getOwnPropertyDescriptor(defaults, key); if (value && value.configurable && obj[key] === undefined) { Object.defineProperty(obj, key, value); } } return obj; }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : _defaults(subClass, superClass); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TEMP_COORD = new maptalks.Coordinate([0, 0, 0]);
var Route = function () {
    function Route(r) {
        _classCallCheck(this, Route);

        this.route = r;
        this.path = r.path;
    }

    Route.prototype.getCoordinates = function getCoordinates(t, map) {
        if (t < this.getStart() || t > this.getEnd()) {
            return null;
        }
        var idx = null;
        var payload = null;
        for (var i = 0, l = this.path.length; i < l; i++) {
            if (t < this.path[i][3]) {
                idx = i;
                payload = this.path[i][4];
                break;
            }
        }
        if (idx === null) {
            idx = this.path.length - 1;
        }

        var p1 = this.path[idx - 1],
            p2 = this.path[idx],
            span = t - p1[3],
            r = span / (p2[3] - p1[3]);
        var x = p1[0] + (p2[0] - p1[0]) * r,
            y = p1[1] + (p2[1] - p1[1]) * r,
            z = p1[2] + (p2[2] - p1[2]) * r;
        var res = map.getGLRes();
        TEMP_COORD.x = x, TEMP_COORD.y = y, TEMP_COORD.z = z;
        var vp = map.coordinateToPointAtRes(TEMP_COORD, res);
        TEMP_COORD.x = p1[0], TEMP_COORD.y = p1[1], TEMP_COORD.z = p1[2];
        var vp1 = map.coordinateToPointAtRes(TEMP_COORD, res);
        var degree = maptalks.Util.computeDegree(vp1.x, vp1.y, vp.x, vp.y);
        return {
            coordinate: new maptalks.Coordinate(x, y, z),
            viewPoint: vp,
            degree: degree,
            index: idx,
            payload: payload
        };
    };

    Route.prototype.getStart = function getStart() {
        return this.path[0][3];
    };

    Route.prototype.getEnd = function getEnd() {
        return this.path[this.getCount() - 1][3];
    };

    Route.prototype.getCount = function getCount() {
        return this.path.length;
    };

    _createClass(Route, [{
        key: 'markerSymbol',
        get: function get() {
            return this.route.markerSymbol;
        },
        set: function set(symbol) {
            this.route.markerSymbol = symbol;
            if (this._painter && this._painter.marker) {
                this._painter.marker.setSymbol(symbol);
            }
        }
    }, {
        key: 'lineSymbol',
        get: function get() {
            return this.route.lineSymbol;
        },
        set: function set(symbol) {
            this.route.lineSymbol = symbol;
            if (this._painter && this._painter.marker) {
                this._painter.line.setSymbol(symbol);
            }
        }
    }, {
        key: 'trailLineSymbol',
        get: function get() {
            return this.route.trailLineSymbol;
        },
        set: function set(symbol) {
            this.route.trailLineSymbol = symbol;
            if (this._painter && this._painter.marker) {
                this._painter.trailLine.setSymbol(symbol);
            }
        }
    }]);

    return Route;
}();

var options = {
    unitTime: 1 * 1000,
    showRoutes: true,
    showTrail: true,
    maxTrailLine: 0,
    markerSymbol: null,
    lineSymbol: {
        lineWidth: 2,
        lineColor: '#004A8D'
    },
    trailLineSymbol: {
        lineColor: 'rgba(250,0,0,1)',
        lineWidth: 4,
        lineJoin: 'round', //miter, round, bevel
        lineCap: 'round', //butt, round, square
        lineDasharray: null, //dasharray, e.g. [10, 5, 5]
        'lineOpacity ': 1
    }
};

var RoutePlayer = function (_maptalks$Eventable) {
    _inherits(RoutePlayer, _maptalks$Eventable);

    function RoutePlayer(routes, map, opts) {
        _classCallCheck(this, RoutePlayer);

        var _this = _possibleConstructorReturn(this, _maptalks$Eventable.call(this, opts));

        if (!Array.isArray(routes)) {
            routes = [routes];
        }
        _this.id = maptalks.Util.UID();
        _this._map = map;
        _this._setup(routes);
        return _this;
    }

    RoutePlayer.prototype.remove = function remove() {
        if (!this.markerLayer) {
            return this;
        }
        this.finish();
        this.markerLayer.remove();
        this.lineLayer.remove();
        this.trailLineLayer.remove();
        delete this.markerLayer;
        delete this.lineLayer;
        delete this.trailLineLayer;
        delete this._map;
        return this;
    };

    RoutePlayer.prototype.play = function play() {
        if (this.player.playState === 'running') {
            return this;
        }
        this.player.play();
        this.fire('playstart');
        return this;
    };

    RoutePlayer.prototype.pause = function pause() {
        if (this.player.playState === 'paused') {
            return this;
        }
        this.player.pause();
        this.fire('playpause');
        return this;
    };

    RoutePlayer.prototype.cancel = function cancel() {
        this.player.cancel();
        this.played = 0;
        this.trailLinePoints = [];
        var line = this.trailLineLayer.getGeometries()[0];
        if (line !== undefined) line.setCoordinates(this.trailLinePoints);
        this._createPlayer();
        this._step({ styles: { t: 0 } });
        this.fire('playcancel');
        return this;
    };

    RoutePlayer.prototype.finish = function finish() {
        if (this.player.playState === 'finished') {
            return this;
        }

        // complete trail line
        var line = this.trailLineLayer.getGeometries()[0];
        var coors = this.routes[0].path.map(function (item) {
            return [item[0], item[1]];
        });
        this.trailLinePoints = coors;
        line.setCoordinates(this.trailLinePoints);

        this.player.finish();
        this._step({ styles: { t: 1 } });
        this.fire('playfinish');
        return this;
    };

    RoutePlayer.prototype.getStartTime = function getStartTime() {
        return this.startTime || 0;
    };

    RoutePlayer.prototype.getEndTime = function getEndTime() {
        return this.endTime || 0;
    };

    RoutePlayer.prototype.getCurrentTime = function getCurrentTime() {
        if (!this.played) {
            return this.startTime;
        }
        return this.startTime + this.played;
    };

    RoutePlayer.prototype.getRoutes = function getRoutes() {
        return this.routes;
    };

    RoutePlayer.prototype.setTime = function setTime(t) {
        this.played = t - this.startTime;
        if (this.played < 0) {
            this.played = 0;
        }
        this._resetPlayer();
        return this;
    };

    RoutePlayer.prototype.getUnitTime = function getUnitTime() {
        return this.options['unitTime'];
    };

    RoutePlayer.prototype.setUnitTime = function setUnitTime(ut) {
        this.options['unitTime'] = +ut;
        this._resetPlayer();
    };

    RoutePlayer.prototype.getCurrentProperties = function getCurrentProperties(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }

        return this.routes[index]._painter.marker.getProperties();
    };

    RoutePlayer.prototype.getCurrentCoordinates = function getCurrentCoordinates(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }
        return this.routes[index]._painter.marker.getCoordinates();
    };

    RoutePlayer.prototype.getMarkerSymbol = function getMarkerSymbol(idx) {
        if (this.routes && this.routes[idx]) {
            return this.routes[idx].markerSymbol;
        }
        return null;
    };

    RoutePlayer.prototype.getMarker = function getMarker(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }
        return this.routes[index]._painter.marker;
    };

    RoutePlayer.prototype.setMarkerSymbol = function setMarkerSymbol(idx, symbol) {
        if (this.routes && this.routes[idx]) {
            this.routes[idx].markerSymbol = symbol;
        }
        return this;
    };

    RoutePlayer.prototype.getLineSymbol = function getLineSymbol(idx) {
        if (this.routes && this.routes[idx]) {
            return this.routes[idx].lineSymbol;
        }
        return null;
    };

    RoutePlayer.prototype.setLineSymbol = function setLineSymbol(idx, symbol) {
        if (this.routes && this.routes[idx]) {
            this.routes[idx].lineSymbol = symbol;
        }
        return this;
    };

    RoutePlayer.prototype.showRoute = function showRoute() {
        this.lineLayer.show();
    };

    RoutePlayer.prototype.showTrail = function showTrail() {
        this.trailLineLayer.show();
    };

    RoutePlayer.prototype.hideRoute = function hideRoute() {
        this.lineLayer.hide();
    };

    RoutePlayer.prototype.hideTrail = function hideTrail() {
        this.trailLineLayer.hide();
    };

    RoutePlayer.prototype._resetPlayer = function _resetPlayer() {
        var playing = this.player && this.player.playState === 'running';
        if (playing) {
            this.player.finish();
        }
        this._createPlayer();
        if (playing) {
            this.player.play();
        }
    };

    RoutePlayer.prototype._step = function _step(frame) {
        if (frame.state && frame.state.playState !== 'running') {
            if (frame.state.playState === 'finished') {
                this.fire('playfinish');
            }
            return;
        }
        this.played = this.duration * frame.styles.t;
        for (var i = 0, l = this.routes.length; i < l; i++) {
            this._drawRoute(this.routes[i], this.startTime + this.played);
        }
        var position = this._calPositions();
        if (position) {
            var rotationX = position.rotationX,
                rotationZ = position.rotationZ,
                coordinate = position.coordinate;

            this.fire('playing', { rotationX: rotationX, rotationZ: rotationZ, coordinate: coordinate, time: this.played });
        }
    };

    RoutePlayer.prototype._drawRoute = function _drawRoute(route, t) {
        if (!this._map) {
            return;
        }
        var coordinates = route.getCoordinates(t, this._map);

        if (!coordinates) {
            if (route._painter && route._painter.marker) {
                route._painter.marker.remove();
                delete route._painter.marker;
            }
            return;
        }
        if (!route._painter) {
            route._painter = {};
        }
        if (!route._painter.marker) {
            var marker = new maptalks.Marker(coordinates.coordinate, {
                symbol: route.markerSymbol || this.options['markerSymbol']
            }).addTo(this.markerLayer);
            route._painter.marker = marker;
        } else {
            route._painter.marker.setProperties(coordinates.payload);
            route._painter.marker.setCoordinates(coordinates.coordinate);
        }
        if (!route._painter.line) {
            var altitudes = route.path.map(function (c) {
                return c[2];
            });
            var line = new maptalks.LineString(route.path, {
                symbol: route.lineSymbol || this.options['lineSymbol'],
                properties: {
                    altitude: altitudes
                }
            }).addTo(this.lineLayer);

            route._painter.line = line;
        }

        if (!route._painter.trailLine) {
            this.trailLinePoints = [coordinates.coordinate];
            var trailLine = new maptalks.LineString([], {
                symbol: route.trailLineSymbol || this.options['trailLineSymbol'],
                properties: {
                    altitude: [coordinates.altitude]
                }
            }).addTo(this.trailLineLayer);
            route._painter.trailLine = trailLine;
        } else {
            // remove extra trail point by maxTrailLine, 0 => disable
            var maxLineCount = this.options['maxTrailLine'];
            if (maxLineCount !== 0 && this.trailLinePoints.length > maxLineCount) {
                this.trailLinePoints.shift();
                var _altitudes = route._painter.trailLine.getProperties().altitude;
                _altitudes.shift();
            }

            this.trailLinePoints.push(coordinates.coordinate);
            if (this.trailLinePoints.length > 1) {
                route._painter.trailLine.setCoordinates(this.trailLinePoints);
                var _altitudes2 = route._painter.trailLine.getProperties().altitude;
                _altitudes2.push(coordinates.altitude);
            }
        }
    };

    RoutePlayer.prototype._calPositions = function _calPositions() {
        if (this.trailLinePoints && this.trailLinePoints.length > 1) {
            var len = this.trailLinePoints.length;
            var currentCoordinate = this.trailLinePoints[len - 1];
            var lastCoordinate = this.trailLinePoints[len - 2];
            var res = this._map.getGLRes();
            var currentPoint = this._map.coordinateToPointAtRes(currentCoordinate, res);
            var lastPoint = this._map.coordinateToPointAtRes(lastCoordinate, res);
            var angleZ = maptalks.Util.computeDegree(currentPoint.x, currentPoint.y, lastPoint.x, lastPoint.y);
            var z0 = this._map.altitudeToPoint(currentCoordinate.z, res);
            var z1 = this._map.altitudeToPoint(lastCoordinate.z, res);
            var angleY = maptalks.Util.computeDegree(lastPoint.x, z1, currentPoint.x, z0);
            var rotationZ = angleZ / Math.PI * 180;
            var rotationX = angleY / Math.PI * 180;
            if (currentCoordinate.x >= lastCoordinate.x) {
                rotationX = -rotationX;
            } else {
                rotationX += 180;
            }
            return { rotationZ: rotationZ, rotationX: rotationX, coordinate: currentCoordinate };
        }
    };

    RoutePlayer.prototype._setup = function _setup(rs) {
        var routes = rs.map(function (r) {
            return new Route(r);
        });
        var start = routes[0].getStart(),
            end = routes[0].getEnd();
        for (var i = 1; i < routes.length; i++) {
            var route = routes[i];
            if (route.getStart() < start) {
                start = route.getStart();
            }
            if (route.getEnd() > end) {
                end = route.getEnd();
            }
        }
        this.trailLinePoints = [];
        this.routes = routes;
        this.startTime = start;
        this.endTime = end;
        this.played = 0;
        this.duration = end - start;
        this._createLayers();
        this._createPlayer();
    };

    RoutePlayer.prototype._createPlayer = function _createPlayer() {
        var duration = (this.duration - this.played) / this.options['unitTime'];
        var framer = void 0;
        var renderer = this._map._getRenderer();
        if (renderer.callInFrameLoop) {
            framer = function framer(fn) {
                renderer.callInFrameLoop(fn);
            };
        }
        this.player = maptalks.animation.Animation.animate({
            t: [this.played / this.duration, 1]
        }, {
            framer: framer,
            speed: duration,
            easing: 'linear'
        }, this._step.bind(this));
    };

    RoutePlayer.prototype._createLayers = function _createLayers() {
        this.lineLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id, [], { visible: this.options['showRoutes'], enableSimplify: false, enableAltitude: true }).addTo(this._map);
        this.trailLineLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_t_' + this.id, [], { visible: this.options['showTrail'], enableSimplify: false, enableAltitude: true }).addTo(this._map);
        this.markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id).addTo(this._map);
    };

    return RoutePlayer;
}(maptalks.Eventable(maptalks.Class));

RoutePlayer.mergeOptions(options);

exports.Route = Route;
exports.RoutePlayer = RoutePlayer;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.routeplayer v0.1.0, requires maptalks@^1.0.0-rc.18.');

})));
