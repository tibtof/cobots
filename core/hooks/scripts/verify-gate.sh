#!/bin/bash
# SubagentStop gate for the dev agent: block completion until the project's
# verify command passes. Opt-in: no-op unless .claude/pipeline.md exists.
# Exit 0 = allow stop; exit 2 = block, stderr is fed back to the agent.

input=$(cat)

get() {
  printf '%s' "$input" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('$1',''))" 2>/dev/null
}

# Loop guard: if this stop was already blocked once by a hook, let it through.
[ "$(get stop_hook_active)" = "True" ] && exit 0

cwd=$(get cwd)
cd "${cwd:-.}" 2>/dev/null || exit 0

# Opt-in marker: only gate repos on the cobots pipeline.
root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0
[ -f "$root/.claude/pipeline.md" ] || exit 0

# The verify command is the value of the "verify:" key in pipeline.md.
verify_cmd=$(sed -n 's/^verify:[[:space:]]*//p' "$root/.claude/pipeline.md" | head -1)
[ -n "$verify_cmd" ] || exit 0

# Only gate work on a feature branch — a dev agent that stopped on main did no code work.
branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
case "$branch" in
  main|master|HEAD|"") exit 0 ;;
esac

out=$(cd "$root" && eval "$verify_cmd" 2>&1)
if [ $? -ne 0 ]; then
  {
    echo "verify gate failed ($verify_cmd) — fix this before finishing; do not open/update the PR until it passes:"
    echo "$out" | tail -40
  } >&2
  exit 2
fi
exit 0
