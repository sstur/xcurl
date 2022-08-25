import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import cleanup from 'rollup-plugin-cleanup';
import { nodeResolve } from '@rollup/plugin-node-resolve';

export default {
  input: 'src/cli.ts',
  output: {
    file: 'build/index.js',
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
