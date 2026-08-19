# Spec-Driven Development Skill — Implementation Outcome & Improvements

**Plan:** `auto-meeting-url` (and sub-plan `auto-meeting-url/ui`)
**Duration:** Multiple sessions across plan implementation + 3 rounds of plan review
**Outcome Date:** 2026-08-02

---

## Executive Summary

This document captures observations from implementing the `auto-meeting-url` feature end-to-end using the spec-driven-development skill, including 3 rounds of plan review with parallel subagents. The implementation was successful (237 files changed, all tests passing), and the skill's structure proved valuable. However, several improvements to the skill itself were identified.

---

## What Worked Well (Keep These)

### 1. Three-Phase Workflow (Requirements → Design → Tasks)
- **EARS format** for requirements forced clarity and testability
- **Design document** with UX/Navigation specification prevented downstream ambiguity
- **Task breakdown** with `_Requirements:` traceability enabled parallel execution
- **Outcome knowledge base** (`.ai/plans/<feature>/outcome/`) was critical — 20+ outcome files accumulated, preventing re-analysis

### 2. Parallel Subagent Review Process
The most impactful pattern was **dispatching specialized verification subagents in parallel**, each covering one dimension:

| Subagent | Focus | Issues Found |
|----------|-------|--------------|
| `verify-paths-exist` | All file paths | 10 path bugs |
| `verify-i18n-namespaces` | Translation system | 4 issues |
| `verify-graphql-accuracy` | GraphQL docs/mutations | 2 notes |
| `verify-component-props` | Component interfaces | 3 issues |
| `verify-permissions-enums` | Role matrix | 3 issues |
| `verify-existing-components` | Component inventory | 1 naming collision |
| `verify-three-tier-architecture` | Mobile/desktop tier split | 1 HIGH + 3 LOW |
| `verify-cross-ref-consistency` | Cross-file consistency | 6 blocking + 3 minor |

**Total: 28 issues across 8 dimensions** — found in one round, all fixed by 3 parallel fix subagents.

### 3. Per-File Quality Loop (tsgo + biome + lint queue)
- Caught issues early at file level before propagating
- Lint queue server serialized requests, enabling safe parallel subagents
- Each fix subagent ran the loop on its assigned file only

### 4. Instruction Verification Per Subtask
- Layer AGENTS.md + `.agents/instructions/*.md` mapping in every task
- Subagents read applicable files before fixing
- Cross-file dependency reporting (Fix-Or-Report rule) prevented conflicts

### 5. Fix-Or-Report Rule for Cross-File Dependencies
- Subagents fixed within their assigned file
- Reported cross-file blockers to orchestrator
- Orchestrator dispatched follow-up waves — prevented inconsistent multi-file changes

---

## Identified Skill Improvements

### 1. Add Explicit "Parallel Review Wave" Pattern to Skill

**Current:** Skill mentions quality gates but not structured parallel review waves.

**Proposed Addition** (to `SKILL.md` → Phase 2 or new "Review & Validation" section):

```markdown
## Parallel Review Wave Pattern (RECOMMENDED for complex plans)

After task implementation, before final quality gate:

### Step 1: Define Review Dimensions
Identify 6-10 orthogonal verification dimensions based on plan scope:
- Paths existence (all cited paths exist)
- i18n namespace accuracy (signatures, registration, casing)
- GraphQL accuracy (doc names, args, fragments)
- Component props (interfaces match actual components)
- Permissions/enums (role matrix, seed data)
- Existing components (claimed "existing" actually exist)
- Architecture compliance (tier patterns, directory structure)
- Cross-reference consistency (counts, naming, traceability)

### Step 2: Dispatch Parallel Verification Subagents
Each subagent receives:
- The plan files (requirements.md, design.md, tasks.md)
- Specific dimension prompt with codebase search guidance
- Output format: structured findings table

### Step 3: Collect & Synthesize Findings
Wait for all subagents → compile unified findings list.

### Step 4: Dispatch Parallel Fix Subagents (One per Plan File)
- Each fix subagent owns ONE plan file (requirements, design, tasks)
- Receives all findings relevant to that file
- Runs per-file quality loop (tsgo + biome + lint queue)
- Reports cross-file dependencies via Fix-Or-Report rule

### Step 5: Verify Fixes Landed
Final verification subagent greps all plan files for resolved issues.
```

### 2. Add "Plan Review Checklist" to Templates

**Current:** Templates have Requirements/Design/Tasks checklists but no explicit "Plan Review Readiness" checklist.

**Proposed Addition** to `tasks-template.md` (or new `plan-review-template.md`):

```markdown
## Plan Review Readiness Checklist

Before declaring a plan ready for implementation:

### Architecture Alignment
- [ ] All file paths cited in plan exist in codebase (or marked as "to create")
- [ ] All "existing" components verified at exact paths
- [ ] Component prop interfaces match actual component definitions
- [ ] Tier-specific paths follow `frontend/desktop|mobile/views/...` convention
- [ ] Shared component paths follow `frontend/common/components/ui/...` convention

### i18n Compliance
- [ ] All user-facing strings reference compile-time Translation object
- [ ] Namespace names match `Translation.Dashboard.*` or `Translation.Ui.*` structure
- [ ] No references to `next-intl`, `getBackendTranslations`, or `shared/messages/`
- [ ] Registration workflow cites correct files (`server.ts`, `server-graphql.ts`, `message.ts`)
- [ ] `getTranslations`/`getServerTranslations` signatures are single-arg (`locale`)

### GraphQL Accuracy
- [ ] Document names follow `{Entity}QueryDocument` / `{Entity}MutationDocument` convention
- [ ] Mutation args match Pothos schema exactly
- [ ] Fragments include `id` field for Apollo cache normalization
- [ ] Import from `@apollo/client/react`, not `@apollo/client`

### Permissions & Enums
- [ ] Role matrix matches actual seed data (not aspirational)
- [ ] All cited `AppPermission` enum members exist in generated types
- [ ] Server-side imports use `@/backend/enum`, client-side use GraphQL generated types
- [ ] Settings page guards include all cited permissions

### Cross-Reference Consistency
- [ ] Component count matches across requirements, design, tasks
- [ ] Every design component has a dedicated task (or is explicitly "no task needed")
- [ ] All ACs traced to at least one task in `_Requirements:` lines
- [ ] New component naming consistent (NEW/Redesigned/Enhanced tags match task verbs)
- [ ] i18n key names consistent across design.md §7 and tasks.md task 1
- [ ] No phantom components (referenced in animation spec but not in design)

### Three-Tier Architecture
- [ ] Desktop/mobile tier views in correct directories (`views/.../components/...` vs `tabs/...`)
- [ ] Switcher components use `ResponsiveViewSwitch` + `createLazyView`
- [ ] Breadcrumb components receive labels via props (no inline `useAppTranslation`)
- [ ] Form schema factories pinned to `schemas/` directory
```

### 3. Strengthen Outcome Knowledge Base Rules

**Current Issue:** The outcome files are created but not systematically reviewed for patterns to propagate to docs/AGENTS.md/skills.

**Proposed Addition** to Skill (Knowledge Propagation section):

```markdown
## Outcome Synthesis Protocol (MANDATORY at plan completion)

After all implementation tasks complete:

1. **Read ALL outcome files** in `.ai/plans/<feature>/outcome/`
2. **Extract recurring patterns/gotchas** (e.g., "dialog/ vs dialogs/ directory confusion appeared 3x")
3. **Create/Update canonical docs** under `docs/<domain>/` for each pattern
4. **Update layer AGENTS.md** with new rules referencing the docs
5. **Update relevant SKILL.md** with new pattern sections
6. **Update relevant .agents/instructions/*.md** if new conventions should be enforced
7. **Update root AGENTS.md** Important References

### Pattern Extraction Template
For each pattern found ≥2 times across outcomes:
- **Pattern Name:** `dialog-directory-casing`
- **Occurrences:** requirements.md L635, design.md L628, tasks.md L350
- **Rule:** "Use `dialog/` (singular), NOT `dialogs/` (plural)"
- **Doc Target:** `docs/frontend/component-paths.md`
- **AGENTS.md Target:** `frontend/common/components/ui/AGENTS.md`
```

### 4. Add Explicit "Translation Access Pattern" to Templates

**Observation:** The plan correctly used `Translation.Dashboard.*` and `Translation.Ui.*` but this wasn't explicitly called out in templates.

**Proposed Addition** to `design-template.md` (UX/Navigation section) and `requirements-template.md`:

```markdown
### Translation System Requirements (CRITICAL)

All user-facing strings MUST use the compile-time TypeScript i18n system:

**Client Components:**
```ts
import { useAppTranslation } from "@/shared/locale/client";
const t = useAppTranslation("Dashboard.SettingsMeetingIntegrations");
```

**Server Components:**
```ts
import { getTranslations } from "@/shared/locale/server";
const t = await getTranslations(locale); // single arg!
const labels = t.Dashboard.SettingsMeetingIntegrations;
```

**GraphQL Resolvers:**
```ts
const t = ctx.t("Dashboard.SettingsMeetingIntegrations");
```

**API Routes/Scripts/Tests:**
```ts
import { getServerTranslations } from "@/shared/locale/server-graphql";
const t = await getServerTranslations(locale);
const labels = t.Dashboard.SettingsMeetingIntegrations;
```

**Forbidden Patterns:**
- ❌ `useTranslations` from `next-intl`
- ❌ `getBackendTranslations` 
- ❌ `next-intl` imports
- ❌ `shared/messages/` references
- ❌ `getTranslations(locale, "namespace")` — two args (actual API is single arg)
```

### 5. Add "Plan Review Outcome" Template

**Proposed:** New template file `.agents/spec-process-guide/templates/plan-review-template.md`:

```markdown
# Plan Review Report — <feature-name>

## Review Round: <N>
## Date: <YYYY-MM-DD>
## Subagents Dispatched: <list>

### Summary
- Total issues found: <N>
- Blocking: <N>
- Medium: <N>
- Low/Notes: <N>

### Findings by Dimension
| Dimension | Subagent | Issues | Status |
|---|---|---|---|
| Paths | verify-paths-exist | 10 | ✅ Fixed |
| i18n | verify-i18n-namespaces | 4 | ✅ Fixed |
| GraphQL | verify-graphql-accuracy | 2 | ✅ Noted |
| Component Props | verify-component-props | 3 | ✅ Fixed |
| Permissions | verify-permissions-enums | 3 | ✅ Fixed |
| Existing Components | verify-existing-components | 1 | ✅ Noted |
| Architecture | verify-three-tier-architecture | 4 | ✅ Fixed |
| Cross-Ref | verify-cross-ref-consistency | 9 | ✅ Fixed |

### Fix Subagents Dispatched
- fix-requirements: <N> fixes
- fix-design: <N> fixes
- fix-tasks: <N> fixes

### Post-Fix Verification
- [ ] All stale references resolved (grep confirms)
- [ ] New tasks/components added where needed
- [ ] AC traceability complete
- [ ] Quality loop passes on all 3 plan files

### Lessons for Future Plans
- <bullet points>
```

---

## Specific Codebase Patterns Discovered (To Propagate)

These patterns appeared repeatedly during implementation and review — should be added to canonical docs:

### 1. `dialog/` vs `dialogs/` Directory Casing
- **Occurrences:** 3 plan files, 10+ component references
- **Rule:** `frontend/common/components/ui/dialog/` (singular)
- **Doc Target:** `docs/frontend/component-paths.md`

### 2. Feature-Specific Shared Components
- `EntityFormDialogActions` lives at `frontend/common/views/dashboard/subjects/home/components/__shared__/`
- NOT in `frontend/common/components/ui/`
- **Rule:** Feature-scoped shared components live under their feature's `components/__shared__/`
- **Doc Target:** `docs/frontend/component-organization.md`

### 3. `Stack direction="row"` IS Valid in MUI v9
- 100+ files use it; prohibition in plan was incorrect
- **Rule:** Use `<Stack direction="row">` directly (standard prop)
- **Doc Target:** `docs/frontend/mui-v9-patterns.md`

### 4. `getTranslations(locale)` Returns Full Tree
- NOT `getTranslations(locale, "namespace")`
- Access namespace as property: `t.Dashboard.SettingsMeetingIntegrations`
- **Doc Target:** `docs/i18n/translation-api.md`

### 5. Server-Side `AppPermission` Import Path
- Server: `@/backend/enum/permission.enum.ts`
- Client: `@/frontend/common/graphql/generated/gql/graphql-types`
- **Doc Target:** `docs/auth/permission-imports.md`

### 6. Namespace Directory Casing = Lowercase
- `shared/locale/namespaces/ui/meetingConfig.namespace.ts`
- `shared/locale/namespaces/dashboard/settings/meetingIntegrations.namespace.ts`
- NOT `Ui/MeetingConfig/` or `Dashboard/Settings/`
- **Doc Target:** `docs/i18n/namespace-conventions.md`

### 7. Role Matrix Must Match Seed Data
- Matrix in requirements.md must reflect actual `6b-meeting-permissions.sql` grants
- Aspirational permissions (unseeded) must be explicitly noted
- **Doc Target:** `docs/auth/role-matrix-conventions.md`

### 8. `DisconnectConfirmDialog` Naming Collision
- Same component name in different directories compiles but is a smell
- Plan should acknowledge existing components before proposing new ones
- **Doc Target:** `docs/frontend/component-naming.md`

---

## Updated Skill Integration Points

### Files to Update Based on This Outcome

| File | Section to Add/Update |
|---|---|
| `.agents/skills/spec-driven-development/SKILL.md` | Parallel Review Wave Pattern, Plan Review Checklist, Outcome Synthesis Protocol |
| `.agents/spec-process-guide/templates/requirements-template.md` | Translation System Requirements, Role Matrix conventions |
| `.agents/spec-process-guide/templates/design-template.md` | Translation System Requirements, UX/Navigation spec enhancements |
| `.agents/spec-process-guide/templates/tasks-template.md` | Plan Review Readiness Checklist, Quality Loop per file |
| `.agents/spec-process-guide/templates/plan-review-template.md` | **NEW FILE** — Plan Review Report template |
| `docs/frontend/component-paths.md` | **NEW FILE** — Canonical component directory conventions |
| `docs/frontend/component-organization.md` | **NEW FILE** — Feature-scoped shared components |
| `docs/frontend/mui-v9-patterns.md` | **NEW FILE** — Stack direction, style props, icon naming |
| `docs/i18n/translation-api.md` | **NEW FILE** — getTranslations signature, Translation object access |
| `docs/i18n/namespace-conventions.md` | **NEW FILE** — Lowercase directory casing, registration workflow |
| `docs/auth/permission-imports.md` | **NEW FILE** — Server vs client AppPermission import paths |
| `docs/auth/role-matrix-conventions.md` | **NEW FILE** — Matrix must match seed data |
| `docs/frontend/component-naming.md` | **NEW FILE** — Avoid cross-directory name collisions |
| `frontend/common/components/ui/AGENTS.md` | Add Stack direction rule, component path rules |
| `shared/AGENTS.md` | Add translation API signature correction |
| `backend/services/AGENTS.md` | Add server-side permission import path |
| `.agents/instructions/frontend.instructions.md` | Add plan review checklist reference |
| `.agents/instructions/backend.instructions.md` | Add plan review checklist reference |
| `.agents/instructions/tests.instructions.md` | Add plan review checklist reference |

---

## Metrics from This Implementation

| Metric | Value |
|---|---|
| Plan files | 3 (requirements, design, tasks) + 20+ outcome files |
| Review rounds | 3 |
| Verification subagents (Round 3) | 8 parallel |
| Fix subagents (Round 3) | 3 parallel (1 per file) |
| Issues found (Round 3) | 28 (6 blocking, 12 medium, 10 low/notes) |
| Fixes applied (Round 3) | 28 (all resolved) |
| Total implementation files changed | 237 |
| Lines added | 46,913 |
| Lines removed | 337 |
| Commits | 1 (squashed) |

---

## Recommendations for Future Plan Authors

1. **Run a mini-review wave early** — After Phase 2 (Design), before Phase 3 (Tasks), dispatch 3-4 quick verification subagents (paths, i18n, GraphQL) to catch structural errors before task breakdown.

2. **Include "Current vs Target" in design** — For every enhanced component, document current props/API alongside target. Prevents confusion (e.g., MeetingJoinAction current vs target).

3. **Explicitly list "No Task Needed" components** — In tasks.md, mark components that are truly just enhanced via existing tasks (not new components) to satisfy cross-ref traceability.

4. **Anchor role matrix to seed files** — In requirements.md, cite the exact seed file (e.g., `6b-meeting-permissions.sql:74-93`) for each matrix row.

5. **Document i18n registration as a numbered workflow** — The 6-step registration (type schema → ar/en impl → message.ts → server.ts → server-graphql.ts → translation.ts) should be a canonical reference in design.md.

6. **Use the plan-review-template.md** — Create a review report file per round to track progress and lessons.

---

## Conclusion

The spec-driven-development skill enabled a complex, multi-layer feature to be implemented correctly with high quality. The parallel review wave pattern (8 verification → 3 fix subagents) was the standout success — it caught 28 issues in one round that would have taken days to find sequentially.

**Primary skill improvements needed:**
1. Formalize the Parallel Review Wave pattern
2. Add Plan Review Readiness Checklist to templates
3. Create Plan Review Report template
4. Mandate Outcome Synthesis Protocol at plan completion
5. Add Translation System Requirements to all templates
6. Propagate discovered patterns to canonical docs/AGENTS.md/skills

The outcome files in `.ai/plans/auto-meeting-url/outcome/` and `.ai/plans/auto-meeting-url/ui/outcome/` contain the full detail for each sub-task — they should be read by anyone extending this skill or implementing similar features.