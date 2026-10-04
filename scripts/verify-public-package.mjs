import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const allowedTopLevel = new Set([
  '.gitignore', 'CHANGELOG.md', 'GEMINI.md', 'PUBLICATION_CHECKLIST.md',
  'README.md', 'SECURITY.md', 'gemini-extension.json', 'package.json',
  'scripts', 'server.mjs', 'src', 'test'
]);

for (const entry of await readdir(root)) {
  assert.equal(allowedTopLevel.has(entry), true, `Unexpected public-package entry: ${entry}`);
}

const files = [
  'CHANGELOG.md', 'GEMINI.md', 'PUBLICATION_CHECKLIST.md', 'README.md',
  'SECURITY.md', 'gemini-extension.json', 'package.json', 'server.mjs',
  'src/adapter.mjs', 'scripts/validate.mjs', 'scripts/verify-public-package.mjs',
  'test/adapter.test.mjs', 'test/server.test.mjs',
  'test/fixtures/core/package.json', 'test/fixtures/core/code-scribe/src/engine.js'
];
for (const path of files) {
  const text = await readFile(new URL(path, root), 'utf8');
  assert.doesNotMatch(text, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u, path);
  assert.doesNotMatch(text, /(?:api[_-]?key|password|secret|token)\s*[:=]\s*['"][^'"]+/iu, path);
  assert.doesNotMatch(text, /\/Users\/[A-Za-z0-9._-]+\//u, path);
}

console.log('PASS: public wrapper contains no private Core tree, credentials or personal absolute paths.');
