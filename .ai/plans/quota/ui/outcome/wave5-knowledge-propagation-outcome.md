# Wave 5 — Task Group 18: Knowledge Propagation & Documentation — Outcome

## Summary

Created the canonical Quota UI patterns reference document consolidating recurring patterns from all prior waves (0–4). Updated three AGENTS.md files with references to the new doc. All 16 required pattern topics are documented with code examples, rules, and cross-references.

## Task 18.1: Create Canonical Reference Doc

### Files Created
- `docs/frontend/quota-ui-patterns.md` (377 lines, 16 sections)

### Process
1. Read all 17 outcome files in `.ai/plans/quota/ui/outcome/` (phase0, wave0, wave1×4, wave2×4, wave3×3, wave4×3)
2. Extracted patterns, rules, and gotchas that appeared 2+ times across outcome files
3. Organized into 16 numbered sections with code examples, key rules, and cross-references

### Documented Patterns (16 sections)
1. **Tier Isolation Pattern** — Containers as switchers, `createLazyView` + `ResponsiveViewSwitch`, ViewModel null handling
2. **RHF + zodResolver 3-Generic Pattern** — `useForm<QuotaFormInput, undefined, QuotaFormData>` with `z.coerce.number()`
3. **Backend vs Frontend GraphQL Input Types** — `QuotaSubmitInput` (backend) vs GraphQL mutation input types, field mapping
4. **Cache Update Pattern** — `cache.updateQuery` for paginated lists (not `cache.modify`), `readQuery`/`writeQuery` flow
5. **StatusBadge Quota Category** — Adding new status badge categories, `QuotaStatusCategory` type
6. **MetricCard Animated Prop** — Enabling count-up animations via `animated` prop
7. **Reduced Motion CSS in `sx`** — `@media (prefers-reduced-motion: reduce)` in sx props (NOT `useMediaQuery`)
8. **Storybook Error Story Naming** — Rename `Error` story to `ErrorState` to avoid global `Error` shadowing
9. **Component Test Tier-View Mocking** — Import tier views directly, mock ViewModel hooks, bypass lazy loading
10. **i18n CLDR Plural Patterns** — Arabic plural rules for count-based strings (zero/one/two/few/many/other)
11. **CodeScene 150-Line Limit** — Keep tier files under 150 lines by extracting to `components/` subdirectories
12. **Permission Gating** — `QuotaFormAccessProvider` pattern for field-level RBAC
13. **Import Deduplication** — Barrel import consolidation, avoiding duplicate import statements
14. **Enum Safety Patterns** — `Record<string, string>` lookup tables, type guards instead of `as` casts
15. **Typography Variants** — Theme variants (`headlineLg`, `titleLg`, `labelUppercase`, `bodyMd`) instead of hardcoded font sx
16. **Reusable Component APIs** — Shared component prop interfaces, `SharedOptions` pattern

### Quality Loop Result
- **tsgo**: ✅ passed (no errors)
- **oxlint**: ⚠️ "No files found to lint" — `.md` files are in `oxlint.config.mts` `ignorePatterns`. This is a known limitation of sub-loop when run on documentation files. Same behavior confirmed on existing `docs/frontend/whatsapp-ui-patterns.md`.
- **biome**: ⚠️ Same — `.md` files are ignored by biome config.
- These are NOT code quality issues — the linters are explicitly configured to skip markdown files.

## Task 18.2: Update Layer AGENTS.md Files

### Files Modified

1. **`AGENTS.md`** (root) — Added `docs/frontend/quota-ui-patterns.md` to "Important References" section (line 434, after `whatsapp-ui-patterns.md`)
2. **`frontend/AGENTS.md`** — Added "Quota UI Patterns" section (lines 106–108) with canonical reference link
3. **`frontend/views/AGENTS.md`** — Added "Tier Isolation" subsection under existing "Quota Views" section (lines 87–92) with container switcher notes, CodeScene limit, and full doc reference

### Principles Followed
- **Minimal additions**: Each AGENTS.md update is a brief reference to the canonical doc, not full content duplication
- **Consistent formatting**: Matched existing section patterns (WhatsApp UI Patterns as template)
- **Cross-referenced**: All three files point to `docs/frontend/quota-ui-patterns.md`

### Quality Loop Result
- Same as Task 18.1 — tsgo passes, oxlint/biome skip `.md` files per config (known limitation)

## Carry-Forward Knowledge

### Patterns Confirmed Across All Waves
- **Tier isolation** appeared in Waves 0, 1, 2, 3, 4 — every wave that created or modified views
- **RHF 3-generic pattern** appeared in Wave 2 (form implementation) and Wave 4 (form refinement)
- **CodeScene 150-line limit** appeared in Waves 2, 3, 4 — every wave that added UI components
- **Cache update pattern** appeared in Wave 1 (mutation) and Wave 3 (detail view)
- **Permission gating** appeared in Waves 1, 2, 3 — form access, list access, detail access
- **i18n CLDR plurals** appeared in Waves 1, 2, 3 — all Arabic-facing strings
- **Reduced motion CSS** appeared in Waves 3, 4 — animation additions
- **Storybook ErrorState naming** appeared in Wave 2 and Wave 3 — Story stories
- **Component test tier-view mocking** appeared in Wave 2 and Wave 4 — test files
- **StatusBadge quota category** appeared in Waves 1, 3 — list and detail badges
- **MetricCard animated prop** appeared in Wave 3 — insights dashboard
- **Backend vs frontend GraphQL types** appeared in Waves 1, 2 — mutation input mapping

### Key Gotchas Documented
- `createLazyView<T>` type parameter must match the ViewModel interface, NOT a `{ vm: ViewModel }` wrapper
- `cache.updateQuery` (not `cache.modify`) for paginated lists — `cache.modify` loses pagination metadata
- Story `export const Error` shadows the global `Error` constructor — use `ErrorState` instead
- `z.coerce.number()` changes the input type to `unknown`, requiring the 3-generic `useForm` overload
- `@media (prefers-reduced-motion: reduce)` in sx is preferred over `useMediaQuery("(prefers-reduced-motion: reduce)")` — the CSS approach is automatic and doesn't require JavaScript
- CodeScene's 150-line limit per file means tier views must extract reusable UI into `components/` subdirectories

## Files Summary

| File | Action | Lines |
|------|--------|-------|
| `docs/frontend/quota-ui-patterns.md` | Created | 377 |
| `AGENTS.md` | Modified (1 line added) | 456 |
| `frontend/AGENTS.md` | Modified (4 lines added) | 135 |
| `frontend/views/AGENTS.md` | Modified (7 lines added) | 132 |
| `.ai/plans/quota/ui/tasks.md` | Modified (checkboxes updated) | 670 |
| `.ai/plans/quota/ui/outcome/wave5-knowledge-propagation-outcome.md` | Created | — |
