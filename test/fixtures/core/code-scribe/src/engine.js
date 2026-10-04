export class CodeScribeEngine {
  generate(task) {
    const file = task?.expected_change?.file;
    if (!file || !task.allow_write?.includes(file) || !task.target_files?.includes(file)) {
      return { status: 'SCOPE_BLOCKED', files: file ? [file] : [], patch: '', changed_lines: 0, applied: false };
    }
    const before = task.current_code?.[file];
    const { selector, property, value } = task.expected_change;
    const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matcher = new RegExp(`(${escapedSelector}\\s*\\{[^}]*${property}\\s*:\\s*)([^;]+)(;)`);
    const after = typeof before === 'string' ? before.replace(matcher, `$1${value}$3`) : before;
    if (typeof before !== 'string' || after === before) {
      return { status: 'NO_MATCHING_RECIPE', files: [], patch: '', changed_lines: 0, applied: false };
    }
    return {
      status: 'PATCH_READY',
      provider: 'ZERO_AI_TEST_FIXTURE',
      recipe: 'css-property-change',
      files: [file],
      patch: `--- a/${file}\n+++ b/${file}\n@@ -1 +1 @@\n-${before}\n+${after}\n`,
      changed_lines: 2,
      risk: 'low',
      notes: ['Adapter protocol fixture only.'],
      applied: false
    };
  }
}
