## Section 4: Security Threat Remediation

### Threat 1: IDOR — Cross-Parent Suggestion Access

**Current Gap:** `SuggestionService.getParentSuggestions()` does not exist yet.

**Fix in `SuggestionService.getParentSuggestions()`:**
- Resolve `parentId` from `actorUserId` via `ParentRepository.findByUserId()`
- Query suggestions scoped to that `parentId` only
- Parent cannot pass another parent's ID

**Test Requirements:**
- [ ] Parent A querying own suggestions → returns only Parent A's suggestions
- [ ] Parent A attempting to query Parent B's suggestions → `unauthorized` error
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 2: Unauthorized Suggestion Review/Response

**Current Gap:** No review/respond logic exists yet.

**Fix in `SuggestionService`:**
- `markSuggestionReviewed()`: Check `PermissionsService.hasPermission(actorUserId, SUGGESTIONS_REVIEW)`
- `respondToSuggestion()`: Check `SUGGESTIONS_REVIEW`
- `markAsDuplicate()`: Check `SUGGESTIONS_REVIEW`

**Test Requirements:**
- [ ] Admin with `suggestions.review` reviews any suggestion → succeeds
- [ ] Parent without `suggestions.review` attempts to review → `unauthorized` error
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 3: Unauthorized Suggestion Deletion

**Fix in `SuggestionService.deleteSuggestion()`:**
- Check `PermissionsService.hasPermission(actorUserId, SUGGESTIONS_DELETE)`
- Only Super Admin has this permission

**Test Requirements:**
- [ ] Super Admin deletes a suggestion → succeeds (soft-delete)
- [ ] Academy Admin without `suggestions.delete` attempts to delete → `unauthorized` error
- [ ] Parent → `unauthorized`

---

### Threat 4: Circular Duplicate References

**Fix in `SuggestionService.markAsDuplicate()`:**
- Validate `duplicateOfId !== suggestionId` (no self-reference)
- Validate target is NOT already `DUPLICATE` (no chaining)
- Validate target is NOT soft-deleted
- Validate no circular reference (target's `duplicateOfId` does not point back)

**Test Requirements:**
- [ ] Mark suggestion as duplicate of itself → `validation` error
- [ ] Mark suggestion as duplicate of a DUPLICATE suggestion → `validation` error
- [ ] Mark suggestion as duplicate of a soft-deleted suggestion → `notFound` error
- [ ] Create A→B, then try B→A → `validation` error (circular)
- [ ] Valid duplicate (A→B where B is PENDING/REVIEWED) → succeeds

---

### Threat 5: Provider Credential Leakage

**Fix:**
- All provider credentials (`RESEND_API_KEY`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `FIREBASE_PRIVATE_KEY`, etc.) read from env vars ONLY
- Never logged, never included in error messages
- Factory initialization catches errors and logs generic messages (not credential values)

**Test Requirements:**
- [ ] Grep codebase for hardcoded credentials → zero matches
- [ ] Provider initialization error → logs generic error, does NOT log credential values

---

### Threat 6: SMS Rate Limit Bypass

**Fix in `SmsChannel.send()`:**
- Check `NotificationRepository.getSmsCountInLastHour(userId)` before sending
- If count >= `sms_rate_limit_per_hour` system setting, skip delivery and log warning
- Rate limit is per-user, not global

**Test Requirements:**
- [ ] Send 3 SMS within 1 hour → all succeed (default limit = 3)
- [ ] Send 4th SMS within 1 hour → skipped, warning logged
- [ ] After 1 hour passes → next SMS succeeds

---

### Threat 7: File Upload Abuse (Complaint Attachments)

**Fix in `ComplaintService.submitComplaint()`:**
- Validate file count <= `complaint_max_files_per_complaint` system setting
- Validate each file size <= `complaint_max_file_size_mb` system setting
- Validate file MIME type against allowed list
- Files registered via `StorageRepository.registerFileUsage()` only after all validations pass

**Test Requirements:**
- [ ] Upload 5 files (within limit) → succeeds
- [ ] Upload 6 files (over limit) → `validation` error
- [ ] Upload file over size limit → `validation` error
- [ ] Upload disallowed file type → `validation` error

---

### Threat 8: Notification Preference Bypass

**Fix in channel implementations:**
- Before dispatching, check `NotificationRepository.getPreference(userId, channel, eventType)`
- If preference exists and `enabled = false`, skip delivery
- If no preference exists, default to enabled (opt-out model)

**Test Requirements:**
- [ ] User with `enabled = true` preference → receives notification
- [ ] User with `enabled = false` preference → notification skipped
- [ ] User with no preference row → receives notification (default enabled)
