# Task 38 Outcome — Create Canonical Reference Doc and Update AGENTS.md

## Summary

Created `docs/frontend/meeting-integrations-ui.md` — a comprehensive canonical reference consolidating all UI patterns from the 44-task auto-meeting-url UI implementation. Updated 4 AGENTS.md/instruction files to reference the new doc.

## Files Created

| # | File | Purpose |
|---|------|---------|
| 1 | `docs/frontend/meeting-integrations-ui.md` | Canonical reference doc: 13 sections covering component patterns, OAuth callback, reconnect-all, status badges, clipboard, i18n, mobile-desktop, Zod factory, animations, permissions, APIs, lint workarounds, accessibility |
| 2 | `.ai/plans/auto-meeting-url/ui/outcome/38-knowledge-propagation-outcome.md` | This outcome file |

## Files Modified

| # | File | Change |
|---|------|--------|
| 1 | `frontend/AGENTS.md` | Added reference to `docs/frontend/meeting-integrations-ui.md` in Dashboard UI Patterns section |
| 2 | `frontend/views/AGENTS.md` | Added reference in Meeting Config Auto-Generation section (covers admin + profile meeting configs) |
| 3 | `.agents/instructions/frontend.instructions.md` | Added reference in Meeting Integration Admin UI section + new convention: `component="output"` for aria-live, recursive helper for sequential await, typed `execCopy` binding, `prefers-reduced-motion` with `timeout={0}` |
| 4 | `AGENTS.md` (root) | Added `docs/frontend/meeting-integrations-ui.md` to Important References under Frontend |
| 5 | `.ai/plans/auto-meeting-url/ui/tasks.md` | Updated task 38 checkbox from `[ ]` to `[x]` |

## Doc Contents (13 sections)

1. **Component Patterns** — MetricCardGrid (health headers), DesktopAppDataGrid/MobileCardList (connected accounts), BaseDeleteDialog, EntityFormDialogActions, ResponsiveViewSwitch/createLazyView
2. **OAuth Callback Handling** — URL param detection + Apollo refetch + URL cleanup + window focus fallback + toast via `useNotifications`
3. **Reconnect All Batch Action** — Recursive `processNext` helper (avoids `no-await-in-loop`), progress tracking, sequential OAuth semantics
4. **Meeting URL Status Badge** — 4 states (pending/generated/failed/expired), `component="output"` for aria-live, `text.secondary` for WCAG contrast
5. **Copy URL Clipboard** — In-ViewModel `copyUrl` with `execCopy` typed binding, `useCopyFeedback` hook, `CopyMeetingUrlButton` primitive
6. **i18n Namespace Structure** — 5 namespaces with Translation enum keys, Rule 7 (labels via props), EN/AR parity
7. **Mobile-Desktop Responsive** — Three-tier architecture, shared scaffold, touch targets ≥48dp, horizontal scroll prevention, `useMediaQuery` in shared components
8. **Zod Schema Factory** — `createMeetingConfigFormSchema(labels)` pattern, pre-resolved label injection
9. **Animation Patterns** — `prefers-reduced-motion` detection, MUI Fade/Slide with `timeout={0}`, `@keyframes` conditional
10. **Permission-Gated Cross-Link** — `<RequirePermission>` with OR logic, `AppPermission` enum, ViewModel `canViewSettings`
11. **Key APIs Summary** — Import paths for all 11 key APIs
12. **Lint Rule Workarounds** — 6 patterns: no-await-in-loop, deprecation, prefer-tag-over-role, react-refresh, no-map-spread, no-unnecessary-type-arguments
13. **Accessibility Checklist** — 11 items: keyboard nav, ARIA labels, aria-live, aria-busy, explicit IDs, contrast, colors, translation parity, reduced motion, RTL, touch targets

## Design Decisions

### Reference over duplication
The doc cross-references existing docs (`docs/services/meeting-providers.md`, `docs/frontend/ui-shared-scaffold-pattern.md`, `docs/frontend/duplication-elimination-patterns.md`, `frontend/COMPONENT_PATTERNS.md`) rather than duplicating their content. Only meeting-specific patterns not covered elsewhere are fully documented here.

### Code examples use `@/` path aliases
All code examples use the `@/` path alias (NOT relative imports) per project convention. No `console.*` usage — all examples use `logger` from `@/frontend/common/utils/logger`.

### Instruction file conventions added
New conventions added to `frontend.instructions.md` that weren't there before:
- `component="output"` for aria-live regions (oxlint `prefer-tag-over-role`)
- Recursive helper pattern for sequential `await` (oxlint `no-await-in-loop`)
- Typed `execCopy` binding for clipboard fallback (sonarjs `deprecation`)
- `prefers-reduced-motion` with MUI `timeout={0}` pattern

## Verification Results

All modified files passed `sub-loop.ts --lifecycle lint`:

```
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
```

Files verified:
- `docs/frontend/meeting-integrations-ui.md`
- `frontend/AGENTS.md`
- `frontend/views/AGENTS.md`
- `.agents/instructions/frontend.instructions.md`
- `AGENTS.md` (root)

## Cross-File Dependencies

None. All changes are documentation-only — no code changes that would affect runtime behavior.

## Carry-Forward Knowledge

- The canonical doc (`docs/frontend/meeting-integrations-ui.md`) should be the first reference for any future meeting-related UI work.
- The lint rule workarounds table (§12) consolidates patterns that were discovered across multiple tasks — future developers should check this table before fighting a lint rule.
- The Key APIs table (§11) provides the authoritative import paths — always verify these paths before importing, as barrel re-exports may change.
