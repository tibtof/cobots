# .claude/pipeline.md — per-project cobots config

Copy this file to a project's `.claude/pipeline.md` to opt it into the pipeline.
Its presence is the opt-in marker: cobots hooks and workflow no-op without it.
Keep the `key: value` lines exactly as shown (greppable by hooks); prose goes
under Deviations.

```markdown
# cobots pipeline

tier: light
verify: ./gradlew check
changelog: none
adr: decisions.md
language: java

## Deviations

<!-- Project-specific overrides of cobots defaults, e.g.:
- Architecture: single flat package, no internal/ split (overrides hexagonal default)
- Coverage target: 90% (library)
-->
```

## Keys

| key | values | meaning |
|---|---|---|
| `tier` | `light` \| `full` | default pipeline tier: light = dev → reviewer; full = pm → architect → dev → reviewer ∥ writer |
| `verify` | shell command | THE quality gate; dev cannot finish while it fails (enforced by the SubagentStop hook) |
| `changelog` | path \| `none` | if a path, dev must add an entry on every PR |
| `adr` | path \| `none` | ADR log location; `none` disables the ADR requirement (architect still posts design to the issue) |
| `language` | e.g. `java`, `go`, `ts`, `kotlin` | which cobots language overlay's idiom skill applies; also drives the LSP recommendation |

Architecture and style rules do NOT go here — they belong in the project's
CLAUDE.md constitution (auto-loaded into every agent). See
`constitution-template.md`. cobots defaults apply when the constitution is
silent: hexagonal architecture (pure domain core, ports/adapters), functional
style (immutability, errors as values, declarative over imperative).
