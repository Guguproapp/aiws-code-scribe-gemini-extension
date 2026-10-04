import assert from 'node:assert/strict';
import test from 'node:test';
import { resolve } from 'node:path';
import { runCodeScribe, validateRequest } from '../src/adapter.mjs';

const coreRoot = process.env.AIWS_CODE_SCRIBE_TEST_CORE
  ? resolve(process.env.AIWS_CODE_SCRIBE_TEST_CORE)
  : resolve('test/fixtures/core');

function task(overrides = {}) {
  return {
    task_id: 'GEMINI-SCRIBE-001',
    capability: 'scribe.generate',
    objective: 'Make the mobile payment button full width.',
    target_files: ['src/payment.css'],
    allow_write: ['src/payment.css'],
    deny_write: [],
    current_code: { 'src/payment.css': '.pay-button { width: 240px; }' },
    expected_change: {
      file: 'src/payment.css',
      selector: '.pay-button',
      property: 'width',
      value: '100%'
    },
    acceptance: ['mobile button is full width'],
    forbidden_change: ['dependency changes'],
    max_files: 1,
    max_lines: 4,
    language: 'css',
    ...overrides
  };
}

void test('configured Code Scribe Core returns a patch preview without applying source', async () => {
  const result = await runCodeScribe({ task: task() }, { coreRoot });
  assert.equal(result.status, 'PATCH_READY');
  assert.equal(result.applied, false);
  assert.deepEqual(result.files, ['src/payment.css']);
  assert.match(result.patch, /width: 100%/u);
});

void test('Gemini current_files preserves punctuated paths for the Core', async () => {
  const source = task();
  delete source.current_code;
  source.current_files = [{ path: 'src/payment.css', content: '.pay-button { width: 240px; }' }];
  const result = await runCodeScribe({ task: source }, { coreRoot });
  assert.equal(result.status, 'PATCH_READY');
  assert.equal(result.applied, false);
  assert.match(result.patch, /width: 100%/u);
});

void test('Gemini current_files rejects duplicate or ambiguous sources', () => {
  const duplicate = task({ current_code: undefined, current_files: [
    { path: 'src/payment.css', content: 'a' },
    { path: 'src/payment.css', content: 'b' }
  ] });
  assert.equal(validateRequest({ task: duplicate }, { coreRoot }).error_code, 'CURRENT_FILE_DUPLICATE');

  const ambiguous = task({ current_files: [{ path: 'src/payment.css', content: 'a' }] });
  assert.equal(validateRequest({ task: ambiguous }, { coreRoot }).error_code, 'CURRENT_SOURCE_AMBIGUOUS');
});

void test('Core scope guard still blocks a path outside allow_write', async () => {
  const result = await runCodeScribe({ task: task({ target_files: ['README.md'] }) }, { coreRoot });
  assert.equal(result.status, 'SCOPE_BLOCKED');
  assert.equal(result.applied, false);
});

void test('wrapper rejects missing Core and oversized structured tasks', () => {
  assert.equal(validateRequest({ task: task() }, { coreRoot: null }).error_code, 'CORE_PATH_REQUIRED');
  const oversized = task({ objective: 'x'.repeat(513 * 1024) });
  assert.equal(validateRequest({ task: oversized }, { coreRoot }).error_code, 'TASK_TOO_LARGE');
});

void test('wrapper exposes generate only', () => {
  const result = validateRequest({ task: task({ capability: 'scribe.validate' }) }, { coreRoot });
  assert.equal(result.error_code, 'CAPABILITY_NOT_ALLOWED');
});
