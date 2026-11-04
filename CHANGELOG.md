# Changelog

All notable changes to the cobots plugins. Format: [Keep a Changelog](https://keepachangelog.com/), versioning: semver per plugin (versions in each plugin's `plugin.json`).

## [Unreleased]

### Changed
- CI: track GitHub Actions with Dependabot (weekly, minor and patch grouped). Actions are the only versioned dependency in the repo; the JBang script has no `//DEPS` (#1)
- CI: `actions/checkout` v4 to v7 and `actions/setup-java` v4 to v6. Both move to Node 24; checkout v7 refuses fork checkout under `pull_request_target` and `workflow_run` (neither trigger is used here), setup-java v6 drops the legacy Adopt distributions (we use temurin). No input used here changed. Checkout credentials are no longer persisted, since no job uses git remotes after checkout (#2)

### Fixed
- CI: syntax-check every hook script. `bash -n a.sh b.sh` parsed only the first and passed the rest as arguments, so two of the three were never checked (#1)

## [0.1.0] - 2026-08-08

### Added
- `cobots-core`: pm/architect/dev/reviewer/writer agents (best-of merge of the vibewarden/httptape/lgtm-buzzer/fforj pipeline lineage, generalized — project deltas live in each repo's `.claude/pipeline.md`)
- `cobots-core`: `github-flow`, `pipeline-setup`, `verify`, `audit` skills; state-machine and orchestration references; CLAUDE.md constitution + pipeline.md templates
- `cobots-core`: `issue-pipeline` workflow with light/full tiers and schema-constrained handoffs
- `cobots-core`: hooks — dev verify gate (SubagentStop), PR label sync (PostToolUse), post-merge cleanup script; all no-op in repos without `.claude/pipeline.md`
- `cobots-java`: java-idioms skill with JBang-compiled examples, jdtls LSP recommendation
- Evals: structural lint + trigger checks, wired into CI
