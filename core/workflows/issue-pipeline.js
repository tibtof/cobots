export const meta = {
  name: 'issue-pipeline',
  description: 'Run one GitHub issue end-to-end: triage → (PM → Architect on full tier) → Dev → Reviewer ∥ Writer → fix loop → gated merge',
  whenToUse: 'Invoke as /cobots-core:issue-pipeline <issue-number> [light|full] in a repo with .claude/pipeline.md. One issue at a time — dev stages share the changelog/ADR log and must stay serialized.',
  phases: [
    { title: 'Triage', detail: 'read pipeline.md config, pick tier' },
    { title: 'Spec & Design', detail: 'PM spec + architect design (full tier only)' },
    { title: 'Implement', detail: 'dev: branch, code, tests, verify gate, PR' },
    { title: 'Review', detail: 'reviewer (∥ writer when docs affected), fix loop' },
    { title: 'Merge', detail: 'safety-gated merge + cleanup' },
  ],
}

const [issue, tierOverride] = String(args ?? '').trim().split(/\s+/)
if (!issue?.match(/^\d+$/)) throw new Error('Usage: /cobots-core:issue-pipeline <issue-number> [light|full]')

// ---------- schemas ----------
const TRIAGE = {
  type: 'object', additionalProperties: false,
  required: ['has_pipeline', 'repo', 'tier', 'verify_cmd', 'title', 'reason'],
  properties: {
    has_pipeline: { type: 'boolean', description: 'false if .claude/pipeline.md is missing from the repo' },
    repo: { type: 'string', description: 'owner/name from gh repo view' },
    tier: { type: 'string', enum: ['full', 'light'] },
    verify_cmd: { type: 'string', description: 'the verify: command from pipeline.md' },
    changelog: { type: 'string', description: 'changelog path from pipeline.md, or "none"' },
    title: { type: 'string' },
    reason: { type: 'string' },
    already_done: { type: 'boolean', description: 'true if the issue appears already resolved on main' },
  },
}
const DEV_OUT = {
  type: 'object', additionalProperties: false,
  required: ['pr_number', 'branch', 'summary', 'doc_flags'],
  properties: {
    pr_number: { type: 'integer' },
    branch: { type: 'string' },
    summary: { type: 'string' },
    doc_flags: { type: 'array', items: { type: 'string' }, description: 'user-facing doc surfaces this diff affects' },
  },
}
const VERDICT = {
  type: 'object', additionalProperties: false,
  required: ['verdict', 'summary'],
  properties: {
    verdict: { type: 'string', enum: ['approve', 'changes'] },
    summary: { type: 'string' },
    blocking_items: { type: 'array', items: { type: 'string' } },
    doc_flags: { type: 'array', items: { type: 'string' } },
  },
}
const MERGE_OUT = {
  type: 'object', additionalProperties: false,
  required: ['merged'],
  properties: {
    merged: { type: 'boolean' },
    escalate_reason: { type: 'string', description: 'set when merged=false: why a human must look' },
  },
}

// ---------- Triage ----------
phase('Triage')
const triage = await agent(
  `Read .claude/pipeline.md in this repo (if absent, return has_pipeline=false and stop). ` +
  `Report the repo slug (gh repo view --json nameWithOwner -q .nameWithOwner), the verify: command, and the changelog: value. ` +
  `Then read GitHub issue #${issue} (gh issue view ${issue} --comments) and skim git log --oneline -15 to check it is not already fixed. ` +
  (tierOverride
    ? `The invoker forced tier "${tierOverride}" — use it.`
    : `Pick the tier: "full" for features, new public surface, new architectural concepts, wire-format or security-sensitive changes — anything ADR-worthy per the project constitution; ` +
      `"light" for bug fixes, docs, chores, dependency bumps. Default from pipeline.md tier: when the issue is borderline.`),
  { label: `triage:#${issue}`, effort: 'low', model: 'haiku', schema: TRIAGE },
)
if (!triage) throw new Error('triage agent failed')
if (!triage.has_pipeline) throw new Error('No .claude/pipeline.md — run the pipeline-setup skill first')
if (triage.already_done) return { skipped: true, reason: `#${issue} appears already resolved: ${triage.reason}` }
const REPO = triage.repo
const tier = tierOverride === 'light' || tierOverride === 'full' ? tierOverride : triage.tier
log(`#${issue} "${triage.title}" → ${tier} tier (${triage.reason})`)

// ---------- Spec & Design (full tier only) ----------
let designNote = ''
if (tier === 'full') {
  phase('Spec & Design')
  await agent(
    `Process GitHub issue #${issue} in ${REPO} per your standard workflow: turn it into a full spec with acceptance criteria, ` +
    `assign a milestone, set status:ready-for-arch. Challenge the story if it is redundant or wrong-direction — if so, say so in a comment and stop.`,
    { agentType: 'pm', label: `pm:#${issue}`, phase: 'Spec & Design' },
  )
  const design = await agent(
    `Produce the technical design for GitHub issue #${issue} in ${REPO} per your standard workflow ` +
    `(validate the spec against the constitution's locked decisions, write the ADR if pipeline.md names an ADR log, ` +
    `post the pointer comment, set status:ready-for-dev). ` +
    `Return a compact summary: files to touch, new types/interfaces, acceptance criteria, non-obvious traps.`,
    { agentType: 'architect', label: `architect:#${issue}`, phase: 'Spec & Design' },
  )
  designNote = design ? `\n\nArchitect design summary:\n${design}` : ''
}

// ---------- Implement ----------
phase('Implement')
const devPrompt = (extra) =>
  `Implement GitHub issue #${issue} in ${REPO} per your standard workflow. ` +
  `${tier === 'full' ? 'The architect design is in the issue comments and the ADR log.' : 'This is a light-tier change: plan briefly from the issue itself (no PM/architect stage ran), keep the diff minimal.'} ` +
  `Hard requirements: branch from origin/main; \`${triage.verify_cmd}\` must pass before the PR; ` +
  `${triage.changelog && triage.changelog !== 'none' ? `a ${triage.changelog} entry is mandatory; ` : ''}` +
  `never leave a docs-only commit as the PR head; stage files by path, never git add -A. ` +
  `${extra}${designNote} Return the PR number, branch name, and doc_flags.`

let dev = await agent(devPrompt('Open the PR when done.'), {
  agentType: 'dev', label: `dev:#${issue}`, schema: DEV_OUT,
})
if (!dev?.pr_number) throw new Error('dev stage did not produce a PR')
log(`PR #${dev.pr_number} opened on ${dev.branch}${dev.doc_flags.length ? ` (doc flags: ${dev.doc_flags.join(', ')})` : ''}`)

// ---------- Review (fix loop) ----------
phase('Review')
let docFlags = [...new Set(dev.doc_flags)]
const reviewOnce = async (round) => {
  const jobs = [
    () => agent(
      `Review PR #${dev.pr_number} in ${REPO} (linked issue #${issue}) per your standard two-pass workflow ` +
      `(coverage pass, then refute; run \`${triage.verify_cmd}\` yourself; inline comments only for verified must-fix findings; ` +
      `post the verdict as a PR comment; flip the status labels). Report any doc_flags the dev missed. ` +
      `${round > 1 ? `Re-review round ${round}: verify the previous blocking items were fixed, resolve addressed threads, do not re-litigate what you already approved.` : ''}`,
      { agentType: 'reviewer', label: `reviewer:r${round}:#${dev.pr_number}`, phase: 'Review', schema: VERDICT },
    ),
  ]
  const writerRuns = tier === 'full' || docFlags.length > 0
  if (writerRuns) jobs.push(() => agent(
    `Act as the writer cobot for PR #${dev.pr_number} in ${REPO} (linked issue #${issue}). ` +
    `${tier === 'full' ? 'Full-tier review mode: sweep every user-facing doc surface the diff could affect.' : `Flag-and-apply mode. Flagged surfaces:\n- ${docFlags.join('\n- ')}`} ` +
    `Apply doc fixes directly on branch ${dev.branch} per your standard workflow; post your verdict as a PR comment. ` +
    `${round > 1 ? `Re-review round ${round}: check only whether your previous blocking items were addressed.` : ''}`,
    { agentType: 'writer', label: `writer:r${round}:#${dev.pr_number}`, phase: 'Review', schema: VERDICT },
  ))
  return { verdicts: await parallel(jobs), writerRan: writerRuns }
}

let approved = false
for (let round = 1; round <= 3; round++) {
  const { verdicts, writerRan } = await reviewOnce(round)
  const [rev, wri] = verdicts
  if (!rev || (writerRan && !wri)) throw new Error(`review round ${round}: an agent failed`)
  docFlags = [...new Set([...docFlags, ...(rev.doc_flags ?? [])])]
  if (rev.verdict === 'approve' && (!writerRan || wri.verdict === 'approve')) { approved = true; break }
  const blockers = [...(rev.blocking_items ?? []), ...(writerRan ? wri.blocking_items ?? [] : [])]
  log(`round ${round}: changes requested (${blockers.length} items) — dispatching fix`)
  if (round === 3) break
  await agent(
    devPrompt(
      `The PR already exists (#${dev.pr_number}, branch ${dev.branch}) — do NOT create a new branch or PR. ` +
      `Check out ${dev.branch}, address exactly these review items, run \`${triage.verify_cmd}\`, push. Items:\n- ${blockers.join('\n- ')}`,
    ),
    { agentType: 'dev', label: `dev-fix:r${round}:#${dev.pr_number}`, phase: 'Review', schema: DEV_OUT },
  )
}
if (!approved) return { merged: false, pr: dev.pr_number, escalate: 'not approved after 3 review rounds — human review needed' }

// ---------- Merge (safety-gated) ----------
phase('Merge')
const merge = await agent(
  `You are the merge gate for PR #${dev.pr_number} in ${REPO}. The review stage approved. ` +
  `Steps, in order — abort with merged=false and an escalate_reason if ANY gate fails:\n` +
  `1. SANITY GATE: gh pr diff ${dev.pr_number} --stat. More than 50 files changed, or deletions that look like mass file removal → DO NOT MERGE, escalate.\n` +
  `2. Confirm the approval comment exists on the PR ("Reviewer cobot: APPROVED"${tier === 'full' ? ' and a Writer cobot approval/updated verdict' : ''}).\n` +
  `3. Checks: gh pr checks ${dev.pr_number}. Poll up to ~10 min while required checks run. ` +
  `Empty checks list because CI is disabled → proceed (the verify gate ran locally). ` +
  `BLOCKED with required checks absent on a code PR → the docs-only-head path-filter trap: escalate, do not poll forever.\n` +
  `4. Resolve remaining review threads via the GraphQL resolveReviewThread mutation (they were addressed in fix rounds).\n` +
  `5. Merge: gh pr merge ${dev.pr_number} --squash --delete-branch. NEVER use --admin under any circumstances.\n` +
  `6. Remove all status:* labels from the PR and issue #${issue}; verify the issue auto-closed, close it manually if not.\n` +
  `7. Cleanup: git checkout main; remove any worktree still on ${dev.branch} (git worktree list / remove --force); git worktree prune; git branch -D ${dev.branch}; git pull --ff-only origin main.\n` +
  `8. Milestone check: if the issue's milestone now has zero open issues, note in your summary that the audit skill should run.`,
  { label: `merge:#${dev.pr_number}`, effort: 'medium', schema: MERGE_OUT },
)
return {
  issue: Number(issue),
  tier,
  pr: dev.pr_number,
  merged: merge?.merged ?? false,
  escalate: merge?.escalate_reason ?? null,
}
