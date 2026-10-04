# AIWS Code Scribe for Gemini CLI

A thin Gemini CLI Extension for a separately installed AIWS Code Scribe Core.
It accepts one structured task and returns a deterministic, scope-checked patch
preview. It never applies the patch.

## Who it is for

Developers and controlled coding workflows that already have a licensed or
local AIWS Code Scribe Core checkout and want Gemini CLI to invoke it without
giving the wrapper access to an entire repository.

## Requirements

- Node.js 22 or newer
- Gemini CLI with Extension support
- an AIWS Code Scribe Core checkout

No AI provider key is required by Code Scribe Core's ZERO_AI Recipe mode.
However, the Gemini CLI host still requires its own supported authentication.
Google stopped serving Gemini CLI requests for individual/free accounts on
2026-06-18; live natural-language invocation now requires a supported API key
or enterprise entitlement. Installation and local MCP/Core validation do not
by themselves prove model access.

## Install from a local checkout

```sh
gemini extensions install /absolute/path/to/gemini-code-scribe --consent --skip-settings
gemini extensions config aiws-code-scribe
```

Set `Code Scribe Core path` to the absolute path containing `code-scribe/`.
Restart Gemini CLI after installing or changing Extension configuration.

## GitHub direct install

```sh
gemini extensions install https://github.com/Guguproapp/aiws-code-scribe-gemini-extension
```

The public repository and direct-install path are verified. Gallery discovery
is tracked separately in `PUBLICATION_CHECKLIST.md` and is not implied by a
successful direct install.

## Example request

Ask Gemini to generate a patch from a structured task that contains only the
approved file text. The tool returns `PATCH_READY`, `NEED_CONTEXT`,
`NO_MATCHING_RECIPE`, `SCOPE_BLOCKED`, `VALIDATION_FAILED`, `HUMAN_REQUIRED`, or
`ERROR`.

`PATCH_READY` includes the unified patch, affected files, changed-line count,
digest and risk. `applied` is always `false`.

## Limitations

- No repository discovery
- No patch application
- No dependency, lockfile, `.env`, credential or config changes
- No autonomous refactor
- No cloud model integration in this release
- Maximum structured task payload: 512 KiB

## Privacy and security

The wrapper uses a local Core path and does not require network credentials.
Only send the minimum approved source snippets needed by the structured task.
See `SECURITY.md`.

## Uninstall

```sh
gemini extensions uninstall aiws-code-scribe
```

Support: https://gugupro.artistuncle.chatgpt.site/plugins/code-scribe
