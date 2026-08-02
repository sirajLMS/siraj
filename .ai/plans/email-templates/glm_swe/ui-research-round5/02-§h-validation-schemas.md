# Round 5 Audit: §H — Validation Schemas

## Summary
- INVALID specs: 4 (H1, H2, H3, H5)
- PARTIAL specs: 2 (H4)
- Fixes recommended: 15

## H1 — INVALID (scope enum wrong, non-DB fields, wrong type)
- `scope` enum is `['transactional','marketing','compliance','system']` — WRONG
- EmailScope has 12 values (`COMPLAINT_RESPONSE`, `SUGGESTION_ACKNOWLEDGED`, etc.)
- `subject` field has no DB column (computed via `def.subject(props, locale)`)
- `bodyJson` has no DB column (should be `designJson`)
- `allowedEditorGroups` should be `z.enum(EmailEditorPermission)` not `z.array(z.string().uuid())`

## H2 — INVALID (zod v4 syntax + logical paradox)
- `.omit({ id: z.string().optional() })` is misleading zod v4 syntax (should be `.omit({ id: true })`)
- Logical contradiction: `.extend({ id })` then `.omit({ id })` — schema strips the id needed for publishing

## H3 — INVALID (sendgrid not a provider, email validation)
- `channel` enum includes `'sendgrid'` — NOT a registered provider (only 5+mock)
- `z.string().email()` should use repo convention `z.email()`

## H5 — INVALID (missing TipTap nodes, non-recursive)
- Missing essential TipTap node types (`text`, `bulletList`, `orderedList`, `listItem`, `hardBreak`, `blockquote`)
- `content: z.array(z.any())` is NOT recursive — allows `script`/`iframe` nested >1 level deep
- Must use `z.lazy(() => DesignNodeSchema)` for recursive validation

## H4 — PARTIAL (merge tags disconnected)
- `NotificationMetadataBase` has only 2 keys (`entityKind`, `entityId`)
- Merge tags like `{{user.name}}` map to `EmailPropsByScope[S]` typed props, NOT NotificationMetadataBase
- Multi-tag regex disconnected from `SubjectWithMergeTagsSchema`

## Path issue
- `shared/lib/validations/` doesn't exist yet
- `shared/` CANNOT import from `@/backend/enum/` (AGENTS.md enforces) — enums must move to `shared/constants/` or schemas must live in `backend/lib/`
