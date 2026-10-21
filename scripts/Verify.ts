const ScriptName = 'Exquizitive';
const Artifact = `dist/${ScriptName}.user.js`;
const MetaArtifact = `dist/${ScriptName}.meta.js`;

const Package = await Bun.file('package.json').json();
const Failures = [];

const Check = (Condition, Message) => {
  if (!Condition) Failures.push(Message);
};

const Source = await Bun.file(Artifact)
  .text()
  .catch(() => null);

if (Source === null) {
  Failures.push(`${Artifact} is missing — run the build first`);
} else {
  Check(Source.startsWith('// ==UserScript=='), 'artifact does not begin with the userscript metadata block');
  Check(Source.includes(`// @version      ${Package.version}`), `@version does not match package.json (${Package.version})`);
  Check(Source.includes('// @match        https://ncia.wwnorton.com/*'), '@match for ncia.wwnorton.com is missing');
  Check(Source.includes('// @grant        none'), '@grant none is required for page-context access');
  Check(!/^\/\/ @require/m.test(Source), '@require is rejected by the Greasy Fork external-code policy');
  Check(Source.includes('// @updateURL'), '@updateURL is missing');
  Check(Source.includes('// @downloadURL'), '@downloadURL is missing');
  Check(Source.includes('exquizitive-panel'), 'panel mount code is missing from the bundle');
  Check(Source.includes('feed_outer_dialog'), 'auto-skip dialog handling is missing from the bundle');

  try {
    new Function(Source);
  } catch (Error) {
    Failures.push(`artifact does not parse: ${Error.message}`);
  }
}

const Meta = await Bun.file(MetaArtifact)
  .text()
  .catch(() => null);

if (Meta === null) {
  Failures.push(`${MetaArtifact} is missing — run the build first`);
} else {
  Check(Meta.startsWith('// ==UserScript=='), 'meta artifact does not begin with the metadata block');
  Check(Meta.includes(`// @version      ${Package.version}`), `meta @version does not match package.json (${Package.version})`);
  Check(!Meta.includes('==/UserScript==\n\n(') && Meta.trimEnd().endsWith('==/UserScript=='), 'meta artifact must contain only the metadata block');
}

if (Failures.length > 0) {
  console.error(`verify failed (${Failures.length})`);
  for (const Failure of Failures) console.error(`  - ${Failure}`);
  process.exit(1);
}

console.log(`verified ${Artifact} and ${MetaArtifact} at version ${Package.version}`);
