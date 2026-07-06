# Meta Plan for Sprint 13 Implementation

## Overview
This meta plan defines the exact structure and content requirements for creating the implementation plan for sprint 13, which implements user provisioning permissions across four permission groups: System Administrator, Admin, and Unauthenticated User.

## Required Permissions to Implement
- `staff.create_teacher` - Create teaching staff with comprehensive profiles
- `parent.create_account` - Register clients with billing configuration  
- `manager.create_account` - Provision backend staff with RBAC tier assignment
- `auth.login_validation` - Role-scoped authentication validation

## Directory Structure
```
.ai/siraj_stories/13/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-enum.md
│   ├── task-b-repositories.md
│   ├── task-c-repo-tests.md
│   ├── task-d-services.md
│   ├── task-e-graphql-pothos.md
│   ├── task-f-frontend-documents.md
│   ├── task-g-types-extraction.md
│   ├── task-h-graphql-tests.md
│   ├── task-i-storybook-migration.md
│   ├── task-j-i18n.md
│   ├── task-k-frontend-stores.md
│   └── task-l-frontend-views.md
├── section-7-final-verification.md
└── appendix.md
```

## Section Files Details

### section-0-metadata.md
- Story metadata linking to `.ai/siraj_stories/13.md`
- Business objectives for user provisioning permissions
- Scope boundaries (in/out of scope)

### section-1-core-principles.md
- Core principles checklist with Zero Incomplete Implementation Policy table
- Service layer architecture rules (NO Drizzle imports)
- GraphQL resolver architecture rules (NO DB/Repo imports)
- Task ordering and dependency integrity rules
- Type safety requirements (NO any, NO casts)
- Testing requirements for all layers

### section-2-rbac-permissions.md
- New permissions table mapping to permission groups
- Permission group assignments
- Self-scoping vs any-scoping considerations

### section-4-security-threats.md
- Threat 1: IDOR protection for user creation
- Threat 2: Role-scoped authentication validation  
- Threat 3: Financial data protection during parent onboarding
- Specific test requirements for each threat

### section-5-prerequisites.md
- Database schema verification
- Migration verification
- Test suite verification
- Existing code verification
- Frontend verification

### section-7-final-verification.md
- Complete verification protocol with quality gate commands
- Schema generation commands
- Test suite execution commands
- Prohibited pattern checks

### appendix.md
- File creation summary table
- Dependency graph showing task relationships

## Task Files Details

### task-a-migration-enum.md
- Add permissions to `backend/db/migration/3-system_permissions_and_groups.sql`
- Update `shared/lib/enum.ts` AppPermission enum
- Run migration sequence: cleanGenerate → reset → seed → test:db

### task-b-repositories.md
- Implement repository methods for teacher, parent, manager creation
- Use transactional methods with atomic operations
- Target files: staff.repository.ts, parent.repository.ts, manager.repository.ts

### task-c-repo-tests.md
- 100% coverage repository tests
- IDOR protection tests
- Success/failure path validation

### task-d-services.md
- Domain services with permission gating
- NO Drizzle imports allowed
- Business logic centralization

### task-e-graphql-pothos.md
- Pothos objects and resolvers
- Resolvers delegate to services only
- Include id fields, propagate locale

### task-f-frontend-documents.md
- Apollo TypedDocumentNode documents
- Include id fields on all objects
- Import from @apollo/client

### task-g-types-extraction.md
- Extract types from mock stores to types.ts files
- Re-export generated GraphQL types
- Update mock stores to re-import types

### task-h-graphql-tests.md
- Authorized success + unauthorized denial tests
- Security threat coverage tests

### task-i-storybook-migration.md
- Migrate to MockedProvider decorators
- Mock GraphQL responses with __typename
- Mock permission gates

### task-j-i18n.md
- English/Arabic translations for new UI strings
- Use shared/messages/en.ts and shared/messages/ar/ directories

### task-k-frontend-stores.md
- Real Zustand stores with Apollo hooks
- Use generated GraphQL types
- No mock data in production

### task-l-frontend-views.md
- Replace mock stores with useQuery
- Add RequirePermission wrappers
- Replace confirm() with MUI Dialogs

## Compliance Requirements
- Total plan length: 2,500+ lines of markdown
- Each task: 300-600+ lines with complete code examples
- No placeholder code (no "...", no TODOs)
- Quality gate checklists in every task file
- Test tasks immediately follow implementation tasks
- Strict task ordering with no forward dependencies