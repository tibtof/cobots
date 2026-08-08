# cobots — authoring constitution

Rules for changing this repo (humans and agents alike).

## Locked decisions (do not relitigate)

| Decision | Choice | Reason |
|---|---|---|
| Content style | Harness-neutral markdown; Claude Code specifics only in manifests, hooks.json, workflow | Portability — other harnesses consume the same files |
| State | Forge labels + milestones, never harness-local state | Any tool driving `gh` can play any role |
| Models | Aliases only (`opus`/`sonnet`/`haiku`/`fable`), one tier table in README | Survives model releases without edits |
| Generalization | No project names, machine paths, or personal specifics in `core/` or `lang/` | Enforced by `evals/check.py` FORBIDDEN list |
| Orchestration | Roles never invoke roles; fan-out+merge is the only multi-agent shape | See `core/references/orchestration.md` |

## Authoring rules

- **Agents ≤120 lines** (eval-enforced), skills ~50–80: terse imperative
  checklists; detail goes to `core/references/` or a skill-local `references/`.
- **Descriptions route**: third person, "Invoke when…", trigger vocabulary packed
  in — routing happens on the description before the body loads. New skill ⇒ add
  a trigger case to `evals/check.py`.
- **Examples compile**: language-overlay skills bundle a verify script
  (`lang/java/skills/java-idioms/scripts/VerifyExamples.java` is the reference);
  changing an example means updating and running the script. CI compiles them.
- **Skill-specific references live inside the skill dir** so per-skill installs
  stay self-contained; cross-role material lives in `core/references/`.
- **Every change**: run `python3 evals/check.py`, bump the affected plugin's
  `plugin.json` semver (patch=fix/typo, minor=new capability, major=contract
  change), add a CHANGELOG entry.

## Prompt audit (run at every model release)

New Claude generation GA ⇒ open an issue and sweep:

1. Re-read every agent prompt for instructions tuned to the old generation
   (severity filters, over-triggering warnings, verbosity workarounds) — stale
   instructions actively degrade newer models.
2. Re-check the model-tier table: does the new family shift which tier a role needs?
3. Re-run a full-tier pipeline on a sandbox issue and read the transcripts for
   waste (re-reading, re-litigating, ignored rules — a repeatedly ignored rule
   belongs in a hook, not a prompt).
4. Record findings in the CHANGELOG.
