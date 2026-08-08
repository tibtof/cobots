#!/bin/bash
# PostToolUse(Bash) hook: after a successful `gh pr create`, sync the issue's
# status labels (ready-for-dev -> ready-for-review) so label state does not
# depend on agent discipline. Opt-in via .claude/pipeline.md. Best-effort:
# never blocks, never fails.

input=$(cat)

printf '%s' "$input" | python3 -c '
import json, os, re, subprocess, sys

try:
    data = json.load(sys.stdin)
except Exception:
    sys.exit(0)

cmd = (data.get("tool_input") or {}).get("command", "")
if "gh pr create" not in cmd:
    sys.exit(0)

cwd = data.get("cwd") or "."
try:
    root = subprocess.run(
        ["git", "-C", cwd, "rev-parse", "--show-toplevel"],
        capture_output=True, text=True, timeout=10,
    ).stdout.strip()
    if not root or not os.path.isfile(os.path.join(root, ".claude", "pipeline.md")):
        sys.exit(0)
    branch = subprocess.run(
        ["git", "-C", cwd, "rev-parse", "--abbrev-ref", "HEAD"],
        capture_output=True, text=True, timeout=10,
    ).stdout.strip()
    m = re.match(r"(?:feat|fix|chore|docs|test|refactor)/(\d+)-", branch)
    if not m:
        sys.exit(0)
    subprocess.run(
        ["gh", "issue", "edit", m.group(1),
         "--remove-label", "status:ready-for-dev",
         "--add-label", "status:ready-for-review"],
        capture_output=True, timeout=30, cwd=root,
    )
except Exception:
    pass
'
exit 0
