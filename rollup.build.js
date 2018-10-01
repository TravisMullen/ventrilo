import commonjs from 'rollup-plugin-commonjs'
import json from 'rollup-plugin-json'
import resolve from 'rollup-plugin-node-resolve'

import pkg from './package.json'

export default {
  input: 'src/main.js',
  output: [
    // { file: pkg.main, format: 'cjs' },
    { file: pkg.main, format: 'es' }
  ],
  plugins: [
    resolve(), // so Rollup can find `ms`
    commonjs(), // so Rollup can convert `ms` to an ES module
    json({
      // for tree-shaking, properties will be declared as
      // variables, using either `var` or `const`
      preferConst: true
    })
  ]
}