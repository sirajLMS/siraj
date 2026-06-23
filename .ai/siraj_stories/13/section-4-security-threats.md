## Section 4: Security Threat Remediation

### Threat 1: Privilege Escalation via Manager Provisioning
**Current Gap:** No existing implementation for manager creation. Without proper permission gating, any authenticated user could potentially create a manager account with elevated privileges.

**Fix in `ManagerOnboardingService.createManager()`:**
Before any database operations, call `PermissionsService.hasPermission(actorUserId, AppPermission.STAFF_CREATE)` to verify the actor is a System Administrator. If the actor lacks this permission, throw a localized unauthorized error immediately without performing any database writes. Additionally, verify that the actor's permission group slug is `super_admin` as a secondary check. The `accountType` field from the form (either `"manager"` or `"admin"`) determines which permission group is assigned to the new manager:
- `"admin"` → assign to `academy_admin` group
- `"manager"` → assign to `staff_default` group

The service MUST NOT allow the form to specify arbitrary permission group slugs. Only these two mappings are permitted.

**Test Requirements:**
- Academy Admin attempts to create manager → `unauthorized` error (permission denied due to missing `staff.create` permission from group assignment)
- System Admin creates manager with `accountType: "admin"` → succeeds, new user assigned to `academy_admin` group
- System Admin creates manager with `accountType: "manager"` → succeeds, new user assigned to `staff_default` group
- Unauthenticated user attempts to create manager → `unauthorized` error
- Form submission with invalid `accountType` (e.g., `"super_admin"`) → validation error (not a valid option)

---

### Threat 2: Email Collision During User Provisioning
**Current Gap:** `UserRepository.create()` checks email uniqueness, but the onboarding forms don't provide real-time email validation feedback. A user could fill out the entire multi-section form only to discover at submission that the email is already taken.

**Fix in all three onboarding services:**
Each service method (`createTeacher`, `createParent`, `createManager`) must call `UserRepository.existsByEmail(email)` as the FIRST validation step before any other processing. If the email already exists, throw a localized error: `"An account with this email address already exists."` immediately, without creating any database records.

Additionally, expose a GraphQL query `checkEmailAvailability(email: String!): EmailAvailabilityResult` that the frontend can call on email field blur. This query returns `{ available: boolean, message?: string }` and is rate-limited to prevent email enumeration attacks.

**Test Requirements:**
- Create teacher with unique email → succeeds
- Create teacher with existing email → error "email already exists"
- Create parent with unique email → succeeds
- Create parent with existing email → error "email already exists"
- Create manager with unique email → succeeds
- Create manager with existing email → error "email already exists"
- Email availability check with unique email → `{ available: true }`
- Email availability check with existing email → `{ available: false }`

---

### Threat 3: Orphaned User Records on Partial Provisioning Failure
**Current Gap:** User provisioning requires creating records in three tables: `users`, role-specific profile (`teachers`/`parents`/`staffProfiles`), and `userPermissionGroups`. If the profile creation fails after the user is created, an orphaned user record remains in the database with no role assignment.

**Fix in all three onboarding services:**
Wrap the entire provisioning workflow in a single `db.transaction()` block:
1. Create user record via `UserRepository.create()`
2. Create role-specific profile via new repository create methods
3. Assign permission group via `PermissionManagementRepository.bulkAssignUsersToGroup()`

If ANY step fails, the entire transaction rolls back automatically. No partial state is committed. The service must catch the error, log it via `logger.error`, and re-throw a localized error message to the caller.

**Test Requirements:**
- Successful teacher creation → user, teacher profile, and permission group all created
- Teacher creation fails at profile step → user record rolled back (not in database)
- Teacher creation fails at permission assignment → user and teacher profile rolled back
- Same rollback behavior verified for parent and manager creation
- Transaction isolation verified: concurrent provisioning requests don't interfere

---

### Threat 4: Sensitive Data Exposure in Banking Details
**Current Gap:** Teacher onboarding includes salary and banking details (SWIFT, IBAN, account number). These are sensitive PII that must be encrypted at rest.

**Fix in `TeacherOnboardingService.createTeacher()`:**
The `teachers` table schema already uses `encryptedText` for `nationalId` and `zoomPassword`. The `teacherBankingDetailsHistory` table uses `encryptedText` for all banking fields. The service must ensure that:
1. Banking details are submitted via `TeacherBankingRepository.submitBankingDetails()` which handles encryption automatically
2. Salary amount and currency are stored in the `teachers` table (`hourlyRate`, `rateCurrency`) — these are NOT encrypted (they are numeric values used for payroll calculations)
3. National ID is stored in `teachers.nationalId` using `encryptedText` — the repository handles encryption
4. Zoom password is stored in `teachers.zoomPassword` using `encryptedText` — the repository handles encryption

The service must NOT log any sensitive fields (banking details, national ID, zoom password) via `logger.info` or `logger.debug`. Only non-sensitive metadata (teacher ID, name, email) may be logged for audit purposes.

**Test Requirements:**
- Teacher created with banking details → banking fields encrypted in database
- Teacher created with national ID → national ID encrypted in database
- Teacher created with zoom password → zoom password encrypted in database
- Service logs do NOT contain sensitive data (verify via log inspection)
- Banking details retrievable and decryptable by authorized admin via existing `TeacherBankingRepository.getActiveBankingDetails()`
