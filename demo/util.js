function generateNormal(indices, position) {
    function v3Sub(out, v1, v2) {
        out[0] = v1[0] - v2[0];
        out[1] = v1[1] - v2[1];
        out[2] = v1[2] - v2[2];
        return out;
    }

    function v3Normalize(out, v) {
        const x = v[0];
        const y = v[1];
        const z = v[2];
        const d = Math.sqrt(x * x + y * y + z * z) || 1;
        out[0] = x / d;
        out[1] = y / d;
        out[2] = z / d;
        return out;
    }

    function v3Cross(out, v1, v2) {
        const ax = v1[0], ay = v1[1], az = v1[2],
            bx = v2[0], by = v2[1], bz = v2[2];

        out[0] = ay * bz - az * by;
        out[1] = az * bx - ax * bz;
        out[2] = ax * by - ay * bx;
        return out;
    }

    function v3Set(p, a, b, c) {
        p[0] = a; p[1] = b; p[2] = c;
    }

    const p1 = [];
    const p2 = [];
    const p3 = [];

    const v21 = [];
    const v32 = [];

    const n = [];

    const len = indices.length;
    const normals = new Float32Array(position.length);
    let f = 0;
    while (f < len) {

        // const i1 = indices[f++] * 3;
        // const i2 = indices[f++] * 3;
        // const i3 = indices[f++] * 3;
        // const i1 = indices[f];
        // const i2 = indices[f + 1];
        // const i3 = indices[f + 2];
        const a = indices[f], b = indices[f + 1], c = indices[f + 2];
        const i1 = a * 3, i2 = b * 3, i3 = c * 3;

        v3Set(p1, position[i1], position[i1 + 1], position[i1 + 2]);
        v3Set(p2, position[i2], position[i2 + 1], position[i2 + 2]);
        v3Set(p3, position[i3], position[i3 + 1], position[i3 + 2]);

        v3Sub(v32, p3, p2);
        v3Sub(v21, p1, p2);
        v3Cross(n, v32, v21);
        // Already be weighted by the triangle area
        for (let i = 0; i < 3; i++) {
            normals[i1 + i] += n[i];
            normals[i2 + i] += n[i];
            normals[i3 + i] += n[i];
        }
        f += 3;
    }

    let i = 0;
    const l = normals.length;
    while (i < l) {
        v3Set(n, normals[i], normals[i + 1], normals[i + 2]);
        v3Normalize(n, n);
        normals[i] = n[0] || 0;
        normals[i + 1] = n[1] || 0;
        normals[i + 2] = n[2] || 0;
        i += 3;
    }

    return normals;
}

function createDebugLayer(map) {
    const layer = new maptalks.VectorLayer('layer', {
        enableAltitude: true
    }).addTo(map);
    return layer;
}

function showVertex(e, vertexs, layer, style) {
    const data = e.data;
    const index = e.index;
    console.log(index);
    if (!vertexs[index]) {
        const coordinate = data.coordinate;
        style = style || {
            markerType: 'ellipse',
            markerWidth: 5,
            markerHeight: 5,
            textSize: 12,
            textName: index,
            textFill: 'red'
        }
        style.textName = index;
        const point = new maptalks.Marker(coordinate, {
            symbol: style
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
