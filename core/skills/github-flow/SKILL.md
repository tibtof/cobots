---
name: github-flow
description: The cobots forge discipline — issue → branch → PR → milestone flow with zero lost work. Use when creating issues, branching, opening or merging PRs, coordinating parallel agents on one repo, or recovering interrupted work. All forge operations live here (the seam for a future non-GitHub forge).
---

# github-flow

Every change follows: **issue → `type/<n>-slug` branch → early-pushed PR → review →
squash-merge → cleanup**. Work must never exist only locally.

## Quick start

```bash
gh issue create --title "..." --body "..." --milestone "<name>" --label "area:..."
git fetch origin main && git checkout -b feat/42-short-slug origin/main
# ...commit...
git push -u origin feat/42-short-slug          # push at first commit, not at the end
gh pr create --title "feat(#42): ..." --body "Closes #42 ..."
gh pr merge 42 --squash --delete-branch        # only at status:approved
```

## Rules

1. **One issue = one branch = one PR = one owner at a time.** The `status:*` label
   claims the work (see the state machine in `../../references/state-machine.md`).
   Never touch an issue whose status another agent holds.
2. **Branch `type/<issue>-<slug>`**, `type` ∈ feat|fix|chore|docs|test|refactor,
   always from `origin/main` after a fetch — never from another issue's branch.
3. **Push early.** First commit → push → PR (draft is fine). The forge is the
   backup; the worst interruption loses only uncommitted local edits.
4. **Parallel agents get separate issues** (or separate worktrees for one issue's
   sub-tasks — clean them up after). Never share a branch between agents.
5. **Serialize shared files.** CHANGELOG and the ADR log are append-contention
   points — never run two pipelines on the same repo at once.
6. **Stage by path.** Never `git add .` / `git add -A` (they grab agent scratch
   dirs). Check for orphans first: `git status --short | grep '^??'`.
7. **Conventional commits** `type(#issue): description`. Squash-merge with branch
   delete; then remove all `status:*` labels and confirm the issue closed.
8. **Never `--admin` merge; never force-push another owner's branch; never push
   to main.** Escalate to the human instead of overriding a failed gate.
9. **Milestones**: every issue gets one at creation. When a milestone's open-issue
   count hits zero, run the `audit` skill before starting the next one.

## Recovery

Interrupted work: `gh pr list --author @me` + `git worktree list` + branch list
show what was in flight; the issue's `status:*` label says which stage owns it.
Resume from the forge state — never restart from scratch or duplicate a PR.
Leaked worktrees: `git worktree list` → `git worktree remove <path>` → `git worktree prune`.
