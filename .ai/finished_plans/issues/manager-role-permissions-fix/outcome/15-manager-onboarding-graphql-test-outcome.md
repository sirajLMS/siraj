# Task 15: Update GraphQL Onboarding Test — Outcome

**Date**: 2026-08-15
**Task**: 15 — Update GraphQL onboarding test
**Status**: ✅ Complete

## Summary of Changes

- **File Modified**: `frontend/common/graphql/test/teachers/manager-onboarding.test.ts`
- **Changes**:
  - Updated first test to create manager with `ManagerAccountType.Manager` (with all optional fields provided) and assert `assignedGroupSlug` is `"academy_admin"`.
  - Updated second test to create supervisor with `ManagerAccountType.Supervisor` (with optional fields as null) and assert `assignedGroupSlug` is `"supervisor_default"`.

## Quality Verification

- Ran `bun run scripts/health/sub-loop.ts frontend/common/graphql/test/teachers/manager-onboarding.test.ts --lifecycle codescene`
- All checks (tsgo, oxlint, biome:check, lint:type-aware, codescene) PASSED (exit code 0).

## Semantic Review & Instruction Verification

- Verified compliance with `frontend/common/graphql/test/AGENTS.md`, `tests.instructions.md`, and `frontend.instructions.md`.
- Full mutation argument coverage tested (meaningful optionals + null optionals).
