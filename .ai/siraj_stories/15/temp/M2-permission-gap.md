# M2 — Permission Gap Analysis

## Current Permission State

### Existing Permissions in `shared/lib/enum.ts` (AppPermission enum, lines 402-502)

**Complaint-related (Story 14 plan):**
| Enum Key | Value | Status |
|----------|-------|--------|
| `COMPLAINTS_LIST` | `"complaints.list"` | EXISTS in enum + migration |
| `COMPLAINTS_DELETE` | `"complaints.delete"` | EXISTS in enum + migration |
| `COMPLAINTS_RESPOND` | `"complaints.respond"` | EXISTS in enum + migration |

**Story 14 parent-facing permissions (planned, NOT yet in enum):**
| Enum Key | Value | Status |
|----------|-------|--------|
| `SUPPORT_SUBMIT_COMPLAINT` | `"support.submit_complaint"` | **MISSING** from enum |
| `SUPPORT_VIEW_HISTORY` | `"support.view_history"` | **MISSING** from enum |
| `COMMUNICATION_SUBMIT_SUGGESTION` | `"communication.submit_suggestion"` | **MISSING** from enum |
| `SYSTEM_DISPATCH_EMAIL` | `"system.dispatch_email"` | **MISSING** from enum |

> **Finding:** Story 14's task-c-services.md references these permissions as prerequisites, but they are NOT present in the current `AppPermission` enum. They must be added as part of Story 15 (or were supposed to be added in Story 14 but weren't executed).

### Existing Group Assignments (from `3-system_permissions_and_groups.sql`)

**`complaints.list`** is assigned to:
- `super_admin` (line 961)
- `parent_default` (line 1092) — parents can list their own complaints
- `staff_default` (line 1111) — staff can list complaints

**`complaints.delete`** is assigned to:
- `super_admin` (line 962)

**`complaints.respond`** is assigned to:
- `super_admin` (line 963)

**Notable:** `academy_admin` does NOT have `complaints.list`, `complaints.delete`, or `complaints.respond` in the current migration.

---

## Permission Reuse Problem (Story 14)

### `complaints.list` Reused for Suggestion Admin Access

In Story 14's `suggestion.service.ts` plan (task-c-services.md, lines 676-679 and 715-718):

```typescript
// getAdminSuggestions
const hasPermission = await PermissionsService.hasPermission(
  actorUserId,
  AppPermission.COMPLAINTS_LIST  // <-- REUSED, not a dedicated permission
);

// markSuggestionReviewed
const hasPermission = await PermissionsService.hasPermission(
  actorUserId,
  AppPermission.COMPLAINTS_LIST  // <-- REUSED
);
```

**This is a known tech debt from Story 14.** The `COMPLAINTS_LIST` permission was reused as a temporary measure because dedicated suggestion permissions didn't exist. Story 15 must:

1. Create dedicated `suggestions.*` permissions
2. Update `SuggestionService` to use the new permissions instead of `COMPLAINTS_LIST`
3. Migrate any frontend permission checks from `COMPLAINTS_LIST` to the new suggestion-specific ones

---

## New Permissions Required for Story 15

### 1. `suggestions.list` (SUGGESTIONS_LIST)

| Property | Value |
|----------|-------|
| Enum Key | `SUGGESTIONS_LIST` |
| Value | `"suggestions.list"` |
| Resource | `suggestions` |
| Action | `list` |
| Description | View admin suggestion queue with filtering and pagination |
| Category | `Communications` |
| is_system | `true` |

**Group Assignments:**
- `super_admin` — YES
- `academy_admin` — YES
- `staff_default` — NO
- `parent_default` — NO
- `teacher_default` — NO

### 2. `suggestions.review` (SUGGESTIONS_REVIEW)

| Property | Value |
|----------|-------|
| Enum Key | `SUGGESTIONS_REVIEW` |
| Value | `"suggestions.review"` |
| Resource | `suggestions` |
| Action | `review` |
| Description | Mark suggestion as reviewed, add admin response, mark as duplicate |
| Category | `Communications` |
| is_system | `true` |

**Group Assignments:**
- `super_admin` — YES
- `academy_admin` — YES
- `staff_default` — NO
- `parent_default` — NO
- `teacher_default` — NO

### 3. `suggestions.delete` (SUGGESTIONS_DELETE)

| Property | Value |
|----------|-------|
| Enum Key | `SUGGESTIONS_DELETE` |
| Value | `"suggestions.delete"` |
| Resource | `suggestions` |
| Action | `delete` |
| Description | Soft-delete inappropriate suggestions |
| Category | `Communications` |
| is_system | `true` |

**Group Assignments:**
- `super_admin` — YES
- `academy_admin` — NO (delete is Super Admin only)
- `staff_default` — NO
- `parent_default` — NO
- `teacher_default` — NO

---

## Story 14 Deferred Permissions (Must Also Be Added)

These permissions were planned in Story 14 but are missing from the codebase:

### 4. `support.submit_complaint` (SUPPORT_SUBMIT_COMPLAINT)

| Property | Value |
|----------|-------|
| Enum Key | `SUPPORT_SUBMIT_COMPLAINT` |
| Value | `"support.submit_complaint"` |
| Resource | `support` |
| Action | `submit_complaint` |
| Category | `Support` |
| Group | `parent_default` |

### 5. `support.view_history` (SUPPORT_VIEW_HISTORY)

| Property | Value |
|----------|-------|
| Enum Key | `SUPPORT_VIEW_HISTORY` |
| Value | `"support.view_history"` |
| Resource | `support` |
| Action | `view_history` |
| Category | `Support` |
| Group | `parent_default` |

### 6. `communication.submit_suggestion` (COMMUNICATION_SUBMIT_SUGGESTION)

| Property | Value |
|----------|-------|
| Enum Key | `COMMUNICATION_SUBMIT_SUGGESTION` |
| Value | `"communication.submit_suggestion"` |
| Resource | `communication` |
| Action | `submit_suggestion` |
| Category | `Communications` |
| Group | `parent_default` |

### 7. `system.dispatch_email` (SYSTEM_DISPATCH_EMAIL)

| Property | Value |
|----------|-------|
| Enum Key | `SYSTEM_DISPATCH_EMAIL` |
| Value | `"system.dispatch_email"` |
| Resource | `system` |
| Action | `dispatch_email` |
| Category | `System` |
| Group | `system_automated` |

---

## Migration SQL Requirements

A new migration file must:

1. **INSERT** 7 new permission rows into `permissions` table (with `ON CONFLICT (key) DO UPDATE`)
2. **INSERT** group_permissions for:
   - `super_admin`: `suggestions.list`, `suggestions.review`, `suggestions.delete`
   - `academy_admin`: `suggestions.list`, `suggestions.review`
   - `parent_default`: `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion`
   - `system_automated`: `system.dispatch_email`
3. **Also add** `complaints.list`, `complaints.delete`, `complaints.respond` to `academy_admin` if they should have complaint access (currently missing from academy_admin group)

---

## Admin Complaint Access Gap

**Finding:** The `academy_admin` group does NOT currently have any complaint permissions. The story spec says Admin should have suggestion access, but the existing complaint permissions are only on `super_admin`. This needs to be addressed:

- Add `complaints.list` to `academy_admin`
- Add `complaints.respond` to `academy_admin`
- `complaints.delete` remains Super Admin only (consistent with `suggestions.delete`)

---

## Service-Layer Migration Plan

The `SuggestionService` methods must be updated:

| Method | Current Permission | New Permission |
|--------|-------------------|----------------|
| `getAdminSuggestions()` | `COMPLAINTS_LIST` | `SUGGESTIONS_LIST` |
| `markSuggestionReviewed()` | `COMPLAINTS_LIST` | `SUGGESTIONS_REVIEW` |
| (new) `respondToSuggestion()` | — | `SUGGESTIONS_REVIEW` |
| (new) `markAsDuplicate()` | — | `SUGGESTIONS_REVIEW` |
| (new) `deleteSuggestion()` | — | `SUGGESTIONS_DELETE` |

---

## Summary

| # | Permission | Status | Action Required |
|---|-----------|--------|-----------------|
| 1 | `suggestions.list` | NEW | Add to enum + migration + groups |
| 2 | `suggestions.review` | NEW | Add to enum + migration + groups |
| 3 | `suggestions.delete` | NEW | Add to enum + migration + groups |
| 4 | `support.submit_complaint` | DEFERRED from S14 | Add to enum + migration + groups |
| 5 | `support.view_history` | DEFERRED from S14 | Add to enum + migration + groups |
| 6 | `communication.submit_suggestion` | DEFERRED from S14 | Add to enum + migration + groups |
| 7 | `system.dispatch_email` | DEFERRED from S14 | Add to enum + migration + groups |
| 8 | `complaints.list` for academy_admin | GAP | Add to academy_admin group |
| 9 | `complaints.respond` for academy_admin | GAP | Add to academy_admin group |
