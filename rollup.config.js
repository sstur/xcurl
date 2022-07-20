import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/cli.ts',
  output: {
    dir: 'lib',
    format: 'cjs',
    strict: false,
    esModule: false,
  },
  plugins: [
    typescript({
      module: 'esnext',
    }),
  ],
};
