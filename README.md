# xcurl

A curl clone in Node.

## Installation

Install globally using `npm install -g xcurl` or invoke using `npx` as shown below.

## Usage

```
npx xcurl --help

Usage: xcurl [options...] <url>
 -d, --data <data>        HTTP POST data
     --data-ascii <data>  HTTP POST ASCII data
     --data-binary <data> HTTP POST binary data
     --data-raw <data>    HTTP POST data, '@' allowed
 -H, --header <header/@file>  Pass custom header(s) to server
 -h, --help               Get help for commands
 -i, --include            Include protocol response headers in the output
 -o, --output <file>      Write to file instead of stdout
 -X, --request <command>  Specify request command to use
 -s, --silent             Silent mode
     --url <url>          URL to work with
 -v, --verbose            Make the operation more talkative
 -V, --version            Show version number and quit
```
