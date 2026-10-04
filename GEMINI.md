# AIWS Code Scribe

Use `code_scribe_generate_patch` only after the requested change has been
normalized into a complete structured task with exact target files, current
code in `current_files: [{ path, content }]`, `allow_write`, `deny_write`,
acceptance criteria and size limits. Preserve every path exactly; never convert
slashes or dots to underscores and never send `current_code` to this Gemini
tool.

The tool is a ZERO_AI deterministic patch generator. It does not inspect a
repository, apply a patch, change dependencies, or expand scope. Report the
returned status exactly. For `PATCH_READY`, show the files, changed-line count,
risk, patch digest and patch preview, and remind the user that the patch has not
been applied. For `SCOPE_BLOCKED`, `VALIDATION_FAILED`, `NO_MATCHING_RECIPE`,
`NEED_CONTEXT`, `HUMAN_REQUIRED` or `ERROR`, do not invent a patch or claim the
task was completed.
