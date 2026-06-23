## Section 4: Security Threat Remediation

### Threat 1: IDOR — Cross-Parent Complaint Access

**Current Gap:** No repository exists yet, so no IDOR protection is in place.

**Fix in `complaint.repository.ts`:**
- `getComplaintsByParent(parentId, actorUserId)` — The service layer resolves `parentId` from the authenticated user's parent record. The repository filters by `parentId` only.
- `ComplaintService.getParentComplaints()` — Calls `ParentRepository.findByUserId(actorUserId)` to resolve the actor's `parentId`, then queries complaints scoped to that parent. A parent cannot pass another parent's ID.

**Test Requirements:**
- [ ] Parent A querying with Parent A's ID → returns only Parent A's complaints
- [ ] Parent A attempting to query Parent B's complaints → `unauthorized` error
- [ ] Admin with `complaints.list` querying any parent's complaints → succeeds
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 2: IDOR — Cross-Parent Complaint Submission

**Current Gap:** No submission logic exists yet.

**Fix in `ComplaintService.submitComplaint()`:**
- The service resolves `parentId` from `actorUserId` via `ParentRepository.findByUserId()`. The parent cannot specify an arbitrary `parentId` in the input — it is always derived from the authenticated session.
- `studentId` is validated to belong to the resolved `parentId` (student's `parentId` must match the actor's parent record).

**Test Requirements:**
- [ ] Parent submits complaint with own student → succeeds
- [ ] Parent submits complaint with another parent's student → `unauthorized` error
- [ ] Parent submits complaint without student (null `studentId`) → succeeds (student is optional)
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 3: Unauthorized Complaint Response

**Current Gap:** No response logic exists yet.

**Fix in `ComplaintService.respondToComplaint()`:**
- Service checks `PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_RESPOND)` before allowing response.
- Only users with `complaints.respond` can submit responses. Parents cannot respond to their own complaints.

**Test Requirements:**
- [ ] Admin with `complaints.respond` responds to any complaint → succeeds
- [ ] Parent without `complaints.respond` attempts to respond → `unauthorized` error
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 4: Unauthorized Complaint Deletion

**Current Gap:** Soft-delete exists via `SoftDeleteRepository.softDeleteComplaint()` but has no service-level permission gate.

**Fix in `ComplaintService.deleteComplaint()`:**
- Service checks `PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_DELETE)` before calling `SoftDeleteRepository.softDeleteComplaint()`.
- Only users with `complaints.delete` can delete complaints.

**Test Requirements:**
- [ ] Admin with `complaints.delete` deletes a complaint → succeeds (soft-delete)
- [ ] Parent without `complaints.delete` attempts to delete → `unauthorized` error
- [ ] Admin deletes already-deleted complaint → `activeRecordNotFound` error
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 5: Unauthorized Suggestion Access (Admin Listing)

**Current Gap:** No suggestion admin listing exists yet.

**Fix in `SuggestionService.getAdminSuggestions()`:**
- Service checks `PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST)` before returning suggestions. (Reuses admin complaint permission since admin suggestion management is in scope of admin dashboard access.)
- Parents cannot access the admin suggestion listing.

**Test Requirements:**
- [ ] Admin with `complaints.list` views suggestion listing → succeeds
- [ ] Parent without `complaints.list` attempts to view → `unauthorized` error
- [ ] Unauthenticated user → `unauthorized`

---

### Threat 6: Email Channel Stub Security

**Current Gap:** Email channel is stubbed — no actual email is sent.

**Mitigation:**
- The `EmailChannel` stub logs a warning via `logger.warn("Email channel stubbed — no email sent")` so the gap is visible in logs.
- The `emailSent` boolean and `emailSentAt` timestamp are still set correctly in the database, maintaining data model integrity.
- The `system.dispatch_email` permission gates the email channel dispatch, so when a real email service is implemented, the permission infrastructure is already in place.

**Test Requirements:**
- [ ] Complaint response with email flag → `emailSent: true` set in DB, no actual email sent
- [ ] Suggestion submission → `emailSentAt` set in DB, no actual email sent
- [ ] Warning logged for each stubbed email dispatch
