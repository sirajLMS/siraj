## Section 2: RBAC Permissions (Canonical)

### 2.1 Prerequisites (from Story 14 — assumed executed)

These permissions MUST already exist from Story 14 execution:

| **Permission Key** | **Enum Value** | **Group** |
|---|---|---|
| `complaints.list` | `COMPLAINTS_LIST` | Super Admin, Admin |
| `complaints.delete` | `COMPLAINTS_DELETE` | Super Admin, Admin |
| `complaints.respond` | `COMPLAINTS_RESPOND` | Super Admin, Admin |
| `support.submit_complaint` | `SUPPORT_SUBMIT_COMPLAINT` | Parent |
| `support.view_history` | `SUPPORT_VIEW_HISTORY` | Parent |
| `communication.submit_suggestion` | `COMMUNICATION_SUBMIT_SUGGESTION` | Parent |
| `system.dispatch_email` | `SYSTEM_DISPATCH_EMAIL` | System Automated |

### 2.2 New Permissions (Story 15)

| **Permission Key** | **Enum Value** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Operation** |
|---|---|---|---|---|---|
| `suggestions.list` | `SUGGESTIONS_LIST` | Super Admin, Admin | `AdminSuggestionsContainer` visibility | `SuggestionService.getAdminSuggestions()` | `adminSuggestions` query |
| `suggestions.review` | `SUGGESTIONS_REVIEW` | Super Admin, Admin | Review/Respond/Duplicate buttons | `SuggestionService.markSuggestionReviewed()`, `respondToSuggestion()`, `markAsDuplicate()` | `markSuggestionReviewed`, `respondToSuggestion`, `markSuggestionDuplicate` mutations |
| `suggestions.delete` | `SUGGESTIONS_DELETE` | Super Admin only | Delete button in suggestion detail | `SuggestionService.deleteSuggestion()` | `deleteSuggestion` mutation |

### 2.3 Permission Migration from Story 14 Tech Debt

Story 14's `SuggestionService` reused `COMPLAINTS_LIST` for admin suggestion access. Story 15 MUST:

1. Create dedicated `suggestions.list`, `suggestions.review`, `suggestions.delete` permissions
2. Update `SuggestionService.getAdminSuggestions()` to check `SUGGESTIONS_LIST` instead of `COMPLAINTS_LIST`
3. Update `SuggestionService.markSuggestionReviewed()` to check `SUGGESTIONS_REVIEW` instead of `COMPLAINTS_LIST`
4. Update frontend permission checks in `AdminSuggestionsContainer` from `ComplaintsList`/`ComplaintsRespond` to `SuggestionsList`/`SuggestionsReview`

### 2.4 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** |
|---|---|---|
| Super Admin | `super_admin` | `suggestions.list`, `suggestions.review`, `suggestions.delete` |
| Admin | `academy_admin` | `suggestions.list`, `suggestions.review` |
| Parent | `parent_default` | None (parent accesses suggestions via `communication.submit_suggestion` from Story 14) |

### 2.5 Self-Scoping vs Any-Scoping

| **Permission** | **Parent (self-scoped)** | **Admin (any-scoped)** |
|---|---|---|
| `suggestions.list` | N/A — parents use `parentSuggestions` query (scoped by `parentId` from session) | Service returns all suggestions with filtering |
| `suggestions.review` | N/A | Service allows reviewing any suggestion |
| `suggestions.delete` | N/A | Service allows soft-deleting any suggestion |

### 2.6 Migration SQL Requirements

Add to `backend/db/migration/3-system_permissions_and_groups.sql`:

1. **Enum additions** (3 new `AppPermission` values in `shared/lib/enum.ts`):
   - `SUGGESTIONS_LIST = "suggestions.list"`
   - `SUGGESTIONS_REVIEW = "suggestions.review"`
   - `SUGGESTIONS_DELETE = "suggestions.delete"`

2. **Permission INSERTs** (3 new rows in `permissions` table with `ON CONFLICT (key) DO UPDATE`)

3. **Group assignment INSERTs**:
   - `super_admin`: add `suggestions.list`, `suggestions.review`, `suggestions.delete`
   - `academy_admin`: add `suggestions.list`, `suggestions.review`
