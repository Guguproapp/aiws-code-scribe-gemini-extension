# Changelog

## 0.1.1 - 2026-10-04

- Added Gemini-safe `current_files` input so `/` and `.` in file paths are
  preserved before the task reaches Code Scribe Core.
- Return valid scope and context statuses as structured tool results instead of
  MCP transport failures.
- Confirmed a live Gemini CLI free-API-key invocation returned the real Core's
  `PATCH_READY` result with `applied: false`.
- Replaced an outdated absolute authentication statement with quota-aware,
  non-misleading wording.

## 0.1.0 - 2026-10-04

- Initial public-wrapper candidate for Gemini CLI.
- One ZERO_AI, patch-only MCP tool backed by the existing Code Scribe Core.
- Local validation, protocol tests and public-package boundary checks.
