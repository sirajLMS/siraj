## Section 2: RBAC Permissions (Canonical)

### 2.1 Existing Permissions (Reused — Add to Academy Admin Group)

These permissions already exist in `shared/lib/enum.ts` and the migration SQL. They need to be **assigned to the Academy Admin group** in the migration.

| **Permission Key** | **Enum Value** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Operation** |
|---|---|---|---|---|---|
| `complaints.list` | `COMPLAINTS_LIST` | Academy Admin | `AdminComplaintsContainer` visibility | `ComplaintService.getAdminQueue()` | `adminComplaintQueue` query |
| `complaints.delete` | `COMPLAINTS_DELETE` | Academy Admin | Delete button in `ComplaintQueueCard` | `ComplaintService.deleteComplaint()` | `deleteComplaint` mutation |
| `complaints.respond` | `COMPLAINTS_RESPOND` | Academy Admin | Response form in `ComplaintQueueCard` | `ComplaintService.respondToComplaint()` | `respondToComplaint` mutation |

### 2.2 New Permissions (Add to Enum + Migration + Group Assignments)

| **Permission Key** | **Enum Value** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Operation** |
|---|---|---|---|---|---|
| `support.submit_complaint` | `SUPPORT_SUBMIT_COMPLAINT` | Parent Default | `ParentComplaintsContainer` visibility | `ComplaintService.submitComplaint()` | `submitComplaint` mutation |
| `support.view_history` | `SUPPORT_VIEW_HISTORY` | Parent Default | Complaint record cards in parent view | `ComplaintService.getParentComplaints()` | `parentComplaints` query |
| `communication.submit_suggestion` | `COMMUNICATION_SUBMIT_SUGGESTION` | Parent Default | `ParentSuggestionsContainer` visibility | `SuggestionService.submitSuggestion()` | `submitSuggestion` mutation |
| `system.dispatch_email` | `SYSTEM_DISPATCH_EMAIL` | System Automated | N/A (background process) | `CommunicationService.send()` via `EmailChannel` | N/A (internal) |

### 2.3 Permission Mapping to Existing Permissions

| **Story Permission** | **Existing Related Permission** | **Relationship** |
|---|---|---|
| `support.submit_complaint` | `complaints.list` | Complementary — parent submits, admin lists all |
| `support.view_history` | `complaints.list` | Self-scoped vs any-scoped — parent sees own, admin sees all |
| `communication.submit_suggestion` | None | New domain — no existing equivalent |
| `system.dispatch_email` | None | System-only — no UI gate |

### 2.4 Permission Group Assignments

| **Permission Group** | **Slug** | **New Permissions Assigned** | **Existing Permissions Added** |
|---|---|---|---|
| Super Admin | `super_admin` | `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion`, `system.dispatch_email` | `complaints.list`, `complaints.delete`, `complaints.respond` (already assigned) |
| Academy Admin | `academy_admin` | None | `complaints.list`, `complaints.delete`, `complaints.respond` (add to group) |
| Parent Default | `parent_default` | `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion` | None |
| System Automated | `system_automated` | `system.dispatch_email` | None |

### 2.5 Self-Scoping vs Any-Scoping

| **Permission** | **Parent (self-scoped)** | **Admin (any-scoped)** |
|---|---|---|
| `support.view_history` | Service enforces `parentId === actorParentId`. Only own complaints visible. | N/A — admin uses `complaints.list` which returns all |
| `support.submit_complaint` | Service resolves `parentId` from authenticated user. Parent cannot submit on behalf of another parent. | N/A |
| `complaints.list` | N/A — parents don't have this permission | Service returns all complaints (no scoping filter) |
| `complaints.respond` | N/A | Service allows responding to any complaint |
| `complaints.delete` | N/A | Service allows deleting any complaint |

### 2.6 Migration SQL Requirements

Add to `backend/db/migration/3-system_permissions_and_groups.sql`:

1. **Enum additions** (4 new `AppPermission` values in `shared/lib/enum.ts`):
   - `SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint"`
   - `SUPPORT_VIEW_HISTORY = "support.view_history"`
   - `COMMUNICATION_SUBMIT_SUGGESTION = "communication.submit_suggestion"`
   - `SYSTEM_DISPATCH_EMAIL = "system.dispatch_email"`

2. **Permission INSERTs** (4 new rows in `permissions` table)

3. **Group assignment INSERTs**:
   - Academy Admin: add `complaints.list`, `complaints.delete`, `complaints.respond`
   - Parent Default: add `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion`
   - System Automated: add `system.dispatch_email`
   - Super Admin: add all 4 new permissions (if not already covered by superset)
