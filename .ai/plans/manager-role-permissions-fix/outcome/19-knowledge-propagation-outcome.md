# Task 19: Knowledge Propagation — Outcome

**Date**: 2026-08-15
**Task**: 19 — Knowledge propagation
**Status**: ✅ Complete

## Summary of Documentation Updates

1. **Architecture Document Created**:
   - `docs/auth/manager-role-mapping.md`: Documented the full architecture of manager role mappings, system permission group targets (`Manager` -> `academy_admin`, `Supervisor` -> `supervisor_default`), staff directory `%admin%` filtering, and permission boundaries.
2. **Layer AGENTS.md Files Updated**:
   - `backend/services/AGENTS.md`: Added documentation under "System Permission Groups" regarding manager onboarding mapping and the removal of the redundant `admin` account type.
   - `backend/enum/AGENTS.md`: Added documentation under "File Organization" regarding `ManagerAccountType` enum values (`manager`, `supervisor`).
