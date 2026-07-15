---
name: "03: Fix GraphQL resolver type issues"
overview: "Fix TypeScript errors in GraphQL resolvers related to translations and types"
todos:
  - id: "1"
    content: Fix meeting mutation resolver translation usage
    status: "pending"
  - id: "2"
    content: Fix student mutation resolver translation usage
    status: "pending"
  - id: "3"
    content: Fix class session pothos types
    status: "pending"
  - id: "4"
    content: Fix effective meeting pothos types
    status: "pending"
  - id: "5"
    content: Fix parent dashboard pothos types
    status: "pending"
  - id: "6"
    content: Fix teacher dashboard pothos types
    status: "pending"
  - id: "7"
    content: Fix class category query types
    status: "pending"
  - id: "8"
    content: Fix meeting query types
    status: "pending"
  - id: "9"
    content: Fix teacher portal query types
    status: "pending"
  - id: "10"
    content: Fix class session utils types
    status: "pending"
isProject: false
---

# Plan 03: Fix GraphQL Resolver Type Issues

## Files to Modify (from git status)
- `backend/graphql/mutation/meeting/meeting.mutation.ts`
- `backend/graphql/mutation/students/student.mutation.ts`
- `backend/graphql/pothos/classes/class-session.pothos.ts`
- `backend/graphql/pothos/classes/group-class.pothos.ts`
- `backend/graphql/pothos/meeting/effective-meeting.pothos.ts`
- `backend/graphql/pothos/meeting/meeting.pothos.ts`
- `backend/graphql/pothos/parents/parent-dashboard.pothos.ts`
- `backend/graphql/pothos/parents/parent-profile.pothos.ts`
- `backend/graphql/pothos/teachers/teacher-dashboard.pothos.ts`
- `backend/graphql/pothos/teachers/teacher-profile.pothos.ts`
- `backend/graphql/query/classes/class-category.query.ts`
- `backend/graphql/query/meeting/meeting.query.ts`
- `backend/graphql/query/teachers/teacher-portal.query.ts`
- `backend/graphql/utils/class-session.utils.ts`

## Common Issues
1. Translation namespace mismatches
2. Missing type imports from `@/backend/types`
3. Pothos type definition issues
