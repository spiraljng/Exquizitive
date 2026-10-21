const Requested = process.argv[2];

if (!Requested || !/^\d+\.\d+\.\d+$/.test(Requested)) {
  console.error('usage: bun run release <major.minor.patch>');
  process.exit(1);
}

const File = Bun.file('package.json');
const Package = await File.json();
const Previous = Package.version;

if (Requested === Previous) {
  console.error(`version is already ${Previous}`);
  process.exit(1);
}

const Write = (Value) => Bun.write('package.json', `${JSON.stringify({ ...Package, version: Value }, null, 2)}\n`);

await Write(Requested);
console.log(`package.json  ${Previous} -> ${Requested}`);

const Result = Bun.spawnSync({ cmd: ['bun', 'run', 'check'], stdout: 'inherit', stderr: 'inherit' });
if (Result.exitCode !== 0) {
  await Write(Previous);
  console.error(`build failed, reverted package.json to ${Previous}`);
  process.exit(1);
}

console.log('');
console.log(`push to release v${Requested}:`);
console.log('  git add -A');
console.log(`  git commit -m "release: v${Requested}"`);
console.log('  git push');
console.log('');
console.log('the Release workflow tags, publishes and hands off to Greasy Fork.');
