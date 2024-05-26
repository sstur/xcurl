import { defineSchema, type ParsedResult } from '@sstur/clargs';

export const schema = defineSchema(({ arg, argList, flag }) => ({
  data: arg({
    alias: 'd',
    optional: true,
    typeLabel: '<data>',
    description: 'HTTP POST data',
  }),
  'data-ascii': arg({
    optional: true,
    typeLabel: '<data>',
    description: 'HTTP POST ASCII data',
  }),
  'data-binary': arg({
    optional: true,
    typeLabel: '<data>',
    description: 'HTTP POST binary data',
  }),
  'data-raw': arg({
    optional: true,
    typeLabel: '<data>',
    description: `HTTP POST data, '@' allowed`,
  }),
  fail: flag({
    alias: 'f',
    description: 'Fail silently (no output at all) on HTTP errors',
  }),
  header: argList({
    alias: 'H',
    typeLabel: '<header/@file>',
    description: 'Pass custom header(s) to server',
  }),
  help: flag({
    alias: 'h',
    description: 'Get help for commands',
  }),
  include: flag({
    alias: 'i',
    description: 'Include protocol response headers in the output',
  }),
  location: flag({
    alias: 'L',
    description: 'Follow redirects',
  }),
  output: arg({
    alias: 'o',
    optional: true,
    typeLabel: '<file>',
    description: 'Write to file instead of stdout',
  }),
  'remote-header-name': flag({
    alias: 'J',
    description: 'Use the header-provided filename',
  }),
  'remote-name': flag({
    alias: 'O',
    description: 'Write output to a file named as the remote file',
  }),
  request: arg({
    alias: 'X',
    optional: true,
    typeLabel: '<command>',
    description: 'Specify request command to use',
  }),
  'show-error': flag({
    alias: 'S',
    description: 'Show error even when -s is used',
  }),
  silent: flag({
    alias: 's',
    description: 'Silent mode',
  }),
  // 'upload-file': arg({
  //   alias: 'T',
  //   typeLabel: '<file>',
  //   description: 'Transfer local FILE to destination',
  // }),
  // user: arg({
  //   alias: 'u',
  //   typeLabel: '<user:password>',
  //   description: 'Server user and password',
  // }),
  // 'user-agent': arg({
  //   alias: 'A',
  //   typeLabel: '<name>',
  //   description: 'Send User-Agent <name> to server',
  // }),
  url: arg({
    optional: true,
    typeLabel: '<url>',
    description: 'URL to work with',
  }),
  verbose: flag({
    alias: 'v',
    description: 'Make the operation more talkative',
  }),
  version: flag({
    alias: 'V',
    description: 'Show version number and quit',
  }),
}));

export type ParsedOptions = ParsedResult<typeof schema>;
