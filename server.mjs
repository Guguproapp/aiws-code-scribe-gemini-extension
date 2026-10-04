#!/usr/bin/env node
import readline from 'node:readline';
import { runCodeScribe, toolDefinition } from './src/adapter.mjs';

const SERVER_INFO = { name: 'aiws-code-scribe', version: '0.1.0' };
const SUPPORTED_PROTOCOLS = new Set(['2024-11-05', '2025-03-26', '2025-06-18']);

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function rpcError(id, code, message) {
  send({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
}

async function handle(message) {
  const { id, method, params = {} } = message || {};
  if (!method) return;
  if (method === 'notifications/initialized' || method === 'notifications/cancelled') return;
  if (method === 'ping') {
    if (id !== undefined) send({ jsonrpc: '2.0', id, result: {} });
    return;
  }
  if (method === 'initialize') {
    const requested = params.protocolVersion;
    const protocolVersion = SUPPORTED_PROTOCOLS.has(requested) ? requested : '2024-11-05';
    send({ jsonrpc: '2.0', id, result: { protocolVersion, capabilities: { tools: {} }, serverInfo: SERVER_INFO } });
    return;
  }
  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: [toolDefinition] } });
    return;
  }
  if (method === 'tools/call') {
    if (params.name !== toolDefinition.name) {
      rpcError(id, -32602, `Unknown tool: ${String(params.name)}`);
      return;
    }
    const result = await runCodeScribe(params.arguments || {});
    send({
      jsonrpc: '2.0',
      id,
      result: {
        isError: result.status === 'ERROR',
        structuredContent: result,
        content: [{ type: 'text', text: JSON.stringify(result) }]
      }
    });
    return;
  }
  if (id !== undefined) rpcError(id, -32601, `Method not found: ${method}`);
}

const input = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
input.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const message = JSON.parse(line);
    Promise.resolve(handle(message)).catch((error) => rpcError(message.id, -32603, error.message));
  } catch (error) {
    rpcError(null, -32700, `Invalid JSON: ${error.message}`);
  }
});
