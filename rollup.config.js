const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? 'dist/maptalks.routeplayer.js' : 'dist/maptalks.routeplayer-dev.js';
const plugins = production ? [
    uglify({
        output : { comments : '/^!/' },
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true
            }
        }
    })] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

const basePlugins = [
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs()
];

module.exports = [
    {
        input: 'index.js',
        plugins: basePlugins.concat([babel()]).concat(plugins),
        external : ['maptalks'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro' : outro,
            'extend' : true,
            'globals' : {
                'maptalks' : 'maptalks'
            },
            'file': outputFile
        }
    },
    {
        input: 'index.js',
        plugins: basePlugins.concat(production ? [
            terser({
                output : { comments : '/^!/' },
                mangle : {
                    properties: {
                        'regex' : /^_/,
                        'keep_quoted' : true
                    }
                }
            })
        ] : []),
        external : ['maptalks'],
        output: {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'outro' : outro,
            'file': pkg.module
        }
    }
];
