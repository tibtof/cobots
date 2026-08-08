# CLAUDE.md constitution template

Each consuming project keeps its architecture/style truth in its own CLAUDE.md
(auto-loaded into every agent, including cobots roles). The pipeline works best
when it has this spine — copy and fill:

```markdown
# <project> — project constitution

## What this is
<2-4 sentences: what the project does, who consumes it.>

## Locked decisions (do not relitigate)
| Decision | Choice | Reason |
|---|---|---|
| Language | ... | ... |
| Runtime deps | ... | ... |
| ... | ... | ... |

## Architecture principles
<Hexagonal is the cobots default — state deviations explicitly.
Layout, dependency-direction rules, purity rules.>

## Code style
<Functional-style defaults: immutability, errors as values, no null returns.
Naming, doc-comment expectations, test naming.>

## Build & verify
<The named gate command (must match pipeline.md `verify:`), plus other targets.>

## Conventions
<Commits, branch naming, PR rules.>
```

Rules of thumb (learned across consuming projects):

- Keep it under ~200 lines; reference detail lives elsewhere. Long constitutions
  reduce adherence.
- The **locked-decisions table** is the highest-value section — it's what stops
  agents from relitigating settled questions. Give every row a Reason.
- Concrete beats vague: "records + sealed interfaces for ADTs" outperforms
  "prefer immutability".
- Operational pipeline config (verify command, tier, changelog path) goes in
  `.claude/pipeline.md`, not here — see `pipeline-template.md`.
