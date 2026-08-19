# Phase 8 Outcome: Verify Supervisor Access to Teacher/Student Pages

## Summary

All page access guards and GraphQL mutation permissions were verified. Every guard uses **permission-based checks** (not hardcoded role checks). No fixes were needed (Task 8.6 had nothing to fix).

## Task 8.1: Teachers Directory Page

**File:** `app/(dashboard)/teachers/page.tsx`

```tsx
export default withPageAuth([AppPermission.STAFF_VIEW_DIRECTORY, AppPermission.TEACHERS_LIST], async () => {
  if (await isUsersDirectoryEnabled()) {
    redirect("/users?tab=teachers");
  }
  return <TeachersContainer />;
});
```

**Verdict:** ✓ Uses `withPageAuth` with `[STAFF_VIEW_DIRECTORY, TEACHERS_LIST]` (OR-logic). Supervisor has both permissions per migration 6. No hardcoded role checks.

## Task 8.2: Teacher Onboarding Page

**File:** `app/(dashboard)/teachers/onboarding/page.tsx`

```tsx
export default withPageAuth([AppPermission.TEACHERS_CREATE], async () => {
  return <TeacherOnboardingContainer />;
});
```

**Verdict:** ✓ Gated on `TEACHERS_CREATE`. Supervisor has this permission per migration 6. No hardcoded role checks.

## Task 8.3: Students Directory Page

**File:** `app/(dashboard)/students/page.tsx`

```tsx
await requirePermissionForPage(userId, getStudentsPagePermissions(), locale, context);
const audience = context ? resolveStudentsPageAudience(context) : null;
```

**Supporting file:** `app/(dashboard)/lib/resolve-students-page-audience.ts`

```tsx
const STUDENTS_PAGE_PERMISSIONS = [
  AppPermission.STUDENTS_LIST,
  AppPermission.TEACHER_VIEW_STUDENTS,
  AppPermission.PARENT_VIEW_STUDENTS,
] as const;

export function resolveStudentsPageAudience(context: UserPermissionContext): StudentsPageAudience | null {
  const { permissions, isSuperAdmin } = context;
  if (isSuperAdmin || permissions.includes(AppPermission.STUDENTS_LIST)) {
    return "admin";
  }
  if (permissions.includes(AppPermission.TEACHER_VIEW_STUDENTS)) {
    return "teacher";
  }
  if (permissions.includes(AppPermission.PARENT_VIEW_STUDENTS)) {
    return "parent";
  }
  return null;
}
```

**Verdict:** ✓ Page guard uses `requirePermissionForPage` with OR-logic permissions from `getStudentsPagePermissions()`. `resolveStudentsPageAudience` checks `STUDENTS_LIST` → "admin" audience (which renders `StudentsContainer`). Supervisor has `STUDENTS_LIST` per migration 6, so they get the admin audience. The `isSuperAdmin` check is an accelerator (superAdmin always gets admin view), not a gate — the permission check is the security boundary. No hardcoded role checks.

## Task 8.4: Student Onboarding Page

**File:** `app/(dashboard)/students/onboarding/page.tsx`

```tsx
export default withPageAuth([AppPermission.STUDENTS_CREATE], async () => {
  return <StudentOnboardingView />;
});
```

**Verdict:** ✓ Gated on `STUDENTS_CREATE`. Supervisor has this permission per migration 6. No hardcoded role checks.

## Task 8.5: GraphQL Mutations Reachable by Supervisors

### `reassignStudentTeacher`

**File:** `backend/graphql/pothos/students/student-lifecycle.pothos.ts` (line 37)

```tsx
authScopes: { permission: AppPermission.STUDENT_REASSIGN_TEACHER },
```

**Verdict:** ✓ Permission-gated. Supervisor has `student.reassign_teacher` per migration 6.

### `changeStudentStatus`

**File:** `backend/graphql/pothos/students/student-lifecycle.pothos.ts` (line 59)

```tsx
authScopes: { permission: AppPermission.STUDENT_MANAGE_STATUS },
```

**Verdict:** ✓ Permission-gated. Supervisor has `student.manage_status` per migration 6.

### `partiallyUpdateStudent`

**File:** `backend/graphql/mutation/students/student.mutation.ts` (line 31)

```tsx
authScopes: { permission: AppPermission.STUDENTS_EDIT },
```

**Verdict:** ✓ Permission-gated. Supervisor has `students.edit` per migration 6.

### `deleteStudent`

**File:** `backend/graphql/mutation/students/student.mutation.ts` (line 59-68)

```tsx
authScopes: { loggedIn: true },
// ...
resolve: async (_query, args, ctx) => {
  const userId = await requireAuth(ctx);
  const tErrors = ctx.t().errorsTranslations;
  await requireStudentManageStatus(userId, tErrors);
  return await StudentRepository.deleteById(args.id, tErrors)...
},
```

The `requireStudentManageStatus` helper (line 14-18) checks:

```tsx
const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STUDENT_MANAGE_STATUS);
if (!hasPermission) {
  throw new Error(tErrors.insufficientPermissions);
}
```

**Verdict:** ✓ Permission-gated via `requireStudentManageStatus` which checks `STUDENT_MANAGE_STATUS`. Supervisor has `student.manage_status` per migration 6. Note: `deleteStudent` uses `authScopes: { loggedIn: true }` at the Pothos scope level (basic auth), but the actual permission check is enforced in the resolver via `requireStudentManageStatus`. This is the established pattern for mutations needing service-layer permission checks.

## Task 8.6: Hardcoded Role Check Audit

**Search:** `role === '...'`, `isSuperAdmin ===`, `role !==` in `app/(dashboard)/**/*.{ts,tsx}`

**Result:** No matches found. All page guards use permission-based checks exclusively.

**Verdict:** ✓ No fixes needed. No files modified.

## Task 8.7: Outcome File

This file.

## Conclusion

All supervisor access guards for teacher/student pages and GraphQL mutations are correctly configured using permission-based checks. Supervisors can access:
- Teachers directory (via `STAFF_VIEW_DIRECTORY` or `TEACHERS_LIST`)
- Teacher onboarding (via `TEACHERS_CREATE`)
- Students directory admin view (via `STUDENTS_LIST`)
- Student onboarding (via `STUDENTS_CREATE`)
- `reassignStudentTeacher` (via `STUDENT_REASSIGN_TEACHER`)
- `changeStudentStatus` (via `STUDENT_MANAGE_STATUS`)
- `partiallyUpdateStudent` (via `STUDENTS_EDIT`)
- `deleteStudent` (via `STUDENT_MANAGE_STATUS`)

No hardcoded role checks were found. No code changes were necessary in Phase 8.
