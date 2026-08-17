# Task 20: Knowledge Propagation & Documentation — Outcome

## Summary

Synthesized learnings from all 19 prior task outcome files and propagated knowledge to permanent project artifacts. Created a canonical reference doc covering all WhatsApp UI patterns, rules, and gotchas. Updated 6 existing project files (AGENTS.md files, instruction files, root AGENTS.md) with references to the new doc and relevant new patterns.

## Files Created

1. **`docs/frontend/whatsapp-ui-patterns.md`** — Comprehensive canonical reference covering:
   - Overview (4-tier architecture diagram)
   - Architecture Patterns: URL-synced tab navigation, ViewModel composable hooks (10 sub-hooks), per-row loading state, dialog state pattern, snackbar pattern, StatusBadge adoption, form validation (5 validators), i18n label helper pattern (Record-based), mobile/desktop parity (SharedScaffold, MobileCardList, fullScreen dialogs), route boundaries, animation patterns (keyframes in sx, MUI Fade/Grow, reduced-motion guards), accessibility patterns (aria-invalid, aria-busy with Box component="output", PermissionDeniedFallback), testing patterns (consumer-component, MockLink, renderWithWrapper, type guards for mock args)
   - Gotchas: Missing backend resolvers (whatsappTemplates, whatsappOptInAudit), missing enum values (TIER_250K, TIER_1M, qualityOrange), permission enum names (WhatsappConfigManage not WHATSAPP_MANAGE), template snapshot fragment fields (body/buttons NOT included), linting gotchas (no-unsafe-enum-comparison, prefer-tag-over-role, no-unsafe-type-assertion, no-globals-shadowing, CodeScene Large Method), testing gotchas (renderHook unavailable, MockLink variable matching, RefObject vs MutableRefObject)

2. **`.ai/plans/whatsapp/ui-spec/outcome/20-knowledge-propagation-outcome.md`** — This outcome file.

## Files Modified

3. **`frontend/common/views/AGENTS.md`** — Added "WhatsApp Settings Patterns" section with bullet points covering: canonical doc reference, ViewModel composable hooks, URL-synced tabs, dialog state, per-row loading, i18n label helpers, missing backend resolvers.

4. **`frontend/views/AGENTS.md`** — Added "WhatsApp Settings UI" section with bullet points covering: canonical doc reference, mobile/desktop parity (SharedScaffold, MobileCardList, fullScreen dialogs, per-card action menu).

5. **`frontend/AGENTS.md`** — Added "WhatsApp UI Patterns" section with subsections: New MUI v9 Patterns (@keyframes in sx, component="output", Stack props), New React 19 Patterns (RefObject, renderHook alternative), New Accessibility Patterns (aria-invalid, PermissionDeniedFallback, reduced motion), Enum Safety (no-unsafe-enum-comparison, no-unsafe-type-assertion).

6. **`.agents/instructions/frontend.instructions.md`** — Added "WhatsApp UI Patterns" section with 17 bullet points covering all key patterns and gotchas (ViewModel hooks, URL-synced tabs, dialog state, per-row loading, i18n helpers, @keyframes, component="output", aria-invalid, reduced motion, RefObject, renderHook, missing resolvers, missing enums, permission names).

7. **`.agents/instructions/mobile-desktop.instructions.md`** — Added WhatsApp-specific mobile/desktop patterns reference (SharedScaffold with render-prop slots, MobileCardList with expandable Collapse, fullScreen dialogs, per-card action menu, shared animation constants).

8. **`AGENTS.md` (root)** — Added `docs/frontend/whatsapp-ui-patterns.md` to the "Important References" section.

## Files Skipped (Do Not Exist)

- **`.agents/skills/frontend-patterns/SKILL.md`** — Does NOT exist. Step 4 skipped as noted in task instructions.

## Key Patterns and Gotchas Consolidated

### Patterns (14 total)
1. URL-synced tab navigation with `useWhatsappTab()` hook
2. ViewModel composable hooks architecture (10 sub-hooks + builder)
3. Per-row loading state pattern (creating, deletingId, syncingId, updatingId)
4. Dialog state pattern ({ type, data, open })
5. Snackbar pattern ({ message, severity })
6. StatusBadge adoption for enum-based statuses (syncStatus category)
7. Form validation pattern (5 pure validators returning string | null)
8. i18n label helper pattern (Record-based lookups, not switch)
9. Mobile/desktop parity pattern (SharedScaffold, MobileCardList, fullScreen dialogs)
10. Route boundaries pattern (loading.tsx, error.tsx with WhatsAppError naming)
11. Animation patterns (keyframes in sx, MUI Fade/Grow, reduced-motion guards)
12. Accessibility patterns (aria-invalid, aria-busy with Box component="output", PermissionDeniedFallback)
13. Testing patterns (consumer-component for hooks, MockLink with configuredMock, renderWithWrapper)
14. Type guard pattern for mock call args (avoiding unsafe type assertions)

### Gotchas (12 total)
1. Missing backend resolvers: whatsappTemplates and whatsappOptInAudit queries don't exist
2. Missing enum values: TIER_250K, TIER_1M, qualityOrange DON'T EXIST
3. Permission enum names differ: WhatsappConfigManage (not WHATSAPP_MANAGE)
4. body/buttons fields NOT in template snapshot fragment
5. oxlint no-unsafe-enum-comparison — use Record-based lookups
6. oxlint jsx-a11y(prefer-tag-over-role) — use Box component="output"
7. oxlint no-unsafe-type-assertion — use type guards
8. sonarjs no-globals-shadowing — name error boundary WhatsAppError
9. CodeScene Large Method — extract hooks from render methods early
10. renderHook unavailable in bun:test — use consumer-component pattern
11. MockLink variable matching must be exact (including nulls)
12. RefObject vs MutableRefObject — React 19 deprecates MutableRefObject

## Verification Results

- **Biome check**: ✅ Passed (0 fixes applied, 5366 files checked)
- **tsgo**: ✅ Passed (0 errors)
- **lint (full-repo ESLint)**: ✅ Passed (0 errors, 0 warnings)
- **Per-file sub-loop**: Markdown files (docs, AGENTS.md, instructions) are not TypeScript — sub-loop oxlint reports "No files found to lint" which is expected. tsgo and biome pass cleanly on all modified files.

## Checkbox Update

Task 20 checkbox in `trackable-tasks.md` updated from `[ ]` to `[x]`.
