---
name: "05: Fix backend database repository type issues"
overview: "Fix TypeScript errors in database repositories"
todos:
  - id: "1"
    content: Fix meeting provider repository types
    status: "pending"
  - id: "2"
    content: Fix user meeting config repository types
    status: "pending"
  - id: "3"
    content: Fix class instances repository types
    status: "pending"
  - id: "4"
    content: Fix recurring repository types
    status: "pending"
  - id: "5"
    content: Fix leave quota repository types
    status: "pending"
  - id: "6"
    content: Fix scheduling shared types
    status: "pending"
  - id: "7"
    content: Fix state changes repository types
    status: "pending"
  - id: "8"
    content: Fix student repository types
    status: "pending"
isProject: false
---

# Plan 05: Fix Backend Database Repository Type Issues

## Files to Modify (from git status)
- `backend/db/repo/meeting/meeting-provider.repository.ts`
- `backend/db/repo/meeting/user-meeting-config.repository.ts`
- `backend/db/repo/scheduling/class-instances.ts`
- `backend/db/repo/scheduling/recurring.ts`
- `backend/db/repo/scheduling/scheduling-queries.repository/leave-quota.repository.ts`
- `backend/db/repo/scheduling/shared.ts`
- `backend/db/repo/scheduling/state-changes.ts`
- `backend/db/repo/students/student.repository.ts`

## Common Issues
1. Transaction (tx) parameter passing
2. Missing type imports
3. Drizzle query type mismatches
4. runInRollback test wrapper issues
