---
name: audit
description: Milestone-close audit of a repo. Use when a GitHub milestone completes, before a release, or on request ("audit this milestone/project"). Sweeps everything merged under the milestone for constitution drift, test-coverage holes, doc drift, dependency risk — and audits the pipeline itself. Run with the strongest available model (fable).
---

# audit

Runs at every milestone close, before the next milestone starts. Use the strongest
available model (`fable`) — this is the judgment-heavy counterweight to the
day-to-day pipeline.

## Scope

Everything merged under the milestone:
`gh pr list --state merged --search "milestone:<name>"` plus the issue list.

## Sweep

1. **Constitution compliance** — sample the merged diffs against the locked
   decisions and architecture rules. Drift compounds; name every violation.
2. **Test honesty** — find tests that assert shape but not behavior; acceptance
   criteria that shipped without a covering test.
3. **Doc drift** — user-facing surfaces vs actual behavior (spot-check by running
   the documented commands).
4. **Dependency & license** — anything new since last audit; staleness; known CVEs
   where ecosystem tooling exists.
5. **Pipeline retrospective** — review-round counts, escalations, hook failures
   during the milestone: which stage generated waste? Did any agent rule get
   ignored repeatedly (a sign the rule belongs in a hook, not a prompt)?
6. **Prompt audit** — if a new model generation shipped since the last audit,
   re-read the cobots agent prompts for instructions that no longer fit (severity
   filters, over-triggering warnings, model-specific workarounds).

## Output

An audit report comment on the milestone's tracking issue (or a new issue titled
`audit: <milestone>`): findings ranked by severity, each with file/PR references
and a one-line fix. File a `gh issue` per medium+ finding, milestone-tagged for
the next cycle. End with a one-paragraph verdict: is the codebase healthier than
at the last audit?

## Must not

- Fix anything in-place — the audit files issues; the pipeline fixes them.
- Filter findings for politeness. Report everything, ranked.
