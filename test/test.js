describe('routeplayer', function () {
    let container, map;
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [121.505, 31.2611],
            zoom : 14
        });
    });

    afterEach(function () {
        map.remove();
        maptalks.DomUtil.removeDomNode(container);
    });

    const route = {
        path: [
                [121.475031060928, 31.2611187865471, 100, 301000, { info: "test1" }],
                [121.47940842604, 31.263466566376, 120, 541000, { info: "test2" }],
                [121.481768769973, 31.2649338991092, 110, 781000, { info: "test3" }],
                [121.483871621841, 31.2638700851521, 115, 901000, { info: "test4" }],
                [121.483742875808, 31.2617424212607, 105, 1021000, { info: "test5" }]
            ]
        };

    it('ok', function (done) {
        const player = new maptalks.RoutePlayer(route, map, {
            maxTrailLine: 10,
            markerSymbol: {
                markerOpacity: 0
            }
        });
        player.on("playing", function(param) {
            const { rotationX, rotationZ } = param;
            if (param.time < 780000 && param.time > 540000) {
                expect(rotationX.toFixed(6)).to.be.eql(-1.597199);
                expect(rotationZ.toFixed(3)).to.be.eql(149.381);
                done();
            }
        });
        player.play();
    });
});
