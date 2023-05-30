import * as maptalks from 'maptalks';
import { LineStringLayer, PointLayer } from '@maptalks/gl-layers';

const TEMP_COORD = new maptalks.Coordinate([0, 0, 0]);
const TEMP_POINT1 = new maptalks.Point(0, 0), TEMP_POINT2 = new maptalks.Point(0, 0), TEMP_VEC_A = [], TEMP_VEC_B = [];
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
            if (t < this.path[i][3]) {
                idx = i;
                payload = this.path[i][4];
                break;
            }
        }
        if (idx === null) {
            idx = this.path.length - 1;
        }

        const p1 = this.path[idx - 1],
            p2 = this.path[idx],
            span = t - p1[3],
            r = span / (p2[3] - p1[3]);
        const x = p1[0] + (p2[0] - p1[0]) * r,
            y = p1[1] + (p2[1] - p1[1]) * r,
            z = p1[2] + (p2[2] - p1[2]) * r;
        const res = map.getGLRes();
        TEMP_COORD.set(x, y, z);
        const vp = map.coordinateToPointAtRes(TEMP_COORD, res);
        TEMP_COORD.set(p1[0], p1[1], p1[2]);
        const vp1 = map.coordinateToPointAtRes(TEMP_COORD, res);
        const degree = maptalks.Util.computeDegree(
            vp1.x, vp1.y,
            vp.x, vp.y
        );
        return {
            coordinate: new maptalks.Coordinate(x, y, z),
            viewPoint: vp,
            degree: degree,
            index: idx,
            payload: payload
        };
    }

    getStart() {
        return this.path[0][3];
    }

    getEnd() {
        return this.path[this.getCount() - 1][3];
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
    showMarker: true,
    maxTrailLine: 0,
    markerSymbol: null,
    lineSymbol: {
        lineWidth: 2,
        lineColor: '#004A8D'
    },
    trailLineSymbol : {
        lineColor: 'rgba(250,0,0,1)',
        lineWidth: 4,
        lineJoin: 'round', //miter, round, bevel
        lineCap: 'round', //butt, round, square
        lineDasharray: null, //dasharray, e.g. [10, 5, 5]
        'lineOpacity ': 1
    }
};

export class RoutePlayer extends maptalks.Eventable(maptalks.Class) {
    constructor(routes, groupgllayer, opts) {
        super(opts);
        if (!Array.isArray(routes)) {
            routes = [routes];
        }
        this.id = maptalks.Util.UID();
        this._gllayer = groupgllayer;
        this._setup(routes);
    }

    get map() {
        if (this._gllayer) {
            return this._gllayer.getMap();
        }
        return null;
    }

    remove() {
        if (!this.markerLayer) {
            return this;
        }
        this.player.playState = 'finished';
        this.markerLayer.remove();
        this.lineLayer.remove();
        this.trailLineLayer.remove();
        delete this.markerLayer;
        delete this.lineLayer;
        delete this.trailLineLayer;
        delete this._gllayer;
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
        this.trailLinePoints = [];
        let line = this.trailLineLayer.getGeometries()[0];
        if (line !== undefined && this.options['showTrail'])
            line.setCoordinates(this.trailLinePoints);
        this._createPlayer();
        this._step({ styles: { t: 0 }});
        const param = this._getParam('playcancel');
        this.fire('playcancel', param);
        return this;
    }

    finish() {
        if (this.player.playState === 'finished') {
            return this;
        }
        this.player.finish();
        this._step({ styles: { t: 1 }});
        return this;
    }

    _getParam(type) {
        const route = this.lineLayer.getGeometries()[0];
        const param = {};
        if (route) {
            const coordinates = route.getCoordinates();
            let idx = 0;
            if (type === 'playfinish') {
                idx = coordinates.length - 2;
            }
            const position = this._calPositions(coordinates[idx + 1], coordinates[idx]);
            param['bearing'] = position.bearing;
            param['pitch'] = position.pitch;
            param['coordinate'] = type === 'playfinish' ? coordinates[idx + 1] : coordinates[idx];
        }
        return param;
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

    getRoutes() {
        return this.routes;
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

    getMarker(index) {
        if (!index) {
            index = 0;
        }
        if (!this.routes[index] || !this.routes[index]._painter) {
            return null;
        }
        return this.routes[index]._painter.marker;
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
                const param = this._getParam('playfinish');
                this.fire('playfinish', param);
            }
            return;
        }
        this.played = this.duration * frame.styles.t;
        for (let i = 0, l = this.routes.length; i < l; i++) {
            this._drawRoute(this.routes[i], this.startTime + this.played);
        }
        if (this.trailLinePoints && this.trailLinePoints.length > 2) {
            const len = this.trailLinePoints.length;
            const currentCoordinate = this.trailLinePoints[len - 1];
            const lastCoordinate = this.trailLinePoints[len - 3];
            const position = this._calPositions(currentCoordinate, lastCoordinate);
            const { pitch, bearing, coordinate } = position;
            this.fire('playing', { pitch, bearing, coordinate, time: this.played });
        }
    }

    _drawRoute(route, t) {
        if (!this.map) {
            return;
        }
        const coordinates = route.getCoordinates(t, this.map);

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
            this.trailLinePoints.push(coordinates.coordinate);
            const maxLineCount = this.options['maxTrailLine'];
            if (maxLineCount !== 0 && this.trailLinePoints.length > maxLineCount) {
                this.trailLinePoints.shift();
            }
            if (this.trailLinePoints.length > 1 && this.options['showTrail']) {
                route._painter.trailLine.setCoordinates(this.trailLinePoints);
            }
        }
    }

    _calPositions(currentCoordinate, lastCoordinate) {
        const res = this.map.getGLRes();
        const currentPoint = this.map.coordinateToPointAtRes(currentCoordinate, res, TEMP_POINT1);
        const lastPoint = this.map.coordinateToPointAtRes(lastCoordinate, res, TEMP_POINT2);
        let bearing = maptalks.Util.computeDegree(currentPoint.x, currentPoint.y, lastPoint.x, lastPoint.y);
        const z0 = this.map.altitudeToPoint(currentCoordinate.z, res);
        const z1 = this.map.altitudeToPoint(lastCoordinate.z, res);
        const v0 = vector3(TEMP_VEC_A, currentPoint.x - lastPoint.x, currentPoint.y - lastPoint.y, 0);
        const v1 = vector3(TEMP_VEC_B, currentPoint.x - lastPoint.x, currentPoint.y - lastPoint.y, z0 - z1);
        let pitch = angleVector(v0, v1);
        if (v1[2] < 0) {
            pitch = Math.PI * 2 - pitch;
        }
        bearing = bearing / Math.PI * 180;
        pitch = pitch / Math.PI * 180;
        return { bearing, pitch, coordinate: currentCoordinate };
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
        const renderer = this.map.getRenderer();
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
        this.lineLayer = new LineStringLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id, [], { visible:this.options['showRoutes'], enableSimplify:false }
        ).addTo(this._gllayer);
        this.trailLineLayer = new LineStringLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_t_' + this.id, [], { visible:this.options['showTrail'], enableSimplify:false }
        ).addTo(this._gllayer);
        this.markerLayer = new PointLayer(
            maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id, [], { visible:this.options['showMarker'] }
        ).addTo(this._gllayer);
    }
}

function vector3(out, x, y, z) {
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
}

function angleVector(a, b) {
    let ax = a[0],
      ay = a[1],
      az = a[2],
      bx = b[0],
      by = b[1],
      bz = b[2],
      mag1 = Math.sqrt(ax * ax + ay * ay + az * az),
      mag2 = Math.sqrt(bx * bx + by * by + bz * bz),
      mag = mag1 * mag2,
      cosine = mag && dot(a, b) / mag;
    return Math.acos(Math.min(Math.max(cosine, -1), 1));
}

function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
RoutePlayer.mergeOptions(options);
