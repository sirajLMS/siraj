## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/13.md` (Part 14: Permissions & Permission Groups, timestamps 00:00 - 02:01)
- **Security baseline:** Current project state with existing permission catalog, RBAC system, and authentication infrastructure
- **Story scope:** Implement user provisioning workflows for three user types (Teacher, Parent, Manager/Staff) with role-based access control enforcement, and implement role-scoped authentication validation for unauthenticated users.
- **Target roles:** System Administrator (full access to manager provisioning), Academy Admin (teacher and parent provisioning), Unauthenticated User (role-scoped login validation).
- **Status:** Planning phase - awaiting approval for execution.

### 0.1 Business Objectives

1. **Delegation of Authority:** The `manager.create_account` permission is the gatekeeper of the RBAC system itself. By restricting this permission strictly to System Administrators, standard Academy Admins are prevented from creating rogue administrative accounts or escalating their own colleagues' privileges. This ensures accountability in the organizational hierarchy.

2. **Role-Scoped Authentication:** The `auth.login_validation` rule ensures that a Teacher cannot log into the Parent portal, even if they have valid system credentials. By scoping the database query to the selected role tab, the LMS maintains strict separation of environments and data visibility. This prevents cross-role data leakage and ensures users only access their designated portal.

3. **Financial Pre-configuration:** The `parent.create_account` workflow demonstrates that billing automation is deeply integrated into user onboarding. By forcing the Academy Admin to define the currency, invoice type, and payment method at the moment of creation, the system eliminates the risk of a parent being successfully onboarded but "falling through the cracks" of the invoicing cycle. This ensures every parent account is immediately ready for automated billing.

4. **Comprehensive Teacher Onboarding:** The `staff.create_teacher` permission enables Academy Admins to provision new teaching staff with complete profiles including personal demographics, official communication channels (Zoom, Skype), salary details, and banking information. This single workflow activates the teacher's portal access and establishes their operational profile for scheduling, payroll, and communication.

### 0.2 Scope Boundaries

**In scope:**
- New permissions added to `backend/db/migration/3-system_permissions_and_groups.sql`: `staff.create_teacher`, `parent.create_account`, `manager.create_account`, `auth.login_validation`
- New enum values added to `shared/lib/enum.ts` (AppPermission enum)
- Repository create methods for `teachers`, `parents`, and `staffProfiles` tables
- Domain services for user provisioning with permission gating and transactional orchestration
- GraphQL Pothos input types, mutation fields, and resolvers for all three user types
- GraphQL Pothos query field and resolver for role-scoped authentication validation
- Frontend Apollo TypedDocumentNode mutations for teacher, parent, and manager creation
- Frontend Apollo TypedDocumentNode query for login validation
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
- Existing authentication login flow modifications (only adding new validation query, not modifying existing `login` mutation)
- Student onboarding (separate story)
- Teacher profile editing workflows (already implemented in `StaffProfileService.updateTeacherProfile`)
- Parent profile editing workflows (already implemented in `ParentProfileService`)
- Manager profile editing workflows (already implemented in `ManagerProfileService`)
- Permission group management UI (already implemented in permission management views)
- Bulk user import or CSV upload functionality
- Email verification or password reset flows during onboarding
- Multi-factor authentication setup during onboarding
- User deactivation or deletion workflows (already implemented for parents)
