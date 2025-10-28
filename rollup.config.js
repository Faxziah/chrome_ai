import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default [
  {
    input: 'src/content/content-script.ts',
    output: {
      file: 'dist/content-script.js',
      format: 'iife',
      name: 'ContentScript',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ 
        browser: true,
        preferBuiltins: false
      }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'src/background/service-worker.ts',
    output: {
      file: 'dist/service-worker.js',
      format: 'es',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'src/options/options.ts',
    output: {
      file: 'dist/options.js',
      format: 'iife',
      name: 'Options',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'src/popup/popup.ts',
    output: {
      file: 'dist/popup.js',
      format: 'iife',
      name: 'Popup',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  },
  {
    input: 'src/sidepanel/sidepanel.ts',
    output: {
      file: 'dist/sidepanel.js',
      format: 'iife',
      name: 'SidePanel',
      sourcemap: true
    },
    plugins: [
      nodeResolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];
