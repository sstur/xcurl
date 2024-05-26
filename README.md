# xcurl

A curl clone in Node.

## Installation

Install globally using `npm install -g xcurl` or invoke using `npx` as shown below.

## Usage

```
npx xcurl --help

Usage: xcurl [options...] <url>
 -d, --data <data>   HTTP POST data
     --data-ascii <data>  HTTP POST ASCII data
     --data-binary <data>  HTTP POST binary data
     --data-raw <data>  HTTP POST data, '@' allowed
 -f, --fail          Fail silently (no output at all) on HTTP errors
 -H, --header <header/@file>  Pass custom header(s) to server
 -h, --help          Get help for commands
 -i, --include       Include protocol response headers in the output
 -L, --location      Follow redirects
 -o, --output <file>  Write to file instead of stdout
 -J, --remote-header-name  Use the header-provided filename
 -O, --remote-name   Write output to a file named as the remote file
 -X, --request <command>  Specify request command to use
 -S, --show-error    Show error even when -s is used
 -s, --silent        Silent mode
     --url <url>     URL to work with
 -u, --user <user:password>  Server user and password
 -A, --user-agent <name>  Send User-Agent <name> to server
 -v, --verbose       Make the operation more talkative
 -V, --version       Show version number and quit
```
