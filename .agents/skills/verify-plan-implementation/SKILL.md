---
name: verify-plan-implementation
description: >
  Verify that an implementation plan was actually carried out — in code and in the running UI — and fix any defects the verification exposes. Use this skill when: (1) asked to confirm/verify/validate an implemented plan file (e.g. .ai/plans/**/plan-*.md review-output plans), (2) asked to verify a spec-driven-development plan directory (e.g. .ai/plans/credit-adjustment-system/ with specs.md / implementation.md / trackable-tasks.md / prototype/), (3) a task says "confirm the implemented plan" or "check the plan against the app" with screenshots, (4) post-implementation acceptance checking of UI refactors.
license: MIT
metadata:
  author: siraj
  version: "1.0.0"
allowed-tools: Read Write Edit Glob Grep Bash
---

# Verify Plan Implementation

Confirm an implemented plan against the codebase AND the running app, then fix what the verification uncovers. Produces three artifacts: a per-task implementation status, a screenshot evidence set, and a fix list for defects found along the way.

## Plan Input Shapes

Two plan layouts exist in `.ai/plans/`; detect which you have first:

1. **Review/routing plans** — a single `plan-<domain>-<date>.md` with per-task items referencing file paths and line ranges. Extract the task list and touched-file set directly from the document.
2. **Spec-driven-development plans** — a directory with `specs.md`, `implementation.md`, `trackable-tasks.md`, optional `prototype/` screenshots and `outcome/`. Read `trackable-tasks.md` for the authoritative task list, `implementation.md` for architecture intent, and `prototype/` for visual targets (inspect prototype images ONLY one at a time, only when implementing or verifying that specific UI surface — never batch-load them).

## Process

- [ ] 1. Plan intake: read the plan; list every task with its expected file paths and expected primitives/behavior. Note tasks the plan itself removed or retracted — verify absence, not presence.
- [ ] 2. Code audit: confirm each task with targeted checks — file existence/absence, imports of expected primitives, helper calls, i18n hooks, permission gates. Use Grep on exact symbol names from the plan. Mark each task ✅/❌ with a `file:line` citation.
- [ ] 3. Screenshot capture (UI-affecting plans): start `bun run dev` if down, create a named browser session, authenticate, and capture every plan-touched page on BOTH tiers (desktop 1440×900 and mobile 390×844) into `scratch/screenshots/<plan>-verify-{desktop,mobile}-<page>.png`.
- [ ] 4. Visual analysis: dispatch ONE isolated visual-inspector subagent per screenshot. Cross-check structural claims in the live DOM before believing either side (see "Grounding Rules").
- [ ] 5. Defect triage: separate real defects from false positives — re-capture after `networkidle`, check console errors, exclude Next.js dev overlays, and recognize intentional horizontal-scroll strips. For each real defect, check git history before blaming the plan implementation.
- [ ] 6. Fix defects: minimal edits following project conventions. Check whether tests assert the old behavior before changing it.
- [ ] 7. Per-file verification: run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on every edited/new file; exit 0 is mandatory.
- [ ] 8. Re-verification: re-screenshot every fixed page and re-inspect. A fix is not done until a fresh inspection passes. If a fix targets overlap/positioning, scroll the actual scroll container and re-measure — an unscrolled re-capture proves nothing.
- [ ] 9. Report: plan task status, defects found & fixed with `file:line`, items verified as non-defects, screenshot paths. Do not edit the plan file unless the user asks.

## Browser Automation Commands

```bash
# Session + auth (never type credentials — AI layer redacts emails)
export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix verify)"
bun run scripts/browser-login.ts --inject

# Viewport — it is `set viewport`, NOT `resize` (resize does not exist)
agent-browser set viewport 1440 900   # desktop tier
agent-browser set viewport 390 844    # mobile tier
agent-browser eval "innerWidth"       # always confirm the switch took effect

# Capture loop
agent-browser open http://localhost:3000/<route>
agent-browser wait --load networkidle
agent-browser screenshot scratch/screenshots/<name>.png
```

## Grounding Rules

- **Screenshots can lie by omission.** A spinner captured during lazy-load is not a blank page — always re-capture after `wait --load networkidle`, then probe the DOM with `agent-browser eval` before declaring a defect.
- **Prove tiers structurally, not visually.** To confirm which tier view mounted, count `document.querySelectorAll('[role="grid"]')` vs card wrappers, or walk React fiber names up from a text node (`__reactFiber$` key) — e.g. `LinkComponent > QuotaListItemMobile > ... > ResponsiveViewSwitch`. This is how a desktop↔mobile `createLazyView` argument-order inversion gets caught: the screenshot only hints at it.
- **Inspector subagents return text only.** One image per subagent; the main context never loads media (avoids vision-encoder stream failures). Give each inspector the expected outcome as its verdict criterion and require a final `PASS` / `FAIL:` line.
- **Exclude environmental noise.** Next.js dev-tools button ("N" badge) and "Compiling…" toasts overlapping content are dev-only artifacts. Metric/card rows clipped at 390px may be intentional horizontal snap-scroll — check the component's design before flagging.
- **Git-blame before attributing.** A defect next to the plan's changes may predate them; `git log -p -- <file>` tells you which side introduced it. Report provenance honestly — the plan's implementation and pre-existing bugs are different categories.

## Defect Fix Rules

- Minimal edits; follow the exact conventions of the file being touched (barrel imports, theme callbacks, i18n via `shared/locale`, tier isolation).
- Extract shared helpers only when ≥2 call sites already duplicate the logic; put them where the sibling helpers live.
- Grep test suites for the old behavior string before changing output formats.
- After fixes, re-run the whole screenshot+inspect loop on the affected pages only.

## Reference Files

- [Inspector Prompt Template](references/inspector-prompt.md) — the visual-inspector subagent prompt used for per-image analysis
- [Troubleshooting](references/troubleshooting.md) — session gotchas: auth injection failing, viewport command, stale element refs, empty captures

## Ground Rules

- ALWAYS authenticate via `bun run scripts/browser-login.ts --inject`; NEVER type credentials into the login form.
- ALWAYS store screenshots under `scratch/screenshots/`.
- ALWAYS confirm viewport switches with `eval "innerWidth"` before capturing.
- ALWAYS re-run `sub-loop.ts --lifecycle codescene` on every edited file and re-inspect fixed pages.
- NEVER batch-load screenshots into the main context; subagents inspect one image each.
- NEVER modify the plan file unless the user asks — it is the subject, not the workspace.
- NEVER report a defect without at least one DOM or console cross-check.
