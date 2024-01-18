import * as maptalks from 'maptalks';
// import getDistance from 'geolib/es/getDistance';
import getRhumbLineBearing from 'geolib/es/getRhumbLineBearing';
const isArray = Array.isArray;
const { isNumber, extend, now, isObject, GUID } = maptalks.Util;

type Coordinate = Array<number>;
type DataItem = {
    coordinate: Coordinate,
    time?: number,
    _time?: number,
    _distance?: number,
    _passed?: boolean
};

type RoutePlayerOptions = {
    speed?: number,
    unitTime?: number,
    debug?: boolean,
    autoPlay?: boolean,
    repeat?: boolean
};
type FormatDataOptions = {
    duration?: number,
    coordinateKey?: string,
    timeKey?: string
}


const pi = Math.PI / 180;
const R = 6378137;

function toRadian(d: number) {
    return d * pi;
}

//from maptalks.js https://github.com/maptalks/maptalks.js/blob/7ad5d423bb3ffb6afad582da7d18f6e9e5bee041/src/geo/measurer/Sphere.js#L18
function measureLenBetween(c1: Coordinate, c2: Coordinate) {
    if (!c1 || !c2) {
        return 0;
    }
    let b = toRadian(c1[1]);
    const d = toRadian(c2[1]),
        e = b - d,
        f = toRadian(c1[0]) - toRadian(c2[0]);
    b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
    b *= R;
    return b;
}

function coordinateEqual(c1: Coordinate, c2: Coordinate): boolean {
    const x1 = c1[0], y1 = c1[1], z1 = c1[2];
    const x2 = c2[0], y2 = c2[1], z2 = c2[2];
    return x1 === x2 && y1 === y2 && z1 === z2;
}

function calDistance(c1: Coordinate, c2: Coordinate): number {
    const d = measureLenBetween(c1, c2);
    const dz = c2[2] - c1[2];
    if (dz === 0) {
        return d;
    }
    return Math.sqrt(d * d + dz * dz);
}

function getCoordinateByPercent(c1: Coordinate, c2: Coordinate, percent: number): Coordinate {
    const x1 = c1[0], y1 = c1[1], z1 = c1[2];
    const x2 = c2[0], y2 = c2[1], z2 = c2[2];
    const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
    return [x1 + dx * percent, y1 + dy * percent, z1 + dz * percent];
}

function getRotationZ(c1: Coordinate, c2: Coordinate, routePlayer: RoutePlayer): number {
    if (coordinateEqual(c1, c2)) {
        return routePlayer.tempRotationZ;
    }
    const bearing = getRhumbLineBearing((c1 as any), (c2 as any));
    const rotaionZ = -bearing;
    routePlayer.tempRotationZ = rotaionZ;
    return rotaionZ;
}

function getRotationX(c1: Coordinate, c2: Coordinate, routePlayer: RoutePlayer) {
    if (coordinateEqual(c1, c2)) {
        return routePlayer.tempRotaionX;
    }
    const z1 = c1[2], z2 = c2[2];
    const dz = z2 - z1;
    if (dz === 0) {
        return routePlayer.tempRotaionX;
    }
    const distance = measureLenBetween(c1, c2);
    const rad = Math.atan2(dz, distance);
    const value = -rad / Math.PI * 180;
    if (Math.abs(value) === 90) {
        if (routePlayer.options.debug) {
            console.warn('cal rotationX error:', c1, c2);
            console.warn('dz:', dz);
            console.warn('dx', distance);
        }
        return routePlayer.tempRotaionX;
    }
    routePlayer.tempRotaionX = value;
    return value;
}

export function formatRouteData(data: Array<DataItem | Array<number>>, options?: FormatDataOptions): Array<DataItem> {
    options = extend({ duration: 0, coordinateKey: 'coordinate', timeKey: 'time' }, options);
    if (!isArray(data)) {
        console.error('data is not array ', data);
        return [];
    }
    if (data.length < 2) {
        console.error('data.length should >1 ', data);
        return [];
    }
    let { duration, coordinateKey, timeKey } = options;
    duration = duration || 0;
    duration = Math.max(0, duration);
    const len = data.length;
    let dirty = false;
    let tempCoordinate: Coordinate, totalDistance = 0;
    const result: Array<DataItem> = [];
    for (let i = 0; i < len; i++) {
        let item = data[i];
        if (!item) {
            console.error('has dirty data item:', item);
            return [];
        }
        if (isArray(item)) {
            const itemlen = item.length;
            if (itemlen < 2) {
                console.error('has dirty data item:', item);
                return [];
            }
            if (itemlen === 2) {
                item = { coordinate: item };
            }
            if (itemlen === 3) {
                const [x, y, z] = (item as any);
                // has time,no altitude
                if (Math.abs(z) > 100000) {
                    const coordinate: Coordinate = [x, y, 0];
                    const time = z;
                    item = { coordinate, time };
                } else {
                    item = { coordinate: (item as any) };
                }
            }
            if (itemlen === 4) {
                const [x, y, z, t] = (item as any);
                // has time
                if (isNumber(t)) {
                    const coordinate: Coordinate = [x, y, z];
                    const time = t;
                    item = { coordinate, time };
                } else {
                    // no altitude,has properties
                    const coordinate: Coordinate = [x, y, 0];
                    const time = z;
                    item = extend({ coordinate, time }, t);
                }
            }
            if (itemlen === 5) {
                const [x, y, z, t, p] = (item as any);
                const coordinate: Coordinate = [x, y, z];
                const time = t;
                item = extend({ coordinate, time }, p);
            }
        }
        if (!isObject(item)) {
            console.error('has dirty data item:', item);
            return [];
        }
        // is Coordinate Class
        if ((item as any).toArray) {
            item = { coordinate: (item as any).toArray() };
        }
        const obj = (item as DataItem);
        if (!obj.coordinate) {
            obj.coordinate = item[coordinateKey]
        }
        const { coordinate } = obj;
        if (!coordinate || !isArray(coordinate)) {
            console.error('coordinate is error:', obj);
            dirty = true;
        }
        if (dirty) {
            return [];
        }
        coordinate[2] = coordinate[2] || 0;
        if (i > 0) {
            const distance = totalDistance + calDistance(tempCoordinate, coordinate);
            obj._distance = distance;
            totalDistance = distance;
        } else {
            obj._distance = totalDistance;
        }
        obj._passed = false;
        tempCoordinate = coordinate;
        if (duration <= 0) {
            if (!isNumber(obj[timeKey])) {
                console.error('time is not number:', obj);
                return [];
            }
            obj._time = obj[timeKey];
        }
        result.push(obj);
    }
    // auto cal time
    if (duration > 0) {
        const startTime = now();
        for (let i = 0; i < len; i++) {
            const item = result[i];
            const { _distance } = item;
            if (isNumber(_distance) && _distance !== undefined) {
                item._time = Math.round(_distance / totalDistance * duration) + startTime;
            }
        }
    }

    return result;
}

const OPTIONS: RoutePlayerOptions = {
    speed: 1,
    unitTime: 1,
    debug: false,
    autoPlay: false,
    repeat: false
};

const RoutePlayers: Array<RoutePlayer> = [];
const EVENT_PLAYING = 'playing';
const EVENT_PLAYSTART = 'playstart';
const EVENT_PLAYEND = 'playend';
const EVENT_VERTEX = 'vertex';
const EVENT_TIME = 'settime';

export class RoutePlayer extends maptalks.Eventable(maptalks.Class) {
    public options: RoutePlayerOptions;
    private dirty: boolean;
    private startTime: number;
    private endTime: number;
    private time: number;
    private playing: boolean;
    private playend: boolean;
    public tempRotaionX: number;
    public tempRotationZ: number;
    private coordinate: Coordinate;
    private data: Array<DataItem>;
    private removed: boolean = false;
    private id: number;
    private index: number;

    constructor(data: Array<DataItem>, options?: RoutePlayerOptions) {
        super(options);
        this.dirty = false;
        this.removed = false;
        this.id = GUID();
        RoutePlayers.push(this);
        // @ts-ignore
        this.fire('add');
        this.setData(data);
        if (this.options.autoPlay) {
            this.play();
        }
    }

    _init() {
        if (this.isDirty()) {
            return this;
        }
        const { data } = this;
        const len = data.length;
        this.startTime = (data[0]._time as number);
        this.endTime = (data[len - 1]._time as number);
        this.time = this.startTime;
        this.playing = false;
        this.playend = false;
        this.index = -1;
        this.tempRotaionX = 0;
        this.tempRotationZ = 0;
        this.coordinate = this.data[0].coordinate;
        for (let i = 0, len = data.length; i < len; i++) {
            data[i]._passed = false;
        }
        return this;
    }

    isDirty() {
        if (this.dirty) {
            console.error(`RoutePlayer(${this.id}) current data is dirty`, this.data);
        }
        return this.dirty;
    }

    isRemoved() {
        return !!this.removed;
    }

    isAvailable() {
        if (this.isDirty()) {
            return false;
        }
        if (this.isRemoved()) {
            console.warn(`RoutePlayer(${this.id}) has removed`);
            return false;
        }
        return true;
    }

    add() {
        const index = RoutePlayers.indexOf(this);
        if (index === -1) {
            RoutePlayers.push(this);
            this.removed = false;
            // @ts-ignore
            this.fire('add');
        }
        return this;
    }

    remove() {
        const index = RoutePlayers.indexOf(this);
        if (index > -1) {
            RoutePlayers.splice(index, 1);
            this.removed = true;
            // @ts-ignore
            this.fire('remove');
        }
        return this;
    }

    dispose() {
        this.remove();
        return this;
    }

    isPlaying() {
        return !!this.playing;
    }

    isPlayend() {
        return !!this.playend;
    }

    _setCurrentCoordinate(coordinate: Coordinate) {
        this.coordinate = coordinate;
        return this;
    }

    _loop(t: number) {
        if (!this.isAvailable()) {
            return this;
        }
        if (!this.playing || this.playend) {
            return this;
        }
        if (!isNumber(t)) {
            return this;
        }
        if (this.time === this.startTime) {
            const item = this.data[0];
            item._passed = true;
            this._setCurrentCoordinate(item.coordinate);
            const result = this._firePlayStart();
            this.index = 0;
            // @ts-ignore
            this.fire(EVENT_VERTEX, { data: item, index: 0, coordinate: result.coordinate });
            // @ts-ignore
            this.fire(EVENT_PLAYING, result);
        }
        const time = t * this.getSpeed() * this.getUnitTime();
        this.time += time;
        this._play();
        return this;
    }

    _firePlayStart() {
        const item1 = this.getItem(0), item2 = this.getItem(1);
        if (!item1 || !item2) {
            return null;
        }
        const c1 = item1.coordinate, c2 = item2.coordinate;
        const rotationZ = getRotationZ(c1, c2, this);
        const rotationX = getRotationX(c1, c2, this);
        const result = { coordinate: item1.coordinate, rotationZ, rotationX };
        // @ts-ignore
        this.fire(EVENT_PLAYSTART, result);
        return result;
    }

    _play() {
        if (!this.isAvailable()) {
            return this;
        }
        this.time = Math.min(this.time, this.endTime);
        let tempCoordinate, tempTime;
        const len = this.data.length;
        for (let i = 0; i < len; i++) {
            const item = this.data[i];
            const { _time, coordinate, _passed } = item;
            if (_time === undefined) {
                continue;
            }
            if (this.time >= _time && !_passed) {
                item._passed = true;
                this._setCurrentCoordinate(item.coordinate);
                if (i === 0) {
                    this._firePlayStart();
                }
                let c1: Coordinate, c2: Coordinate;
                if (!tempCoordinate) {
                    c1 = item.coordinate;
                    c2 = this.data[1].coordinate;
                } else {
                    c1 = tempCoordinate;
                    c2 = item.coordinate;
                }
                const rotationZ = getRotationZ(c1, c2, this);
                const rotationX = getRotationX(c1, c2, this);
                this.index = i;
                // @ts-ignore
                this.fire(EVENT_VERTEX, { data: item, index: i, coordinate: item.coordinate });
                // @ts-ignore
                this.fire(EVENT_PLAYING, { coordinate: item.coordinate, rotationZ, rotationX });
            }
            if (this.time < _time) {
                const percent = (this.time - tempTime) / (_time - tempTime);
                const currentCoordinate = getCoordinateByPercent(tempCoordinate, coordinate, percent);
                this._setCurrentCoordinate(currentCoordinate);
                const c1: Coordinate = tempCoordinate, c2: Coordinate = currentCoordinate;
                const rotationZ = getRotationZ(c1, c2, this);
                const rotationX = getRotationX(c1, c2, this);
                // @ts-ignore
                this.fire(EVENT_PLAYING, { coordinate: currentCoordinate, rotationZ, rotationX });
                break;
            }
            tempCoordinate = item.coordinate;
            tempTime = item._time;
        }
        if (this.time === this.endTime && !this.playend) {
            const item = this.data[len - 1];
            this._setCurrentCoordinate(item.coordinate);
            const c1: Coordinate = this.data[len - 2].coordinate, c2: Coordinate = item.coordinate;
            const rotationZ = getRotationZ(c1, c2, this);
            const rotationX = getRotationX(c1, c2, this);
            // @ts-ignore
            this.fire(EVENT_PLAYEND, { coordinate: item.coordinate, rotationZ, rotationX });
            this.playend = true;
            if (this.options.repeat) {
                const playing = this.playing;
                this.reset();
                this.playing = playing;
            }
        }
        return this;

    }

    reset() {
        if (!this.isAvailable()) {
            return this;
        }
        this._init();
        // @ts-ignore
        this.fire('reset');
        return this;
    }

    cancel() {
        if (!this.isAvailable()) {
            return this;
        }
        this._init();
        // @ts-ignore
        this.fire('cancel');
        return this;
    }

    play() {
        if (!this.isAvailable()) {
            return this;
        }
        this.playing = true;
        return this;
    }

    pause() {
        if (!this.isAvailable()) {
            return this;
        }
        this.playing = false;
        // @ts-ignore
        this.fire('pause');
        return this;
    }

    finish() {
        if (!this.isAvailable()) {
            return this;
        }
        this.time = this.endTime;
        this._play();
        // @ts-ignore
        this.fire('finish');
        return this;
    }

    replay() {
        if (!this.isAvailable()) {
            return this;
        }
        this.reset();
        this.play();
        return this;
    }

    getSpeed() {
        return (this.options.speed as number);
    }

    setSpeed(speed: number) {
        if (!this.isAvailable()) {
            return this;
        }
        if (!isNumber(speed) || speed <= 0) {
            console.error('speed value is error:', speed);
            return this;
        }
        this.options.speed = speed;
        return this;
    }

    setIndex(index) {
        if (!this.isAvailable()) {
            return this;
        }
        if (!isNumber(index)) {
            return this;
        }
        index = Math.round(index);
        index = Math.max(0, index);
        index = Math.min(index, this.data.length - 1);
        const item = this.data[index];
        if (!item) {
            console.error('not find item from data,index=', index);
            return this;
        }
        return this.setTime(item._time);
    }

    setTime(time) {
        if (!this.isAvailable()) {
            return this;
        }
        if (!isNumber(time)) {
            return this;
        }
        time = Math.max(this.startTime, time);
        time = Math.min(time, this.endTime);
        this.time = time;
        let index = -1;
        for (let i = 0, len = this.data.length; i < len; i++) {
            const item = this.data[i];
            if (item._time === undefined) {
                continue;
            }
            if (item._time > time) {
                item._passed = false;
                if (index === -1) {
                    index = i;
                }
            }
        }
        if (index === -1) {
            index = this.data.length - 1;
        }
        if (index !== -1) {
            const item1 = this.data[index - 1], item2 = this.data[index];
            const t1 = item1._time, t2 = item2._time;
            const c1 = item1.coordinate, c2 = item2.coordinate;
            const percent = (this.time - (t1 as number)) / ((t2 as number) - (t1 as number));
            const currentCoordinate = getCoordinateByPercent(c1, c2, percent);
            this.index = index - 1;
            // @ts-ignore
            this.fire(EVENT_VERTEX, { data: item1, index: index - 1 });
            // @ts-ignore
            this.fire(EVENT_TIME, { time: this.time, coordinate: currentCoordinate });
        }
        this.playend = false;
        this._play();
        return this;
    }

    setPercent(percent: number) {
        if (!this.isAvailable()) {
            return this;
        }
        if (!isNumber(percent)) {
            return this;
        }
        percent = Math.max(0, percent);
        percent = Math.min(1, percent);
        const len = this.data.length;
        const totalDistance = this.data[len - 1]._distance || 0;
        const distance = totalDistance * percent;
        let tempTime = this.startTime, tempDistance = 0;
        let flag = false;
        let t = 0;
        for (let i = 0; i < len; i++) {
            const item = this.data[i];
            const { _distance, _time } = item;
            if (_distance === undefined || _time === undefined) {
                continue;
            }
            if (distance <= _distance && !flag) {
                const dTime = _time - tempTime;
                const dDistance = _distance - tempDistance;
                const p = (distance - tempDistance) / dDistance;
                t = tempTime + dTime * p;
                flag = true;
            }
            if (flag) {
                item._passed = false;
            }

            tempTime = _time;
            tempDistance = _distance;
        }
        if (t > 0) {
            this.setTime(t);
        }
        return this;
    }

    setData(data: Array<DataItem>) {
        if (this.isRemoved()) {
            return this;
        }
        this.dirty = false;
        if (!data || !isArray(data) || data.length < 2) {
            this.dirty = true;
            console.error('data is error:', data);
        }
        const item = data[0];
        if (!item || !item.coordinate || !isNumber(item._time)) {
            this.dirty = true;
            console.error('data is error,please use formatRouteData to format data :', data);
        }
        this.data = data;
        this._init();
        return this;
    }

    getItem(index: number): DataItem | null {
        if (!isNumber(index) || this.isDirty()) {
            return null;
        }
        index = Math.round(index);
        return this.data[index];
    }

    getCurrentTime() {
        return this.time;
    }

    getStartCoordinate() {
        const dataItem = this.getItem(0);
        if (dataItem) {
            return dataItem.coordinate;
        }
        return null;
    }

    getStartRotation() {
        const c1 = this.data[0].coordinate;
        const c2 = this.data[1].coordinate;
        return {
            rotationZ: getRotationZ(c1, c2, this),
            rotationX: getRotationX(c1, c2, this)
        };
    }

    getStartInfo() {
        const rotation = this.getStartRotation();
        return {
            coordinate: this.getStartCoordinate(),
            rotationX: rotation.rotationX,
            rotationZ: rotation.rotationZ
        }
    }

    getData() {
        return this.data;
    }

    getStartTime() {
        return this.startTime;
    }

    getEndTime() {
        return this.endTime;
    }

    getUnitTime() {
        return (this.options['unitTime'] as number);
    }

    setUnitTime(ut: number) {
        if (!this.isAvailable()) {
            return this;
        }
        this.options['unitTime'] = +ut;
        return this;
    }

    getCurrentCoordinate(): Coordinate {
        return this.coordinate;
    }

    getCoordinates(): Array<Coordinate> {
        if (this.isDirty()) {
            return [];
        }
        return this.data.map(d => {
            return d.coordinate;
        });
    }

    getCurrentVertex(): Array<DataItem> {
        if (this.index < 0) {
            return [];
        }
        return this.data.slice(0, this.index + 1);
    }

}
//@ts-ignore
RoutePlayer.mergeOptions(OPTIONS);

let time = now();
function loop(timestamp) {
    const currentTime = now();
    const dt = currentTime - time;
    const len = RoutePlayers.length;
    for (let i = 0; i < len; i++) {
        const player = RoutePlayers[i];
        player._loop(dt);
    }
    time = currentTime;
    requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
