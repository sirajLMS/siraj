## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/14.md` (Part 15: Permissions & Permission Groups — Complaints, Suggestions, and Communication Channels, timestamps 00:00 - 01:38)
- **Security baseline:** `.ai/done/service/13.md` (mandatory prerequisite)
- **Story scope:** Establish formal, tracked communication pipelines between parents and administration — complaint submission/response workflow, untracked suggestion feedback, and multi-channel communication service (on-app + email stub).
- **Target roles:** Admin (complaint queue management), Parent (submit complaints + suggestions), System Automated (email dispatch stub).
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Formal Complaint Tracking**: Parents submit complaints linked to specific students. These create tracked database entities with `Un-answered`/`Answered` status, visible in both parent history and admin queue.
2. **Untracked Suggestion Feedback**: Parents submit open-ended suggestions that are committed to the database but do not create formal tickets on the parent's dashboard — a one-way feedback pipeline.
3. **Administrative Triage**: Admins access a centralized complaint resolution queue with operational metrics, search, tab filtering, and the ability to respond and delete.
4. **Multi-Channel Communication**: A service interface supports on-app notifications (primary) and email dispatch (stubbed for future implementation), establishing the architecture for future communication channels.
5. **Separation of Duties**: Admin permissions (`complaints.list/respond/delete`) are strictly reserved — parents cannot access the admin queue or delete complaints.

### 0.2 Scope Boundaries

**In scope:**
- New permissions migration (4 new enum values + group assignments)
- Backend repositories: `ComplaintRepository`, `ComplaintResponseRepository`, `SuggestionRepository`
- Communication service with multi-channel interface (on-app + email stub)
- Domain services: `ComplaintService`, `SuggestionService`
- GraphQL Pothos objects, queries, and mutations
- Frontend Apollo TypedDocumentNode documents
- Type extraction from mock stores to generated GraphQL types
- Real Zustand stores replacing mock stores
- Container migration from mock data to `useQuery`
- Storybook migration to `MockedProvider`
- i18n additions (category labels, backend errors, notification keys)
- RBAC enforcement via `<RequirePermission>`

**Out of scope:**
- Real email sending infrastructure (deferred to follow-up story — email channel is stubbed)
- SMS or push notification channels
- Complaint file attachments (schema supports `complaintFiles` but UI integration deferred)
- Suggestion admin "mark reviewed" email dispatch
- Admin suggestion management permissions (story only defines parent submission)
