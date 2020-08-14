import * as maptalks from 'maptalks';

const markerRotation = [0, 0, 0];
export class Route {
    constructor(r) {
        this.route = r;
        this.path = r.path;
    }

    getCoordinates(t, map) {
        if (t < this.getStart() || t > this.getEnd()) {
            return null;
        }
        let idx = null;
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
            cp1 = map.coordinateToViewPoint(new maptalks.Coordinate(p1)),
            vp = map.coordinateToViewPoint(coord);
        const degree = 180 * maptalks.Util.computeDegree(cp1.x, -cp1.y, vp.x, -vp.y) / Math.PI;
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
    renderer: 'gl',
    markerType: 'marker',
    unitTime: 1 * 1000,
    showRoutes: true,
    showTrail: true,
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
    constructor(routes, map, opts) {
        super(opts);
        if (isGeoJSON(routes)) {
            this._routes = this._createRoutes(routes);
        } else {
            this._routes = routes;
        }
        if (!Array.isArray(this._routes)) {
            this._routes = [this._routes];
        }
        this.id = maptalks.Util.UID();
        this._map = map;
        this._setup(this._routes);
        this._initRotation();
    }

    _createRoutes(json) {
        const geometries = maptalks.GeoJSON.toGeometry(json).filter(geometry =>
            geometry.getType() === 'MultiLineString' || geometry.getType() === 'LineString'
        );
        const routes = [];
        for (let i = 0; i < geometries.length; i++) {
            const route = this._createSingleRoute(geometries[i]);
            routes.push(route);
        }
        return routes;
    }

    _createSingleRoute(geometry) {
        const prop = geometry.getProperties();
        const coordTimes = prop['coordTimes'];
        let singlePath = [];
        let coordinates = null;
        if (geometry.getType() === 'MultiLineString') {
            coordinates = geometry.getCoordinates();
        } else if (geometry.getType() === 'LineString') {
            coordinates = [geometry.getCoordinates()];
        }
        for (let i = 0; i < coordinates.length; i++) {
            const cTime = coordTimes[i];
            const coordinate = coordinates[i];
            const path = [];
            for (let j = 0; j < coordinate.length; j++) {
                const coord = coordinate[j];
                const t = new Date(cTime[j]).getTime();
                path.push([coord.x, coord.y, t]);
            }
            singlePath = singlePath.concat(path);
        }
        return {
            path: singlePath
        };
    }

    _initRotation() {
        const rotationCanvas = (this.options['markerSymbol'] && this.options['markerSymbol']['markerRotation']) || 0;
        const rotationGL = (this.options['markerSymbol'] && this.options['markerSymbol']['rotation']) || [0, 0, 0];
        if (this.options['renderer'] === 'canvas') {
            this._markerRotation = rotationCanvas;
        } else if (this.options['renderer'] === 'gl') {
            if (this.options['markerType'] === 'gltf') {
                this._markerRotation = rotationGL;
            } else if (this.options['markerType'] === 'marker') {
                this._markerRotation = rotationCanvas;
            }
        }
    }

    _isInGroupGLLayer() {
        return this.options['renderer'] === 'gl' && this.options['groupgllayer'] && this.options['groupgllayer'] instanceof maptalks.GroupGLLayer;
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
        const line = this.trailLineLayer.getGeometries()[0];
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
        const line = this.trailLineLayer.getGeometries()[0];
        const coors = this.routes[0].path.map(item=>{
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
        if (!this.routes[index] || !this.routes[index]._painter || !this.routes[index]._painter.marker) {
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
            if (this.options['renderer'] === 'canvas') {
                route._painter.marker = new maptalks.Marker(coordinates.coordinate, {
                    symbol: route.markerSymbol || this.options['markerSymbol']
                }).addTo(this.markerLayer);
            } else if (this.options['renderer'] === 'gl') {
                //如果route自定义过markerType，以自定义的为准
                if (route['markerType']) {
                    if (route['markerType'] === 'gltf') {
                        route._painter.marker = new maptalks.GLTFMarker(coordinates.coordinate, {
                            symbol: route.markerSymbol || this.options['markerSymbol']
                        }).addTo(this.markerLayer);
                    } else if (route['markerType'] === 'marker') {
                        route._painter.marker = new maptalks.GLTFMarker(coordinates.coordinate, {
                            symbol: route.markerSymbol || this.options['markerSymbol']
                        });
                        //为了满足混合模式，需要构建一个PointLayer
                        this._markerPointerLayer = this._markerPointerLayer || new maptalks.PointLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id).addTo(this._map);
                        route._painter.marker.addTo(this._markerPointerLayer);
                    }
                } else {
                    route._painter.marker = this.options['markerType'] === 'gltf' ? new maptalks.GLTFMarker(coordinates.coordinate, {
                        symbol: route.markerSymbol || this.options['markerSymbol']
                    }).addTo(this.markerLayer) : new maptalks.Marker(coordinates.coordinate, {
                        symbol: route.markerSymbol || this.options['markerSymbol']
                    }).addTo(this.markerLayer);
                }
            }
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
            this.trailLinePoints.push(coordinates.coordinate);
            if (this.trailLinePoints.length > 1) {
                route._painter.trailLine.setCoordinates(this.trailLinePoints);
            }
        }
        if (this.options['renderer'] === 'canvas') {
            route._painter.marker.updateSymbol({
                markerRotation: this._markerRotation + coordinates.degree
            });
        } else if (this.options['renderer'] === 'gl') {
            if (this.options['markerType'] === 'gltf') {
                markerRotation[0] = this._markerRotation[0];
                markerRotation[1] = this._markerRotation[1];
                markerRotation[2] = this._markerRotation[2] + coordinates.degree;
                route._painter.marker.setRotation(markerRotation[0], markerRotation[1], markerRotation[2]);
            } else if (this.options['markerType'] === 'marker') {
                route._painter.marker.updateSymbol({
                    markerRotation: this._markerRotation + coordinates.degree
                });
            }

        }
    }

    _setup(rs) {
        const routes = rs.map(r => new Route(r));
        let start = routes[0].getStart(),
            end = routes[0].getEnd();
        for (let i = 1; i < routes.length; i++) {
            const route = routes[i];
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
        if (this._isInGroupGLLayer()) {
            this._groupgllayer = this.options['groupgllayer'];
            if (!this._groupgllayer.getMap()) {
                this._groupgllayer.addTo(this._map);
            }
        }
        this._createLayers();
        this._createPlayer();
    }

    _createPlayer() {
        const duration =
            (this.duration - this.played) / this.options['unitTime'];
        let framer;
        const renderer = this._map['_getRenderer']();
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
        if (this.options['renderer'] === 'canvas') {
            this.lineLayer = new maptalks.VectorLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id, [], { visible:this.options['showRoutes'], enableSimplify:false }
            ).addTo(this._map);
            this.trailLineLayer = new maptalks.VectorLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_t_' + this.id, [], { visible:this.options['showTrail'], enableSimplify:false }
            ).addTo(this._map);
            this.markerLayer = new maptalks.VectorLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id
            ).addTo(this._map);
        } else if (this.options['renderer'] === 'gl') {
            this.lineLayer = new maptalks.LineStringLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_r_' + this.id, [], { visible:this.options['showRoutes'], enableSimplify:false }
            );
            this.trailLineLayer = new maptalks.LineStringLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_t_' + this.id, [], { visible:this.options['showRoutes'], enableSimplify:false }
            );
            this.markerLayer = this.options['markerType'] === 'gltf' ? new maptalks.GLTFLayer(
                maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id,
                {
                    fitSize: (this.options['layerOptions'] && this.options['layerOptions']['fitSize']) || 30
                }
            ) : new maptalks.PointLayer(maptalks.INTERNAL_LAYER_PREFIX + '_routeplay_m_' + this.id);
            if (this._isInGroupGLLayer()) {
                this.lineLayer.addTo(this._groupgllayer);
                this.trailLineLayer.addTo(this._groupgllayer);
                this.markerLayer.addTo(this._groupgllayer);
            } else {
                this.lineLayer.addTo(this._map);
                this.trailLineLayer.addTo(this._map);
                this.markerLayer.addTo(this._map);
            }
        }
    }
}

RoutePlayer.mergeOptions(options);

const GEOJSON_TYPES = [
    // geometries
    'Point',
    'Polygon',
    'LineString',
    'MultiPoint',
    'MultiPolygon',
    'MultiLineString',
    'GeometryCollection',
    'Feature',
    'FeatureCollection']
    .reduce((memo, t) => {
        memo[t] = true;
        return memo;
    }, {});

function isGeoJSON(geoJSON) {
    if (!geoJSON || typeof geoJSON !== 'object') return false;
    if (!geoJSON.type) return false;
    if (!GEOJSON_TYPES[geoJSON.type]) return false;
    return true;
}
