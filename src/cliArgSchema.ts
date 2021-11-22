export default [
  {
    name: 'data',
    alias: 'd',
    typeLabel: '<data>',
    description: 'HTTP POST data',
  },
  {
    name: 'fail',
    alias: 'f',
    description: 'Fail silently (no output at all) on HTTP errors',
    type: Boolean,
  },
  {
    name: 'help',
    alias: 'h',
    description: 'Get help for commands',
    type: Boolean,
  },
  {
    name: 'include',
    alias: 'i',
    description: 'Include protocol response headers in the output',
    type: Boolean,
  },
  {
    name: 'output',
    alias: 'o',
    typeLabel: '<file>',
    description: 'Write to file instead of stdout',
  },
  {
    name: 'remote-name',
    alias: 'O',
    description: 'Write output to a file named as the remote file',
    type: Boolean,
  },
  {
    name: 'silent',
    alias: 's',
    description: 'Silent mode',
    type: Boolean,
  },
  {
    name: 'upload-file',
    alias: 'T',
    typeLabel: '<file>',
    description: 'Transfer local FILE to destination',
  },
  {
    name: 'user',
    alias: 'u',
    typeLabel: '<user:password>',
    description: 'Server user and password',
  },
  {
    name: 'user-agent',
    alias: 'A',
    typeLabel: '<name>',
    description: 'Send User-Agent <name> to server',
  },
  {
    name: 'version',
    alias: 'V',
    description: 'Show version number and quit',
    type: Boolean,
  },
];
