# Sprint 13 User Provisioning Meta Plan

## Current Project State Analysis

### Existing Infrastructure
- **Permissions System**: Fully implemented with `AppPermission` enum and SQL migration seeding
- **User Types**: Three user types exist - Teachers, Parents, Managers (Staff)
- **Onboarding Containers**: Mock implementations exist for all three user types:
  - `TeacherOnboardingContainer` (uses `mockTeacherOnboardingStore`)
  - `ParentOnboardingContainer` (uses `mockParentOnboardingStore`) 
  - `ManagerOnboardingContainer` (uses `mockManagerOnboardingStore`)
- **Authentication**: Basic auth system with `auth.login` permission, demo login available
- **Repository Layer**: Complete repository methods for user management (`teacher.repository.ts`, `parent.repository.ts`, `staff-profile.repository.ts`)
- **Service Layer**: Missing dedicated services for user provisioning workflows
- **GraphQL Layer**: Basic auth GraphQL exists, but no user creation mutations
- **Frontend Stores**: All mock stores need migration to real Apollo-backed stores

### Missing Permissions Analysis
The following permissions from sprint 13 are **NOT** currently implemented:
- `staff.create_teacher` - Create teacher accounts with full profiles
- `parent.create_account` - Create parent accounts with billing configuration  
- `manager.create_account` - Create manager accounts with RBAC assignment
- `auth.login_validation` - Role-scoped authentication validation

These permissions are missing from both:
- `shared/lib/enum.ts` (AppPermission enum)
- `backend/db/migration/3-system_permissions_and_groups.sql` (SQL seed data)

### Existing Onboarding Data Structures
**Teacher Onboarding**: Full profile including Personal Info, Official Details (Zoom/Skype), Salary Details (SWIFT/IBAN)
**Parent Onboarding**: Basic info plus Fees Details (Invoice Type, Payment Method, Currency)  
**Manager Onboarding**: Basic info plus Account Type selection (Admin vs Manager)

## Updated Implementation Plan Structure

### Directory Structure
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
│   ├── task-e-service-tests.md
│   ├── task-f-graphql-pothos.md
│   ├── task-g-frontend-documents.md
│   ├── task-h-types-extraction.md
│   ├── task-i-graphql-tests.md
│   ├── task-j-storybook-migration.md
│   ├── task-k-i18n.md
│   ├── task-l-frontend-stores.md
│   └── task-m-frontend-views.md
├── section-7-final-verification.md
└── appendix.md
```

### Critical Implementation Notes

**Section 3 (State Machine)**: Omitted as user provisioning doesn't involve state transitions.

**Task Dependencies**: 
- Task A must add all 4 new permissions to both enum and SQL migration
- Tasks B-D must implement comprehensive user creation workflows matching existing mock data structures
- Task D (Services) is critical - must handle permission gating and business logic for all user types
- Task F (GraphQL) must create mutations that delegate to services with proper locale propagation
- Task J (Storybook) must migrate all 3 onboarding containers to use `MockedProvider`
- Task M (Views) must replace all mock store imports with real `useQuery` hooks and add `<RequirePermission>` wrappers

**Security Requirements**:
- `auth.login_validation`: Must implement role-scoped database queries based on UI tab selection
- `manager.create_account`: Only System Administrators can assign RBAC privilege tiers
- IDOR protection: Users cannot escalate privileges or access other users' data

**Architecture Compliance**:
- Services can ONLY import from `backend/db/repo/` (no Drizzle direct access)
- GraphQL resolvers can ONLY import from `backend/services/` (no repo direct access)
- All new permissions must be added to existing migration file (not separate seeders)
- Must run full migration sequence after Task A

This meta plan ensures accurate reflection of current project state while providing precise implementation guidance for sprint 13 requirements.