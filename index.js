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
        this._registerEvents();
        this._setup(routes);
    }

    remove() {
        this.finish();
        this._removeEvents();
        this.markerLayer.remove();
        this.lineLayer.remove();
        delete this._map;
    }

    play() {
        this.player.play();
        this.fire('playstart');
        return this;
    }

    pause() {
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
        this.player.finish();
        this._step({ 'styles':{ 't':1 }});
        this.fire('playfinish');
        return this;
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
            return;
        }
        if (!route._painter) {
            route._painter = {};
            const marker = new maptalks.Marker(coordinates.coordinate, {
                symbol : route.markerSymbol || this.options['markerSymbol']
            }).addTo(this.markerLayer);
            const line = new maptalks.LineString(route.path, {
                symbol : route.lineSymbol || this.options['lineSymbol']
            }).addTo(this.lineLayer);
            route._painter.marker = marker;
            route._painter.line = line;
        } else {
            route._painter.marker.setCoordinates(coordinates.coordinate);
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
        this.player = maptalks.animation.Animation.animate({ 't' : [this.played / this.duration, 1] }, { 'speed' : duration, 'easing' : 'linear' }, this._step.bind(this));
    }

    _createLayers() {
        this.lineLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id).addTo(this._map);
        this.markerLayer = new maptalks.VectorLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id).addTo(this._map);
    }

    _registerEvents() {
        this._map.on('zoomstart', this.onZoomStart, this)
            .on('zoomend', this.onZoomEnd, this);
    }

    _removeEvents() {
        this._map.off('zoomstart', this.onZoomStart, this)
            .off('zoomend', this.onZoomEnd, this);
    }

    onZoomStart() {
        if (!this.player) {
            return;
        }
        this.player.pause();
    }

    onZoomEnd() {
        if (!this.player) {
            return;
        }
        this.player.play();
    }
}

RoutePlayer.mergeOptions(options);
