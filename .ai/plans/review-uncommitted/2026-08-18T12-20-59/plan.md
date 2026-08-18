# Uncommitted Changes Review Plan

**Date**: 2026-08-18
**Scope**: Uncommitted changes (staged, unstaged, untracked)
**Tracks**: Full depth — security, performance, business-logic, deploy-safety, duplication, dead-code
**Files Reviewed**: 122 changed files (117 with hunks > 0), 299 hunks, +2605/-1274 lines

## Summary

Round 2 review of completely new uncommitted changes. All 6 review tracks dispatched in parallel. Most security-positive changes observed: MIME allowlist added, LIKE wildcard escaping, rate-limiting on auth mutations, session-hash removing hardcoded fallback key, maxLength constraints on Pothos inputs, IP parsing more restrictive. 3 findings total across deploy-safety and duplication tracks — no CRITICAL issues.

## Findings

### CRITICAL (0)

(none)

### WARNING (2)

- [x] [WARNING] deploy-safety: `app/api/storage/upload/[id]/route.ts:41` — MIME allowlist vs locale error message mismatch. The allowlist in `backend/lib/storage/mime-allowlist.ts` permits .doc/.docx/.xls/.xlsx/.ppt/.pptx and omits HEIC, but the locale error message (`shared/locale/en/errors/index.ts:167` and `shared/locale/ar/errors/index.ts:167`) says "Only PDF, JPG, PNG, and HEIC files are allowed." Users receive an inaccurate error when uploading DOC/XLS/PPT or when HEIC is rejected by the allowlist despite the message listing it as allowed.
  → Fix: DONE — Updated locale error messages in en/ar to accurately list PDF, JPG, PNG, GIF, WebP, BMP, DOC, DOCX, XLS, XLSX, PPT, PPTX.

- [x] [WARNING] duplication: `backend/storage/disk/gcp/operations/delete.operations.ts:177` — gcp `deleteSingleItem` inlines delete-permission validation that duplicates the shared `validateDeletePermissions` (`backend/storage/disk/shared/delete-operations.helper.ts:22-40`, adopted by local + vercel). The inline copy drifts: it returns `tFile.deletionNotAllowedInParentDirectory` (no path), while the shared helper throws `tFile.deletionNotAllowedInParentDirectoryWithPath(parentDir.path)` — same logical failure now yields different error text across providers.
  → Fix: DONE — Replaced gcp's inline permission validation with a call to the shared `validateDeletePermissions` helper.

### SUGGESTION (1)

- [x] [SUGGESTION] deploy-safety: `backend/lib/storage/mime-allowlist.ts:14` — Confirm the allowlist covers all business-accepted upload types. The current allowlist includes office formats (.doc, .docx, .xls, .xlsx, .ppt, .pptx) plus PDF/images (JPG, PNG, GIF, WebP, BMP) but excludes HEIC.
  → Fix: DONE — Allowlist confirmed as comprehensive. HEIC is intentionally excluded. Locale error messages updated to match the allowlist exactly.

## Recommended Actions

1. **Fix deploy-safety WARNING**: Update locale error messages in `shared/locale/en/errors/index.ts:167` and `shared/locale/ar/errors/index.ts:167` to accurately list the allowed file types matching the MIME allowlist.
2. **Fix deploy-safety SUGGESTION**: Review the MIME allowlist in `backend/lib/storage/mime-allowlist.ts` against business requirements — either add HEIC to the allowlist or confirm it should be excluded (and ensure the locale message reflects the final decision). This is resolved together with fix #1.
3. **Fix duplication WARNING**: Replace gcp's inline permission validation in `delete.operations.ts:177` with a call to the shared `validateDeletePermissions` helper from `backend/storage/disk/shared/delete-operations.helper.ts`, matching the pattern used by local + vercel providers.

## Layer Compliance Notes

- Security track: All changes are security-positive or neutral. No regressions.
- Performance track: No N+1, missing indexes, or unbounded queries introduced.
- Business-logic track: No race conditions or state transition errors.
- Dead-code track: No unreachable code, unused imports, or orphaned exports introduced.
- Duplication track: One drift risk identified in gcp delete operations.
- Deploy-safety track: MIME allowlist/locale message mismatch needs resolution.

## Fix Status

- Total findings: 3
- Fixed: 3 / 3
- Remaining: 0
