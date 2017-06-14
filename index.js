import * as maptalks from 'maptalks';

export class Route {

    constructor(r) {
        this.route = r;
        this.path = r.path;
    }

    getCoordinates(t, map) {
        if (t < this.getStart() || t > this.getEnd()) {
            return null;
        }
        var idx = null;
        for (let i = 0, l = this.path.length; i < l; i++) {
            if (t < this.path[i][2]) {
                idx = i;
                break;
            }
        }
        if (idx === null) {
            idx = this.path.length - 1;
        }
        const p1 = this.path[idx - 1], p2 = this.path[idx],
            span = t - p1[2],
            r = span / (p2[2] - p1[2]);
        const x = p1[0] + (p2[0] - p1[0]) * r,
            y = p1[1] + (p2[1] - p1[1]) * r,
            coord = new maptalks.Coordinate(x, y),
            vp = map.coordinateToViewPoint(coord);
        const degree = maptalks.Util.computeDegree(map.coordinateToViewPoint(new maptalks.Coordinate(p1)), vp);
        return {
            'coordinate' : coord,
            'viewPoint' : vp,
            'degree' : degree,
            'index' : idx
        };
    }

    getStart() {
        return this.path[0][2];
    }

    getEnd() {
        return this.path[this.getCount() - 1][2];
    }

    getCount() {
        return this.path.length;
    }

    get markerSymbol() {
        return this.route.markerSymbol;
    }

    set markerSymbol(symbol) {
        this.route.markerSymbol = symbol;
        if (this._painter && this._painter.marker) {
            this._painter.marker.setSymbol(symbol);
        }
    }

    get lineSymbol() {
        return this.route.lineSymbol;
    }

    set lineSymbol(symbol) {
        this.route.lineSymbol = symbol;
        if (this._painter && this._painter.marker) {
            this._painter.line.setSymbol(symbol);
        }
    }
}

const options = {
    'unitTime' : 1 * 1000,
    'showRoutes' : true,
    'markerSymbol' : null,
    'lineSymbol' : {
        'lineWidth' : 2,
        'lineColor' : '#004A8D'
    }
};

export class RoutePlayer extends maptalks.Eventable(maptalks.Class) {

    constructor(routes, map, opts) {
        super(opts);
        if (!Array.isArray(routes)) {
            routes = [routes];
        }
        this.id = maptalks.Util.UID();
        this._map = map;
        this._setup(routes);
    }

    remove() {
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
    }

    play() {
        if (this.player.playState === 'running') {
            return this;
        }
        this.player.play();
        this.fire('playstart');
        return this;
    }

    pause() {
        if (this.player.playState === 'paused') {
            return this;
        }
        this.player.pause();
        this.fire('playpause');
        return this;
    }

    cancel() {
        this.player.cancel();
        this.played = 0;
        this._createPlayer();
        this._step({ 'styles':{ 't':0 }});
        this.fire('playcancel');
        return this;
    }

    finish() {
        if (this.player.playState === 'finished') {
            return this;
        }
        this.player.finish();
        this._step({ 'styles':{ 't':1 }});
        this.fire('playfinish');
        return this;
    }

    getStartTime() {
        return this.startTime || 0;
    }

    getEndTime() {
        return this.endTime || 0;
    }

    getCurrentTime() {
        if (!this.played) {
            return this.startTime;
        }
        return this.startTime + this.played;
    }

    setTime(t) {
        this.played = t - this.startTime;
        if (this.played < 0) {
            this.played = 0;
        }
        this._resetPlayer();
        return this;
    }

    getUnitTime() {
        return this.options['unitTime'];
    }

    setUnitTime(ut) {
        this.options['unitTime'] = +ut;
        this._resetPlayer();
    }

    getCurrentCoordinates(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }
        return this.routes[index]._painter.marker.getCoordinates();
    }

    getMarkerSymbol(idx) {
        if (this.routes && this.routes[idx]) {
            return this.routes[idx].markerSymbol;
        }
        return null;
    }

    setMarkerSymbol(idx, symbol) {
        if (this.routes && this.routes[idx]) {
            this.routes[idx].markerSymbol = symbol;
        }
        return this;
    }

    getLineSymbol(idx) {
        if (this.routes && this.routes[idx]) {
            return this.routes[idx].lineSymbol;
        }
        return null;
    }

    setLineSymbol(idx, symbol) {
        if (this.routes && this.routes[idx]) {
            this.routes[idx].lineSymbol = symbol;
        }
        return this;
    }

    _resetPlayer() {
        const playing = this.player && this.player.playState === 'running';
        if (playing) {
            this.player.finish();
        }
        this._createPlayer();
        if (playing) {
            this.player.play();
        }
    }

    _step(frame) {
        if (frame.state && frame.state.playState !== 'running') {
            if (frame.state.playState === 'finished') {
                this.fire('playfinish');
            }
            return;
        }
        this.played = this.duration * frame.styles.t;
        for (let i = 0, l = this.routes.length; i < l; i++) {
            this._drawRoute(this.routes[i], this.startTime + this.played);
        }
        this.fire('playing');
    }

    _drawRoute(route, t) {
        if (!this._map) {
            return;
        }
        const coordinates = route.getCoordinates(t, this._map);
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
            const marker = new maptalks.Marker(coordinates.coordinate, {
                symbol : route.markerSymbol || this.options['markerSymbol']
            }).addTo(this.markerLayer);
            route._painter.marker = marker;
        } else {
            route._painter.marker.setCoordinates(coordinates.coordinate);
        }
        if (!route._painter.line) {
            const line = new maptalks.LineString(route.path, {
                symbol : route.lineSymbol || this.options['lineSymbol']
            }).addTo(this.lineLayer);

            route._painter.line = line;
        }
    }

    _setup(rs) {
        const routes = rs.map(r => new Route(r));
        var start = routes[0].getStart(),
            end = routes[0].getEnd();
        for (let i = 1; i < routes.length; i++) {
            let route = routes[i];
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
    }

    _createPlayer() {
        const duration = (this.duration - this.played) / this.options['unitTime'];
        let framer;
        const renderer = this._map._getRenderer();
        if (renderer.callInFrameLoop) {
            framer = function (fn) {
                renderer.callInFrameLoop(fn);
            };
        }
        this.player = maptalks.animation.Animation.animate(
            {
                't' : [this.played / this.duration, 1]
            },
            {
                'framer' : framer,
                'speed' : duration,
                'easing' : 'linear'
            },
            this._step.bind(this)
        );
    }

    _createLayers() {
        this.lineLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id).addTo(this._map);
        this.markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id).addTo(this._map);
    }
}

RoutePlayer.mergeOptions(options);
