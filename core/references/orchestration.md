# cobots orchestration rules

How the roles compose. These rules bound every workflow and ad-hoc invocation.

1. **The orchestrator is the workflow script or the human — never a role agent.**
   Roles do not invoke roles. No router agents, no delegation trees. The only
   endorsed multi-agent shape is parallel fan-out + merge (reviewer ∥ writer).
2. **Scale effort to complexity.** A two-line fix does not get a pipeline; run the
   light tier or just fix it in the main session with a reviewer pass. Full tier is
   for ADR-worthy work. The triage rules live in the orchestrator prompt, not in a
   dedicated triage agent.
3. **Structured handoffs.** Stages exchange named, schema-bounded payloads (design
   summary, PR number + branch, verdict + blocking items, doc_flags) — never full
   transcripts. This is the main token-cost control.
4. **Bounded loops.** Review-fix cycles cap at 3 rounds, then escalate to the human.
   Nothing polls forever.
5. **Deterministic gates over agent goodwill.** Anything mechanically checkable
   (verify command, label sync, cleanup) is a hook or script, not a prompt instruction.
6. **Model tiers by role** (aliases only, retuned in one place):
   judgment roles (pm, architect, reviewer) → `opus` · implementation (dev, writer)
   → `sonnet` · mechanical/triage steps → `haiku` · milestone audit → `fable`.
7. **Report everything, filter downstream.** Finders and reviewers record all
   candidate findings first, then refute (two-pass). "Only report high-severity"
   prompts silently suppress real findings.
