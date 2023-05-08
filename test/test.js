describe('routeplayer', function () {
    let container, map, player, groupgllayer;
    beforeEach(function () {
        container = document.createElement('div');
        container.style.width = '400px';
        container.style.height = '300px';
        document.body.appendChild(container);
        map = new maptalks.Map(container, {
            center : [121.505, 31.2611],
            zoom : 14
        });
        groupgllayer = new maptalks.GroupGLLayer("group", []).addTo(map);
    });

    afterEach(function () {
        player.remove();
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

    it('get player\'s position when playing', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
            maxTrailLine: 10,
            markerSymbol: {
                markerOpacity: 0
            }
        });
        player.on("playing", function(param) {
            const { pitch, bearing } = param;
            if (param.time < 780000 && param.time > 540000) {
                expect(pitch.toFixed(4)).to.be.eql(1.3746);
                expect(bearing.toFixed(3)).to.be.eql(149.381);
                done();
            }
        });
        player.play();
    });

    it('get player\'s info', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
        });
        player.on("playing", function(param) {
            if (param.time < 780000 && param.time > 540000) {
                expect(player.getCurrentProperties(0).info).to.be.eql('test4');
                done();
            }
        });
        player.play();
    });

    it('playpause event', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
        });
        player.play();
        player.on("playpause", function() {
            done();
        });
        setTimeout(function() {
            player.pause();
        }, 200);
    });

    it('play and then finish', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
        });
        player.play();
        player.on("playfinish", function(param) {
            const { pitch, bearing, coordinate } = param;
            expect(pitch).to.be.eql(357.3061768305339);
            expect(bearing).to.be.eql(87.03906385937773);
            expect(coordinate.x).to.be.eql(121.483742875808);
            expect(coordinate.y).to.be.eql(31.2617424212607);
            expect(coordinate.z).to.be.eql(105);
            done();
        });
        setTimeout(function() {
            player.finish();
        }, 200);
    });

    it('play and then cancel', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
        });
        player.play();
        player.on("playcancel", function(param) {
            const { pitch, bearing, coordinate } = param;
            expect(pitch).to.be.eql(2.5986362164469186);
            expect(bearing).to.be.eql(-147.89374404407715);
            expect(coordinate.x).to.be.eql(121.475031060928);
            expect(coordinate.y).to.be.eql(31.2611187865471);
            expect(coordinate.z).to.be.eql(100);
            done();
        });
        setTimeout(function() {
            player.cancel();
        }, 200);
    });

    it('add more than one routeplayer', function (done) {
        player = new maptalks.RoutePlayer(route, groupgllayer, {
        });
        player.play();
        const newPlayer = new maptalks.RoutePlayer(route, groupgllayer);
        newPlayer.play();
        setTimeout(function() {
            newPlayer.remove();
            done();
        }, 100);
    });
});
