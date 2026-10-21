const Repository = 'spiraljng/exquizitive';
const ScriptName = 'Exquizitive';
const OutputDir = 'dist';

const ReleaseBase = `https://github.com/${Repository}/releases/latest/download`;

const Package = await Bun.file('package.json').json();
const Version = process.env.RELEASE_VERSION ?? Package.version;

const Metadata = [
  '// ==UserScript==',
  `// @name         ${ScriptName}`,
  `// @namespace    https://github.com/${Repository}`,
  `// @version      ${Version}`,
  `// @description  ${Package.description}`,
  '// @author       spiraljng',
  '// @match        https://ncia.wwnorton.com/*',
  '// @run-at       document-idle',
  '// @grant        none',
  `// @homepageURL  https://github.com/${Repository}`,
  `// @supportURL   https://github.com/${Repository}/issues`,
  `// @updateURL    ${ReleaseBase}/${ScriptName}.meta.js`,
  `// @downloadURL  ${ReleaseBase}/${ScriptName}.user.js`,
  '// ==/UserScript==',
  '',
].join('\n');

const Result = await Bun.build({
  entrypoints: ['src/Exquizitive.user.js'],
  outdir: OutputDir,
  target: 'browser',
  format: 'iife',
  minify: false,
  banner: Metadata,
  naming: `${ScriptName}.user.js`,
});

if (!Result.success) {
  for (const Log of Result.logs) console.error(Log);
  process.exit(1);
}

await Bun.write(`${OutputDir}/${ScriptName}.meta.js`, Metadata);

for (const Output of Result.outputs) {
  const Bytes = (await Output.arrayBuffer()).byteLength;
  console.log(`${Output.path}  ${(Bytes / 1024).toFixed(1)} KB`);
}

console.log(`${OutputDir}/${ScriptName}.meta.js  ${Metadata.length} B`);
console.log(`version ${Version}`);
