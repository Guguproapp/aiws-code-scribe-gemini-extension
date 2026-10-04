import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';

function fixtureTask() {
  return {
    task_id: 'MCP-GEMINI-SCRIBE-001',
    capability: 'scribe.generate',
    objective: 'Change a CSS width.',
    target_files: ['src/payment.css'],
    allow_write: ['src/payment.css'],
    deny_write: [],
    current_code: { 'src/payment.css': '.pay-button { width: 240px; }' },
    expected_change: { file: 'src/payment.css', selector: '.pay-button', property: 'width', value: '100%' },
    acceptance: ['patch is generated'],
    forbidden_change: ['source apply'],
    max_files: 1,
    max_lines: 4,
    language: 'css'
  };
}

void test('stdio MCP lists and invokes the configured patch-only tool', async () => {
  const coreRoot = process.env.AIWS_CODE_SCRIBE_TEST_CORE
    ? resolve(process.env.AIWS_CODE_SCRIBE_TEST_CORE)
    : resolve('test/fixtures/core');
  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: resolve('.'),
    env: { ...process.env, AIWS_CODE_SCRIBE_ROOT: coreRoot },
    stdio: ['pipe', 'pipe', 'pipe']
  });
  const lines = createInterface({ input: child.stdout });
  const responses = [];
  lines.on('line', (line) => responses.push(JSON.parse(line)));

  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'code_scribe_generate_patch', arguments: { task: fixtureTask() } } })}\n`);

  const deadline = Date.now() + 5000;
  while (responses.length < 3 && Date.now() < deadline) {
    await new Promise((resolveWait) => setTimeout(resolveWait, 20));
  }
  child.kill('SIGTERM');
  await once(child, 'close');

  assert.equal(responses[0].result.serverInfo.name, 'aiws-code-scribe');
  assert.equal(responses[1].result.tools[0].name, 'code_scribe_generate_patch');
  assert.equal(responses[2].result.structuredContent.status, 'PATCH_READY');
  assert.equal(responses[2].result.structuredContent.applied, false);
});
