# M8 — User Decision Log

> Consolidated log of all user-confirmed decisions for Story 15.

---

## Decision Registry

| # | Meta Task | Decision | User Choice | Rationale | Affected Tasks |
|---|---|---|---|---|---|
| 1 | Pre-plan | Email provider | **Resend** | Modern, developer-friendly, popular in Next.js ecosystem | Task C |
| 2 | Pre-plan | SMS provider | **Twilio** | Industry standard, reliable, good docs | Task C |
| 3 | Pre-plan | Push platform | **Firebase Cloud Messaging** | Free, cross-platform, industry standard | Task C |
| 4 | Pre-plan | Complaint file types | **Wide variety** (docx, pdf, images, text, markdown) with max size from system settings | Configurable via `complaint_max_file_size_mb` setting | Tasks D, L |
| 5 | Pre-plan | Admin suggestion actions | **Mark reviewed + respond + mark duplicate + delete** | GitHub-style duplicate linking with search, link visible to parent and admins | Tasks B, D, F, L |
| 6 | M2 | Story 14 permissions | **Assume Story 14 executed first** | Only add 3 new `suggestions.*` permissions in Story 15 | Task A |
| 7 | M1 | Suggestion deletion | **Soft-delete** (add `deletedAt` column) | Consistent with complaints pattern, allows recovery and audit | Task A |
| 8 | M6 | Parent suggestion history | **Yes, add history section** | Parents can see past suggestions, admin responses, duplicate links | Tasks F, G, K, L |
| 9 | M4 | ON_APP channel | **Yes, add to enum** | Required for in-app notifications from Story 14 | Task A |
| 10 | M5 | System settings category | **New `communication` category** | None of existing categories (security, system, scheduling) are appropriate | Task M |

---

## Decision Details

### D1-D3: Communication Providers
- **Email**: Resend — `resend` npm package, env vars `RESEND_API_KEY`, `RESEND_FROM_EMAIL`
- **SMS**: Twilio — `twilio` npm package, env vars `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`
- **Push**: FCM — `firebase-admin` npm package, env vars `FIREBASE_PROJECT_ID`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL`

### D4: Complaint File Attachments
- File types: PDF, DOCX, DOC, TXT, MD, PNG, JPG, JPEG, GIF, WEBP
- Max size: `complaint_max_file_size_mb` system setting (default: 25MB)
- Max files: `complaint_max_files_per_complaint` system setting (default: 5)
- Frontend: Multi-file dropzone adapted from `ResourceUploadDropzone`
- Backend: `ComplaintService` validates count/size, calls `StorageRepository.registerFileUsage()`

### D5: Admin Suggestion Management
- **Mark Reviewed**: Sets status=REVIEWED, records reviewer+timestamp
- **Respond**: Adds admin response text visible to parent
- **Mark Duplicate**: Sets status=DUPLICATE, links to original via `duplicateOfId` self-FK
  - Search modal with Autocomplete to find original
  - GitHub-style duplicate badge with link to original
  - Both parent and admins can see the duplicate link
- **Delete**: Soft-delete (sets `deletedAt`), requires `suggestions.delete` (Super Admin only)

### D6: Permission Scope
- Story 14 permissions assumed to exist (not re-added)
- 3 new permissions: `suggestions.list`, `suggestions.review`, `suggestions.delete`
- `SuggestionService` updated from `COMPLAINTS_LIST` to dedicated permissions

### D7: Suggestion Schema Changes
- 5 new columns: `status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`
- 1 soft-delete column: `deletedAt`
- New enum: `SuggestionStatus` (PENDING, REVIEWED, DUPLICATE)
- 4 new indexes: status, duplicateOfId, reviewedByUserId, deletedAt
- Self-referencing FK for duplicate tracking

### D8: Parent Suggestion History
- New "My Suggestions" section below submit form
- Shows: suggestion text, status badge, admin response, duplicate link
- Pattern: follows `ComplaintRecordCardList` approach
- New GraphQL query: `parentSuggestions`
- New component: `ParentSuggestionRecordCardList`

### D9: NotificationChannel Enum
- Add `ON_APP = "ON_APP"` to `NotificationChannel` enum
- Required for Story 14's on-app channel implementation
- Migration: `ALTER TYPE notification_channel ADD VALUE 'ON_APP'`

### D10: System Settings Category
- New category: `communication`
- Keys: `complaint_max_file_size_mb` (25), `complaint_max_files_per_complaint` (5), `sms_rate_limit_per_hour` (3)
- Seeder type union extended: `"security" | "system" | "scheduling" | "communication"`
