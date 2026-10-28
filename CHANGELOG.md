# Changelog

All notable changes to the cobots plugins. Format: [Keep a Changelog](https://keepachangelog.com/), versioning: semver per plugin (versions in each plugin's `plugin.json`).

## [Unreleased]

## [0.2.0] - 2026-10-27

### Added
- `cobots-core`: `ceo` agent — ranks milestones and issues against the project's north star, defers competing work, makes launch calls for switched-off features; reads a new `## Strategy` section in `.claude/pipeline.md` (template updated)

## [0.1.0] - 2026-08-08

### Added
- `cobots-core`: pm/architect/dev/reviewer/writer agents (best-of merge of the vibewarden/httptape/lgtm-buzzer/fforj pipeline lineage, generalized — project deltas live in each repo's `.claude/pipeline.md`)
- `cobots-core`: `github-flow`, `pipeline-setup`, `verify`, `audit` skills; state-machine and orchestration references; CLAUDE.md constitution + pipeline.md templates
- `cobots-core`: `issue-pipeline` workflow with light/full tiers and schema-constrained handoffs
- `cobots-core`: hooks — dev verify gate (SubagentStop), PR label sync (PostToolUse), post-merge cleanup script; all no-op in repos without `.claude/pipeline.md`
- `cobots-java`: java-idioms skill with JBang-compiled examples, jdtls LSP recommendation
- Evals: structural lint + trigger checks, wired into CI
