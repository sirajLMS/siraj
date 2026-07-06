## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/15.md` (Communication Infrastructure & Suggestion Management)
- **Prerequisite story:** `.ai/siraj_stories/14.md` (must be executed first — provides base permissions, complaint/suggestion schema, CommunicationService interface)
- **Story scope:** Implement real multi-channel communication delivery (Email via Resend, SMS via Twilio, Push via Firebase Cloud Messaging) using the provider/adapter/factory pattern, add complaint file attachments with configurable limits, and build full admin suggestion management (review, respond, duplicate tracking, soft-delete).
- **Target roles:** Admin (suggestion management), Super Admin (suggestion deletion), Parent (file attachments, suggestion history), System Automated (multi-channel dispatch).
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Real Email Delivery**: Replace the Story 14 `EmailChannel` stub with a production Resend integration. Emails are sent for complaint responses and suggestion acknowledgments. Delivery status is tracked via `notificationDeliveries`.
2. **SMS Notifications**: Add Twilio-based SMS delivery for urgent complaint responses, with rate limiting to prevent abuse.
3. **Push Notifications**: Add Firebase Cloud Messaging for cross-platform push (iOS, Android, Web) using the existing `userDeviceTokens` infrastructure.
4. **Provider Abstraction**: Each channel (email, SMS, push) follows the codebase's established **Interface + Adapter + Factory + Singleton** pattern (mirroring `StorageService`, `CacheService`, `RedisService`), allowing future provider swaps via `.env` configuration.
5. **Complaint File Attachments**: Parents can attach supporting documents (PDF, DOCX, images, text, markdown) to complaints, with size/count limits driven by system settings.
6. **Suggestion Management**: Admins can review, respond to, mark as duplicate (GitHub-style linking), and soft-delete suggestions. Parents can view their suggestion history with admin responses and duplicate links.

### 0.2 Scope Boundaries

**In scope:**
- Schema migration: `SuggestionStatus` enum, 6 new columns on `suggestions`, `ON_APP` channel, 4 new `NotificationEventType` values, 3 new `suggestions.*` permissions
- Provider/adapter/factory pattern for email (Resend), SMS (Twilio), push (FCM)
- Email/SMS template helpers
- `NotificationRepository` extensions (preferences, batch delivery, SMS rate limit)
- `SuggestionRepository` extensions (review, respond, duplicate, soft-delete, parent listing)
- `ComplaintRepository` file listing
- `SuggestionService` extensions (review, respond, duplicate, delete, parent history)
- `ComplaintService` file attachment handling
- `CommunicationService` multi-channel fan-out
- System settings seeder additions (`communication` category)
- GraphQL Pothos extensions (suggestion management + complaint files)
- Frontend: suggestion admin UI (detail dialog, action bar, response panel, duplicate search), parent suggestion history, complaint file upload
- i18n additions (EN + AR)

**Out of scope:**
- Additional email/SMS/push providers beyond Resend/Twilio/FCM (architecture supports them, but only one provider per channel is implemented)
- Webhook endpoints for delivery status callbacks (Resend/Twilio/FCM webhooks)
- Admin suggestion analytics dashboard
- Bulk suggestion operations
- Complaint file preview/rendering in browser
- Email template designer / visual editor
