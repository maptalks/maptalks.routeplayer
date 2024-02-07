// Rollup plugins
import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json';
const path = require('path');

const production = process.env.BUILD === 'production';


const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;


outro = `typeof console !== 'undefined' && console.log('${outro}');`;

// const external = ['maptalks'];
const FILEMANE = pkg.name;
const sourceMap = !production;

const plugins = [
    json(),
    typescript({

    }),
    resolve(),
    commonjs()
    // babel({
    //     // exclude: ['node_modules/**']
    // })
];

function getEntry() {
    return path.join(__dirname, './index.ts');
}

export default [
    {
        input: getEntry(),
        // external: external,
        plugins: plugins,
        output: {
            'format': 'umd',
            'name': 'maptalks',
            'file': `dist/${FILEMANE}.js`,
            'sourcemap': sourceMap,
            'extend': true,
            'banner': banner,
            'outro' : outro,
            'globals': {
                'maptalks': 'maptalks'
            }
        }
    },
    // {
    //     input: getEntry(),
    //     external: external,
    //     plugins: plugins,
    //     output: {
    //         'sourcemap': false,
    //         'format': 'es',
    //         // banner,
    //         'file': `dist/${FILEMANE}.mjs`,
    //         'extend': true,
    //         'banner': banner,
    //         'globals': {
    //             'maptalks': 'maptalks'
    //         }
    //     }
    // },
    {
        input: getEntry(),
        // external: external,
        plugins: plugins.concat([terser()]),
        output: {
            'format': 'umd',
            'name': 'maptalks',
            'file': `dist/${FILEMANE}.min.js`,
            'sourcemap': false,
            'extend': true,
            'banner': banner,
            'outro' : outro,
            'globals': {
                'maptalks': 'maptalks'
            }
        }
    }

];
