import { access } from 'node:fs/promises';
import { isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const MAX_TASK_BYTES = 512 * 1024;
const ALLOWED_STATUSES = new Set([
  'PATCH_READY',
  'NEED_CONTEXT',
  'NO_MATCHING_RECIPE',
  'SCOPE_BLOCKED',
  'VALIDATION_FAILED',
  'ERROR',
  'HUMAN_REQUIRED'
]);

function blocked(code, message) {
  return {
    status: 'SCOPE_BLOCKED',
    provider: 'ZERO_AI_RULE_ENGINE',
    recipe: null,
    files: [],
    patch: '',
    changed_lines: 0,
    risk: 'low',
    notes: [message],
    error_code: code,
    applied: false
  };
}

function coreRootFromEnvironment() {
  const root = process.env.AIWS_CODE_SCRIBE_ROOT;
  if (!root || !isAbsolute(root) || root.includes('\0')) return null;
  return resolve(root);
}

function serializedSize(value) {
  try {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function validateRequest(input, { coreRoot = coreRootFromEnvironment() } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return blocked('INVALID_INPUT', 'Tool arguments must be an object.');
  }
  if (!input.task || typeof input.task !== 'object' || Array.isArray(input.task)) {
    return blocked('STRUCTURED_TASK_REQUIRED', 'A structured Code Scribe task is required.');
  }
  if (!coreRoot) {
    return blocked('CORE_PATH_REQUIRED', 'AIWS_CODE_SCRIBE_ROOT must be an absolute local path.');
  }
  if (serializedSize(input.task) > MAX_TASK_BYTES) {
    return blocked('TASK_TOO_LARGE', `Structured task exceeds ${MAX_TASK_BYTES} bytes.`);
  }
  if (input.task.capability !== undefined && input.task.capability !== 'scribe.generate') {
    return blocked('CAPABILITY_NOT_ALLOWED', 'The Gemini wrapper exposes scribe.generate only.');
  }
  return { task: input.task, coreRoot };
}

export async function runCodeScribe(input, options = {}) {
  const validated = validateRequest(input, options);
  if (validated.status) return validated;

  const enginePath = join(validated.coreRoot, 'code-scribe/src/engine.js');
  try {
    await access(enginePath);
  } catch {
    return blocked('CORE_ENTRY_NOT_FOUND', 'The configured Code Scribe Core entry is not readable.');
  }

  try {
    const { CodeScribeEngine } = await import(pathToFileURL(enginePath).href);
    const result = new CodeScribeEngine().generate(validated.task);
    if (!result || !ALLOWED_STATUSES.has(result.status)) {
      return blocked('CORE_OUTPUT_INVALID', 'Code Scribe Core returned an unknown status.');
    }
    return { ...result, applied: false };
  } catch (error) {
    return {
      ...blocked('CORE_EXECUTION_ERROR', 'Code Scribe Core could not complete the structured task.'),
      status: 'ERROR',
      notes: [error instanceof Error ? error.message : 'Unknown Core error']
    };
  }
}

export const toolDefinition = {
  name: 'code_scribe_generate_patch',
  description: 'Generate a deterministic, scope-checked patch preview with AIWS Code Scribe. The tool never applies the patch or expands allow_write.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['task'],
    properties: {
      task: {
        type: 'object',
        description: 'A complete structured Code Scribe task. Do not send an entire repository.',
        required: [
          'task_id', 'objective', 'target_files', 'allow_write', 'deny_write',
          'current_code', 'expected_change', 'acceptance', 'forbidden_change',
          'max_files', 'max_lines'
        ],
        properties: {
          task_id: { type: 'string', minLength: 1 },
          capability: { type: 'string', enum: ['scribe.generate'] },
          objective: { type: 'string', minLength: 1 },
          target_files: { type: 'array', items: { type: 'string' }, minItems: 1 },
          allow_write: { type: 'array', items: { type: 'string' }, minItems: 1 },
          deny_write: { type: 'array', items: { type: 'string' } },
          current_code: { type: 'object', description: 'Exact current text keyed by approved target path.' },
          expected_change: { type: 'object', description: 'Recipe inputs such as file, selector, property and value, or find and replace.' },
          acceptance: { type: 'array', items: { type: 'string' } },
          forbidden_change: { type: 'array', items: { type: 'string' } },
          max_files: { type: 'integer', minimum: 1 },
          max_lines: { type: 'integer', minimum: 1 },
          language: { type: 'string' },
          framework: { type: 'string' },
          recipe: { type: 'string' }
        },
        additionalProperties: true
      }
    }
  }
};
