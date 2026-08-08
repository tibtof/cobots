---
name: pipeline-setup
description: Onboard the current repo onto the cobots pipeline. Use when adopting cobots in a project, setting up the pipeline, creating status labels, or writing .claude/pipeline.md. Detects language and build system, creates labels and a first milestone, and recommends the matching LSP plugin.
---

# pipeline-setup

Onboards the current repo. Idempotent — safe to re-run.

## Steps

1. **Detect** — build system and language from the repo root: `gradlew`/`pom.xml`
   (java/kotlin), `go.mod` (go), `package.json` (ts/js), `Makefile`, `Cargo.toml`.
   Derive the verify command (`./gradlew check`, `go test ./...`, `npm run check`,
   `make check`, `cargo test`) and confirm it actually runs before writing it down.
2. **Write `.claude/pipeline.md`** from `../../references/pipeline-template.md`:
   `tier:` (ask the user; small/solo project → `light`), the confirmed `verify:`,
   `changelog:`/`adr:` from what exists in the repo, `language:`.
3. **Create the six status labels** (idempotent):
   ```bash
   for l in ready-for-arch needs-clarification ready-for-dev ready-for-review changes-requested approved; do
     gh label create "status:$l" --color 1D76DB --force
   done
   ```
4. **Create the first milestone** if none is open:
   `gh api repos/{owner}/{repo}/milestones -f title="<next release/phase>"`.
5. **Recommend the LSP plugin** for the detected language — official marketplace:
   `jdtls-lsp` (java), `kotlin-lsp`, `gopls-lsp` (go), `typescript-lsp` (ts/js),
   `pyright-lsp` (python), `rust-analyzer-lsp` (rust). Also recommend the matching
   cobots language overlay (e.g. `cobots-java`) if one exists. Recommend only —
   the user installs.
6. **Constitution check** — if the repo has no CLAUDE.md, offer to start one from
   `../../references/constitution-template.md`. If it has one, check it names the
   same verify command and flag contradictions.
7. **Report** — what was created, what was skipped as already present, and the
   suggested coarse permission baseline (gh/git/build-tool) if the project's
   settings.json lacks one.

## Must not

- Overwrite an existing `.claude/pipeline.md` without showing a diff first.
- Write a `verify:` command you haven't successfully run.
- Install anything — recommendations only.
