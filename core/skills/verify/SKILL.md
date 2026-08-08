---
name: verify
description: Prove a change works in the running application, not just in tests. Use when asked to verify, smoke-test, or demo a change end-to-end, or before approving work that alters user-visible behavior. Generic runbook — project specifics come from the repo's own docs and pipeline.md.
---

# verify

Tests passing is necessary, not sufficient. This skill proves the change works in
the real running app.

## Runbook

1. **Gate first** — run the `verify:` command from `.claude/pipeline.md`. Red gate
   → stop, report, fix; don't bother launching.
2. **Bring it up** — use the project's documented dev entrypoint (README / run
   scripts / compose file). Wait on a health endpoint or readiness log line, not a
   sleep. Report exact failure output if it won't start.
3. **Drive the change** — exercise the changed behavior specifically: the new CLI
   flag, the changed endpoint (`curl` it, assert on the body), the UI path. For
   generated-output tools, diff the output before/after.
4. **Tear down** — kill what you started; leave no orphan processes or containers.

## Browser-driving gotchas (chrome-devtools MCP)

- Prefer snapshot/selector-based clicks; coordinate clicks are unreliable.
- React inputs ignore raw value assignment — use the native setter + `input` event,
  and `focusout` rather than `blur` where handlers listen for it.
- A stuck `window.confirm` freezes the page — handle dialogs before clicking.
- Know the unsafe targets: buttons that spend money or call paid APIs are
  off-limits in verification; list the safe subset before you start clicking.

## Report

What you ran, what you observed (exact output/screenshot), verdict: works /
doesn't / works-with-caveats. Never report "verified" for anything you didn't
actually observe running.
