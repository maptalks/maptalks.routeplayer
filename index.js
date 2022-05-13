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
        let payload = null;
        for (let i = 0, l = this.path.length; i < l; i++) {
            if (t < this.path[i][2]) {
                idx = i;
                payload = this.path[i][3];
                break;
            }
        }
        if (idx === null) {
            idx = this.path.length - 1;
        }

        const p1 = this.path[idx - 1],
            p2 = this.path[idx],
            span = t - p1[2],
            r = span / (p2[2] - p1[2]);
        const x = p1[0] + (p2[0] - p1[0]) * r,
            y = p1[1] + (p2[1] - p1[1]) * r,
            coord = new maptalks.Coordinate(x, y),
            vp = map.coordinateToViewPoint(coord);
        const degree = maptalks.Util.computeDegree(
            map.coordinateToViewPoint(new maptalks.Coordinate(p1)),
            vp
        );
        return {
            coordinate: coord,
            viewPoint: vp,
            degree: degree,
            index: idx,
            payload: payload
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

    get trailLineSymbol() {
        return this.route.trailLineSymbol;
    }

    set trailLineSymbol(symbol) {
        this.route.trailLineSymbol = symbol;
        if (this._painter && this._painter.marker) {
            this._painter.trailLine.setSymbol(symbol);
        }
    }
}

const options = {
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

function degreesToRadians(degrees) {
    return (degrees % 360) * Math.PI / 180;
}

function radiansToDegrees(radians) {
    const degrees = radians % (2 * Math.PI);
    return (degrees * 180) / Math.PI;
}

function computeBearing(c1, c2) {
    const lon1 = degreesToRadians(c1.x || c1[0]);
    const lat1 = degreesToRadians(c1.y || c1[1]);
    const lon2 = degreesToRadians(c2.x || c2[0]);
    const lat2 = degreesToRadians(c2.y || c2[1]);
    const a = Math.sin(lon2 - lon1) * Math.cos(lat2);
    const b =
        Math.cos(lat1) * Math.sin(lat2) -
        Math.sin(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1);
    return radiansToDegrees(Math.atan2(a, b));
}

export class RoutePlayer extends maptalks.Eventable(maptalks.Class) {
    constructor(routes, map, opts) {
        super(opts);
        if (!Array.isArray(routes)) {
            routes = [routes];
        }
        this.id = maptalks.Util.UID();
        this._map = map;
        this._follow = opts['perspectiveFollow'];
        this._historyConfig = {};
        this._setup(routes);
    }

    remove() {
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
    }

    play() {
        if (this.player.playState === 'running') {
            return this;
        }
        this.player.play();
        if (this._follow) {
            this._setFollowView();
        }
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
        this.trailLinePoints = [];
        let line = this.trailLineLayer.getGeometries()[0];
        if (line !== undefined)
            line.setCoordinates(this.trailLinePoints);
        this._createPlayer();
        this._step({ styles: { t: 0 }});
        this.fire('playcancel');
        return this;
    }

    finish() {
        if (this.player.playState === 'finished') {
            return this;
        }

        // complete trail line
        let line = this.trailLineLayer.getGeometries()[0];
        let coors = this.routes[0].path.map(item => {
            return [item[0], item[1]];
        });
        this.trailLinePoints = coors;
        line.setCoordinates(this.trailLinePoints);

        this.player.finish();
        this._step({ styles: { t: 1 }});
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

    getCurrentProperties(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }

        return this.routes[index]._painter.marker.getProperties();
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

    showRoute() {
        this.lineLayer.show();
    }

    showTrail() {
        this.trailLineLayer.show();
    }

    hideRoute() {
        this.lineLayer.hide();
    }

    hideTrail() {
        this.trailLineLayer.hide();
    }

    enableFollow() {
        this._setFollowView();
        this._follow = true;
    }

    disabledFollow() {
        this._follow = false;
        // this._map.setZoom(this._historyConfig.zoom);
        this._map.setPitch(this._historyConfig.pitch);
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
                symbol: route.markerSymbol || this.options['markerSymbol']
            }).addTo(this.markerLayer);
            route._painter.marker = marker;
        } else {
            route._painter.marker.setProperties(coordinates.payload);
            route._painter.marker.setCoordinates(coordinates.coordinate);
        }
        if (!route._painter.line) {
            const line = new maptalks.LineString(route.path, {
                symbol: route.lineSymbol || this.options['lineSymbol']
            }).addTo(this.lineLayer);

            route._painter.line = line;
        }

        if (!route._painter.trailLine) {
            this.trailLinePoints = [coordinates.coordinate];
            const trailLine = new maptalks.LineString([], {
                symbol: route.trailLineSymbol || this.options['trailLineSymbol']
            }).addTo(this.trailLineLayer);
            route._painter.trailLine = trailLine;
        } else {
            // remove extra trail point by maxTrailLine, 0 => disable
            const maxLineCount = this.options['maxTrailLine'];
            if (maxLineCount !== 0 && this.trailLinePoints.length > maxLineCount) {
                this.trailLinePoints.shift();
            }

            this.trailLinePoints.push(coordinates.coordinate);
            if (this.trailLinePoints.length > 1) {
                route._painter.trailLine.setCoordinates(this.trailLinePoints);
            }
        }
        if (this._follow) {
            this._perspectiveFollow();
        }
        this._preCoordinate = coordinates.coordinate;
    }

    _perspectiveFollow() {
        const currentCoordinate = this.getCurrentCoordinates();
        if (!this._preCoordinate || !currentCoordinate) return;
        const map = this._map;
        const bearing = this._getBearing(this._preCoordinate, currentCoordinate);
        map.setCenter(currentCoordinate);
        map.setBearing(bearing);
    }

    _setFollowView() {
        this._map.setZoom(17);
        this._map.setPitch(65);
    }

    _getBearing(c1, c2) {
        const bearing = computeBearing(c1, c2);
        const mapBearing = this._map.getBearing();
        if (Math.abs(mapBearing - bearing) < 30) {
            return mapBearing;
        }
        return bearing;
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
        this.trailLinePoints = [];
        this.routes = routes;
        this.startTime = start;
        this.endTime = end;
        this.played = 0;
        this.duration = end - start;
        this._createLayers();
        this._createPlayer();
    }

    _createPlayer() {
        const duration =
            (this.duration - this.played) / this.options['unitTime'];
        let framer;
        const renderer = this._map._getRenderer();
        if (renderer.callInFrameLoop) {
            framer = function (fn) {
                renderer.callInFrameLoop(fn);
            };
        }
        this.player = maptalks.animation.Animation.animate(
            {
                t: [this.played / this.duration, 1]
            },
            {
                framer: framer,
                speed: duration,
                easing: 'linear'
            },
            this._step.bind(this)
        );
    }

    _createLayers() {
        this.lineLayer = new maptalks.VectorLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id, [], {
                visible: this.options['showRoutes'],
                enableSimplify: false
            }
        ).addTo(this._map);
        this.trailLineLayer = new maptalks.VectorLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_t_' + this.id, [], {
                visible: this.options['showTrail'],
                enableSimplify: false
            }
        ).addTo(this._map);
        this.markerLayer = new maptalks.VectorLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id
        ).addTo(this._map);
    }
}

RoutePlayer.mergeOptions(options);
