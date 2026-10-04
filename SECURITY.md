# Security

- The public wrapper does not contain the private Code Scribe Core.
- The MCP tool accepts only a structured task and never scans a repository.
- Core runs in its default ZERO_AI mode. No provider key or network call is
  required.
- The Core remains responsible for `allow_write`, `deny_write`, secret, file
  count, line count and patch validation.
- The wrapper returns `applied: false` and has no apply operation.
- The Core path is a declared local setting. Do not enter a token, credential,
  URL secret or `.env` path.
- Supplied source snippets may be sensitive. Keep tasks minimal and do not send
  credentials, cookies, tokens or customer data.

Report security issues through the support URL in `README.md` without attaching
credentials or private source.

The tiny Core under `test/fixtures/` is only an adapter protocol fixture. Release
acceptance also runs the same tests against the separately installed real Core;
fixture results are not reported as real Core execution.
