/*!
 * maptalks.routeplayer v0.1.0
 * LICENSE : MIT
 * (c) 2016-2017 maptalks.org
 */
/*!
 * requires maptalks@^0.23.0 
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
        for (var i = 0, l = this.path.length; i < l; i++) {
            if (t < this.path[i][2]) {
                idx = i;
                break;
            }
        }
        if (idx === null) {
            idx = this.path.length - 1;
        }
        var p1 = this.path[idx - 1],
            p2 = this.path[idx],
            span = t - p1[2],
            r = span / (p2[2] - p1[2]);
        var x = p1[0] + (p2[0] - p1[0]) * r,
            y = p1[1] + (p2[1] - p1[1]) * r,
            coord = new maptalks.Coordinate(x, y),
            vp = map.coordinateToViewPoint(coord);
        var degree = maptalks.Util.computeDegree(map.coordinateToViewPoint(new maptalks.Coordinate(p1)), vp);
        return {
            'coordinate': coord,
            'viewPoint': vp,
            'degree': degree,
            'index': idx
        };
    };

    Route.prototype.getStart = function getStart() {
        return this.path[0][2];
    };

    Route.prototype.getEnd = function getEnd() {
        return this.path[this.getCount() - 1][2];
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
    }]);

    return Route;
}();

var options = {
    'unitTime': 1 * 1000,
    'showRoutes': true,
    'markerSymbol': null,
    'lineSymbol': {
        'lineWidth': 2,
        'lineColor': '#004A8D'
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
        delete this.markerLayer;
        delete this.lineLayer;
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
        this._createPlayer();
        this._step({ 'styles': { 't': 0 } });
        this.fire('playcancel');
        return this;
    };

    RoutePlayer.prototype.finish = function finish() {
        if (this.player.playState === 'finished') {
            return this;
        }
        this.player.finish();
        this._step({ 'styles': { 't': 1 } });
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
        this.fire('playing');
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
            route._painter.marker.setCoordinates(coordinates.coordinate);
        }
        if (!route._painter.line) {
            var line = new maptalks.LineString(route.path, {
                symbol: route.lineSymbol || this.options['lineSymbol']
            }).addTo(this.lineLayer);

            route._painter.line = line;
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
            't': [this.played / this.duration, 1]
        }, {
            'framer': framer,
            'speed': duration,
            'easing': 'linear'
        }, this._step.bind(this));
    };

    RoutePlayer.prototype._createLayers = function _createLayers() {
        this.lineLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id).addTo(this._map);
        this.markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id).addTo(this._map);
    };

    return RoutePlayer;
}(maptalks.Eventable(maptalks.Class));

RoutePlayer.mergeOptions(options);

exports.Route = Route;
exports.RoutePlayer = RoutePlayer;

Object.defineProperty(exports, '__esModule', { value: true });

typeof console !== 'undefined' && console.log('maptalks.routeplayer v0.1.0, requires maptalks@^0.23.0.');

})));
