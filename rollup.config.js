import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';

export default {
  input: 'src/cli.ts',
  output: {
    file: 'dist/index.js',
    format: 'cjs',
    strict: false,
    esModule: false,
  },
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({
      module: 'esnext',
    }),
    cleanup({
      extensions: ['js', 'ts'],
    }),
  ],
};
