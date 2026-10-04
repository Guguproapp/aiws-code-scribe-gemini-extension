import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('gemini-extension.json', root), 'utf8'));

assert.match(manifest.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
assert.match(manifest.version, /^\d+\.\d+\.\d+$/u);
assert.equal(manifest.contextFileName, 'GEMINI.md');
assert.equal(manifest.mcpServers?.['aiws-code-scribe']?.command, 'node');
assert.deepEqual(manifest.mcpServers?.['aiws-code-scribe']?.args, ['${extensionPath}/server.mjs']);
assert.equal(manifest.settings?.[0]?.envVar, 'AIWS_CODE_SCRIBE_ROOT');

for (const path of ['server.mjs', 'src/adapter.mjs', 'GEMINI.md', 'README.md', 'SECURITY.md']) {
  await access(new URL(path, root));
}

console.log('PASS: Gemini Code Scribe extension manifest and required files are valid.');
