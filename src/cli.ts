import fetch from 'node-fetch';

async function main() {
  let args = process.argv.slice(2);

  let url = args[0] || '';

  let response = await fetch(url);
  let result = await response.text();
  console.log(result);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
