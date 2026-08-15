# Task 6: Update Onboarding Locale Type Schema — Outcome

**Date**: 2026-08-15
**Task**: 6 — Update onboarding locale type schema — remove `admin` keys
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `shared/locale/types/dashboard/staff/onboarding.ts`
- **Changes**:
  - Removed `readonly admin: string;` from `accountType` interface.
  - Removed `readonly admin: string;` from `accountTypeDescriptions` interface.

## Quality Verification

- Ran `bun run scripts/health/sub-loop.ts shared/locale/types/dashboard/staff/onboarding.ts --lifecycle codescene`
- All checks (tsgo, oxlint, biome:check, lint:type-aware, check:duplicates, codescene) PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `shared/AGENTS.md`.
- No cross-layer imports (pure type definition).
- Resolves deferred item D3.
