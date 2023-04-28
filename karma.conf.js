const pkg = require('./package.json');
module.exports = function (config) {
    config.set({
        frameworks: ['mocha', 'expect'],
        basePath: '.',
        client: {
            mocha: {
                timeout : 6000
            }
        },
        files: [
            'node_modules/maptalks/dist/maptalks.js',
            'dist/' + pkg.name + '.js',
            'test/**/*.js'
        ],
        proxies: {
        },
        preprocessors: {
        },
        browsers: ['Chrome'],
        reporters: ['mocha']
    });
};
