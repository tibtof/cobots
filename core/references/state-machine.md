# cobots state machine (harness-neutral spec)

Pipeline state lives on the forge, not in any harness. Any tool that can drive
`gh` (Claude Code, opencode, Copilot CLI, a human) can play any role.

## Labels — machine truth and work claim

Six `status:*` labels on the issue (mirrored on the PR once it exists). Exactly
one is present at a time; holding it claims the work — nobody else touches an
issue whose status another agent is processing.

```
status:ready-for-arch        PM finished the spec; architect may claim
status:needs-clarification   architect bounced the spec back; PM/human must act
status:ready-for-dev         design done; dev may claim
status:ready-for-review      PR open; reviewer (∥ writer) may claim
status:changes-requested     review found blockers; dev may claim the fix round
status:approved              all reviewers approved; merge gate may act
```

Transitions always swap atomically: `gh issue edit <n> --remove-label "<old>" --add-label "<new>"`.
After merge, all `status:*` labels are removed from issue and PR.

Other labels are categorization, never state: `area:*`, `breaking-change`.

## Comments — human narrative

Labels carry state; comments carry the story. Each stage posts one short handoff
comment: the spec (PM), the ADR pointer (architect), the verdict with findings
(reviewer/writer). Never post the full ADR to the issue; never post status-only
comments.

## Milestones — roadmap and audit trigger

Every issue belongs to a GitHub milestone. Milestone completion
(`gh api repos/{owner}/{repo}/milestones` → `open_issues == 0`) triggers the
`audit` skill over everything merged under it. Milestones are the roadmap view.

## Light vs full tier

- **light** (default for small projects): issue → dev → reviewer (writer only if
  doc_flags) → merge gate. Labels used: ready-for-review onward.
- **full**: issue → PM → architect → dev → reviewer ∥ writer → merge gate. All six labels.

Per-issue override beats the pipeline.md default: anything ADR-worthy (new public
surface, new architectural concept, wire-format change, security-sensitive) runs
full; bug fixes, docs, chores run light. Scale effort to complexity.

## Invariants

- One issue = one branch (`type/<n>-slug`) = one PR = one owner at a time.
- Work never exists only locally — branches push early, PRs open early.
- Parallel work means separate issues (or separate worktrees); never a shared branch.
- Stages that touch shared files (CHANGELOG, ADR log) are serialized — never run
  two pipelines on the same repo concurrently.
- Humans outrank cobots: a human comment or label change wins over any agent plan.
