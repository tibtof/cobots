# cobots

**Agent pipeline plugins — collaborative robots, human merges.**

cobots turns any GitHub repo into an assembly line for AI coding agents:
`pm → architect → dev → reviewer ∥ writer → gated merge`, with all pipeline
state living on the forge (labels, milestones, PRs) so any harness that can
drive `gh` can play a role. Industrial [cobots](https://en.wikipedia.org/wiki/Cobot)
are robots built to share a workspace with humans — same idea here: the agents
do the line work, a human owns the merge button and everything the gates escalate.

## Install (Claude Code)

```
/plugin marketplace add tibtof/cobots
/plugin install cobots-core@cobots
/plugin install cobots-java@cobots     # if it's a Java project
```

Then, inside the repo you want on the pipeline:

```
/cobots-core:pipeline-setup
```

That detects your build system, writes `.claude/pipeline.md` (the per-project
config and opt-in marker), creates the six `status:*` labels and a first
milestone, and recommends the LSP plugin for your language.

Run an issue through the pipeline:

```
/cobots-core:issue-pipeline 42          # tier chosen by triage
/cobots-core:issue-pipeline 42 light    # force light tier
```

## How it works

- **State machine on the forge** ([spec](core/references/state-machine.md)):
  six `status:*` labels are the machine truth and the work-claim lock; comments
  carry the human narrative; milestones are the roadmap, and a milestone close
  triggers the `audit` skill.
- **Two tiers**: `light` (dev → reviewer — bug fixes, docs, chores, small
  projects) and `full` (adds PM spec, architect ADR, writer doc review — anything
  ADR-worthy). Scale effort to complexity.
- **Deterministic gates**: a stop hook blocks the dev agent until the project's
  `verify:` command passes; a PostToolUse hook syncs status labels on PR
  creation; the merge gate refuses >50-file diffs, `--admin`, and unresolved
  threads. All hooks no-op in repos without `.claude/pipeline.md`.
- **Structured handoffs**: stages exchange schema-bounded payloads (design
  summary, PR number, verdict, doc flags) — never transcripts.
- **Docs stay honest**: dev and reviewer *flag* affected doc surfaces; the
  writer agent applies exactly those flags on the PR branch.

## Per-project configuration

Two files in each consuming repo, with a strict split:

| file | contains |
|---|---|
| `CLAUDE.md` | the constitution: locked decisions, architecture and style rules ([template](core/references/constitution-template.md)) |
| `.claude/pipeline.md` | operational config: tier, verify command, changelog/ADR paths, language ([template](core/references/pipeline-template.md)) |

cobots defaults apply where the constitution is silent: hexagonal architecture,
functional style (immutability, errors as values), conventional commits.

## Model tiers

One table, aliases only — retune here when a new model generation ships:

| role | model | why |
|---|---|---|
| pm, architect, reviewer | `opus` | judgment-heavy gates |
| dev, writer | `sonnet` | implementation throughput |
| triage, mechanical steps | `haiku` | cheap and fast |
| milestone audit | `fable` | strongest model for the periodic deep look |

## Permission baseline

A coarse, pipeline-shaped allowlist for consuming projects (instead of accreting
one-off entries): `gh issue *`, `gh pr *`, `gh api *`, `gh label *`, `git *`,
your build tool (`./gradlew *` / `go *` / `npm *` / `make *`).

## Repo layout

```
core/        cobots-core plugin: agents, skills, workflow, hooks, references
lang/java/   cobots-java overlay: idiom skill with JBang-compiled examples
lang/{go,ts,kotlin}/  planned overlays
evals/       structural lint + trigger checks (CI-enforced)
```

## Design lineage

The pipeline content is battle-tested across several private projects and
generalized here; the packaging and authoring style borrow deliberately from
[alexandru/skills](https://github.com/alexandru/skills) (terse skills,
compiled examples) and
[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)
(marketplace shape, eval discipline, orchestration constitution).

License: MIT
