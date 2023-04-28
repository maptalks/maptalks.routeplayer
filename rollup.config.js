const { nodeResolve: resolve } = require('@rollup/plugin-node-resolve');
const commonjs = require('@rollup/plugin-commonjs');
const babel = require('@rollup/plugin-babel');
const terser = require('rollup-plugin-terser').terser;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? 'dist/maptalks.routeplayer.js' : 'dist/maptalks.routeplayer-dev.js';
const plugins = production ? [
    terser({
        mangle: {
            properties: {
                'regex' : /^_/,
                'keep_quoted' : true,
                'reserved': ['on', 'once', 'off']
            }
        },
        output : {
            keep_quoted_props: true,
            beautify: false,
            comments : '/^!/'
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
        external: ['maptalks'],
        plugins: basePlugins.concat([babel()]).concat(plugins),
        output: {
            globals: {
                'maptalks': 'maptalks'
            },
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro' : outro,
            'extend' : true,
            'file': outputFile
        }
    },
    {
        input: 'index.js',
        plugins: basePlugins.concat(production ? [
            terser({
                output : { comments : '/^!/', beautify: true },
                mangle : {
                    properties: {
                        'regex' : /^_/,
                        'keep_quoted' : true
                    }
                }
            })
        ] : []),
        external: ['maptalks'],
        output: {
            globals: {
                'maptalks': 'maptalks'
            },
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'extend': true,
            'name': 'maptalks',
            'outro' : outro,
            'file': pkg.module
        }
    }
];
