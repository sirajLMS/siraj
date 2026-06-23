## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/13.md` (Part 14: Permissions & Permission Groups, timestamps 00:00 - 02:01)
- **Security baseline:** Current project state with existing permission catalog, RBAC system, and authentication infrastructure
- **Story scope:** Implement user provisioning workflows for three user types (Teacher, Parent, Manager/Staff) with permission group-based access control enforcement.
- **Target roles:** System Administrator (full access to manager provisioning), Academy Admin (teacher and parent provisioning).
- **Status:** Planning phase - awaiting approval for execution.

### 0.1 Business Objectives

1. **Delegation of Authority:** The `staff.create` permission is the gatekeeper of the RBAC system itself. By restricting this permission strictly to System Administrators (as defined in the migration), standard Academy Admins are prevented from creating rogue administrative accounts or escalating their own colleagues' privileges. This ensures accountability in the organizational hierarchy.

2. **Financial Pre-configuration:** The `parents.create` workflow demonstrates that billing automation is deeply integrated into user onboarding. By forcing the Academy Admin to define the currency, invoice type, and payment method at the moment of creation, the system eliminates the risk of a parent being successfully onboarded but "falling through the cracks" of the invoicing cycle. This ensures every parent account is immediately ready for automated billing.

3. **Comprehensive Teacher Onboarding:** The `teachers.create` permission enables Academy Admins to provision new teaching staff with complete profiles including personal demographics, official communication channels (Zoom, Skype), salary details, and banking information. This single workflow activates the teacher's portal access and establishes their operational profile for scheduling, payroll, and communication.

### 0.2 Scope Boundaries

**In scope:**
- Reused existing permissions from `backend/db/migration/3-system_permissions_and_groups.sql`: `teachers.create`, `parents.create`, `staff.create`
- New enum values added to `shared/lib/enum.ts` (AppPermission enum)
- Repository create methods for `teachers`, `parents`, and `staffProfiles` tables
- Domain services for user provisioning with permission gating and transactional orchestration
- GraphQL Pothos input types, mutation fields, and resolvers for all three user types
- Frontend Apollo TypedDocumentNode mutations for teacher, parent, and manager creation
- Type extraction from mock onboarding stores to dedicated `types.ts` files
- Real Zustand stores for onboarding state management using Apollo hooks
- Migration of `TeacherOnboardingContainer` from mock store to real `useMutation`
- Migration of `ParentOnboardingContainer` from mock store to real `useMutation`
- Migration of `ManagerOnboardingContainer` from mock store to real `useMutation`
- Storybook migration for all three onboarding containers to use `MockedProvider`
- RBAC enforcement via `<RequirePermission>` wrappers on onboarding pages
- i18n translation keys verification (all translations already exist in `shared/messages/en.ts` and `shared/messages/ar/`)
- Comprehensive test coverage across all layers (repository, service, GraphQL, UI components)

**Out of scope:**
- Existing authentication login flow (the project uses a single email/password login form with no role tabs — dashboard renders conditionally based on permission groups)
- Student onboarding (separate story)
- Teacher profile editing workflows (already implemented in `StaffProfileService.updateTeacherProfile`)
- Parent profile editing workflows (already implemented in `ParentProfileService`)
- Manager profile editing workflows (already implemented in `ManagerProfileService`)
- Permission group management UI (already implemented in permission management views)
- Bulk user import or CSV upload functionality
- Email verification or password reset flows during onboarding
- Multi-factor authentication setup during onboarding
- User deactivation or deletion workflows (already implemented for parents)
