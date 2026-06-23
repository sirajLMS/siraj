### Task C — Services: Communication, Complaint, and Suggestion

---

#### Objective

Create 5 new service files in `backend/services/communication/` that implement the business logic layer for the complaints, suggestions, and communication channels feature. The `CommunicationService` provides a channel-dispatch interface, `OnAppChannel` creates `notificationDeliveries` records, `EmailChannel` is a stub, `ComplaintService` handles complaint submission/response/admin queue/deletion, and `SuggestionService` handles suggestion submission/admin listing/review.

---

#### Dependencies

- **Task B** — Repositories: `ComplaintRepository`, `ComplaintResponseRepository`, `SuggestionRepository` must be completed before this task.

---

#### Layer-Specific Rules

- **Domain-Driven Architecture**: Service layers must be constructed per domain of concern.
- **NO Monolithic Services**: Do not create generic, monolithic services.
- **Business Logic Hub**: This layer contains all business rules, orchestration, and permission gating before calling the repository layer.
- **SSR Compatible**: Services can be used directly by Next.js Server Components or Server Actions — no browser-only APIs.
- **i18n**: All user-facing error messages must use `getBackendTranslations` with optional `locale?: string` parameter. Hardcoded strings for exceptions are forbidden.
- **🚫 Services MUST NOT import from DB/Drizzle** — only from `backend/db/repo/`.

---

#### Target Files

| # | File | Status |
|---|------|--------|
| 1 | `backend/services/communication/communication.service.ts` | NEW |
| 2 | `backend/services/communication/channels/on-app.channel.ts` | NEW |
| 3 | `backend/services/communication/channels/email.channel.ts` | NEW |
| 4 | `backend/services/communication/complaint.service.ts` | NEW |
| 5 | `backend/services/communication/suggestion.service.ts` | NEW |

---

#### Prerequisites — Enum Extensions

The following enum values **must** exist in `shared/lib/enum.ts` before implementing this task. If they are not yet present, add them to the `AppPermission` enum:

```typescript
SUPPORT_SUBMIT_COMPLAINT = "support.submit_complaint",
SUPPORT_VIEW_HISTORY = "support.view_history",
COMMUNICATION_SUBMIT_SUGGESTION = "communication.submit_suggestion",
```

And add to `NotificationEventType`:

```typescript
NEW_COMPLAINT = "NEW_COMPLAINT",
NEW_SUGGESTION = "NEW_SUGGESTION",
```

And add to `NotificationChannel`:

```typescript
ON_APP = "ON_APP",
```

> **Note**: The `notificationChannelEnum` in `backend/db/schema/enums.ts` must also be regenerated to include `ON_APP`. Coordinate with the DB schema migration task if needed.

---

#### Detailed Implementation Steps

---

##### Step 1 — Create `backend/services/communication/communication.service.ts`

This file defines the `CommunicationPayload` interface and the `CommunicationService` namespace with a `dispatch` function that routes to the appropriate channel implementation.

```typescript
import { logger } from "@/backend/lib/logger";
import { EmailChannel } from "@/backend/services/communication/channels/email.channel";
import { OnAppChannel } from "@/backend/services/communication/channels/on-app.channel";
import type { NotificationEventType } from "@/shared/lib/enum";

export interface CommunicationPayload {
  readonly userId: string;
  readonly title: string;
  readonly body: string | null;
  readonly channel: "on_app" | "email";
  readonly eventType: NotificationEventType;
}

export namespace CommunicationService {
  export async function dispatch(payload: CommunicationPayload, locale?: string): Promise<void> {
    try {
      switch (payload.channel) {
        case "on_app":
          await OnAppChannel.send(payload, locale);
          break;
        case "email":
          await EmailChannel.send(payload, locale);
          break;
        default: {
          const exhaustiveCheck: never = payload.channel;
          logger.error("Unknown communication channel", { channel: exhaustiveCheck, userId: payload.userId });
          break;
        }
      }
    } catch (error) {
      logger.error("CommunicationService.dispatch failed", {
        userId: payload.userId,
        channel: payload.channel,
        eventType: payload.eventType,
        error,
      });
      throw error;
    }
  }
}
```

**Key points:**
- `CommunicationPayload` uses `"on_app" | "email"` as the channel discriminator — this is a service-level abstraction, not the DB enum.
- `dispatch` routes to the correct channel implementation via a `switch` statement.
- The `default` branch uses a `never` exhaustive check for compile-time safety.
- Errors are logged and re-thrown so callers can decide how to handle delivery failures.

---

##### Step 2 — Create `backend/services/communication/channels/on-app.channel.ts`

This channel creates a `notificationDeliveries` record via `NotificationRepository.createDelivery()`.

```typescript
import { NotificationRepository } from "@/backend/db/repo";
import { logger } from "@/backend/lib/logger";
import type { CommunicationPayload } from "@/backend/services/communication/communication.service";
import { NotificationChannel } from "@/shared/lib/enum";

export namespace OnAppChannel {
  export async function send(payload: CommunicationPayload, _locale?: string): Promise<void> {
    try {
      await NotificationRepository.createDelivery({
        userId: payload.userId,
        channel: NotificationChannel.ON_APP,
        eventType: payload.eventType,
        title: payload.title,
        body: payload.body,
      });

      logger.info("On-app notification delivery created", {
        userId: payload.userId,
        eventType: payload.eventType,
        title: payload.title,
      });
    } catch (error) {
      logger.error("OnAppChannel.send failed", {
        userId: payload.userId,
        eventType: payload.eventType,
        error,
      });
      throw error;
    }
  }
}
```

**Key points:**
- Maps the service-level `"on_app"` channel to `NotificationChannel.ON_APP` for the DB record.
- Uses `NotificationRepository.createDelivery()` which sets `status=PENDING` by default.
- Does **not** import from `drizzle-orm` or schema files — only from `backend/db/repo/`.
- The `_locale` parameter is accepted for interface consistency but not used in this channel.

---

##### Step 3 — Create `backend/services/communication/channels/email.channel.ts`

This is a **stub** implementation. It does NOT send actual emails. It logs a warning and returns void.

```typescript
import { logger } from "@/backend/lib/logger";
import type { CommunicationPayload } from "@/backend/services/communication/communication.service";

export namespace EmailChannel {
  export async function send(payload: CommunicationPayload, _locale?: string): Promise<void> {
    logger.warn("Email channel stubbed — no email sent", {
      userId: payload.userId,
      eventType: payload.eventType,
    });
  }
}
```

**Key points:**
- **No actual email sending** — this is a stub for Sprint 14.
- Logs a `warn`-level message so the stub is visible in logs during development.
- The caller (e.g., `ComplaintService.respondToComplaint`) is responsible for setting `emailSent`/`emailSentAt` on the entity after dispatch returns.
- The `_locale` parameter is accepted for interface consistency but not used.

---

##### Step 4 — Create `backend/services/communication/complaint.service.ts`

This is the main business logic service for complaints. It contains 5 methods: `submitComplaint`, `getParentComplaints`, `getAdminQueue`, `respondToComplaint`, and `deleteComplaint`.

```typescript
import {
  ComplaintRepository,
  ComplaintResponseRepository,
  ParentRepository,
  SoftDeleteRepository,
} from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

export interface SubmitComplaintInput {
  readonly studentId?: string | null;
  readonly category: string;
  readonly body: string;
  readonly submitterEmail: string;
}

export interface ComplaintWithResponses {
  readonly id: string;
  readonly parentId: string;
  readonly studentId: string | null;
  readonly category: string;
  readonly submitterEmail: string;
  readonly body: string;
  readonly status: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly responses: ReadonlyArray<{
    readonly id: string;
    readonly complaintId: string;
    readonly responderUserId: string | null;
    readonly body: string;
    readonly emailSent: boolean;
    readonly createdAt: Date;
  }>;
}

export interface AdminQueueOptions {
  readonly limit: number;
  readonly offset: number;
  readonly statusFilter?: string | null;
}

export interface AdminQueueResult {
  readonly complaints: ReadonlyArray<{
    readonly id: string;
    readonly parentId: string;
    readonly studentId: string | null;
    readonly category: string;
    readonly submitterEmail: string;
    readonly body: string;
    readonly status: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  }>;
  readonly totalCount: number;
  readonly unansweredCount: number;
  readonly answeredCount: number;
}

export interface RespondToComplaintResult {
  readonly id: string;
  readonly complaintId: string;
  readonly responderUserId: string | null;
  readonly body: string;
  readonly emailSent: boolean;
  readonly createdAt: Date;
}

export namespace ComplaintService {
  export async function submitComplaint(
    actorUserId: string,
    input: SubmitComplaintInput,
    locale?: string
  ): Promise<{
    readonly id: string;
    readonly parentId: string;
    readonly studentId: string | null;
    readonly category: string;
    readonly submitterEmail: string;
    readonly body: string;
    readonly status: string;
    readonly createdAt: Date;
  }> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUPPORT_SUBMIT_COMPLAINT
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    if (input.studentId) {
      const student = await ParentRepository.getAssociatedStudentById(input.studentId);
      if (!student) {
        const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(tFunc("studentNotFound", { id: input.studentId }));
      }
    }

    try {
      const created = await ComplaintRepository.submitComplaint(
        {
          parentId: parent.id,
          studentId: input.studentId ?? null,
          category: input.category,
          submitterEmail: input.submitterEmail,
          body: input.body,
        },
        undefined,
        locale
      );

      logger.info("Complaint submitted", {
        actorUserId,
        complaintId: created.id,
        parentId: parent.id,
        category: input.category,
      });

      return {
        id: created.id,
        parentId: created.parentId,
        studentId: created.studentId ?? null,
        category: created.category,
        submitterEmail: created.submitterEmail,
        body: created.body,
        status: created.status,
        createdAt: created.createdAt,
      };
    } catch (error) {
      logger.error("Failed to submit complaint", { actorUserId, error });
      throw error;
    }
  }

  export async function getParentComplaints(
    actorUserId: string,
    locale?: string
  ): Promise<ComplaintWithResponses[]> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUPPORT_VIEW_HISTORY
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    try {
      const complaints = await ComplaintRepository.getComplaintsByParent(parent.id);

      const results: ComplaintWithResponses[] = [];
      for (const complaint of complaints) {
        const responses = await ComplaintResponseRepository.getResponsesByComplaint(complaint.id);
        results.push({
          id: complaint.id,
          parentId: complaint.parentId,
          studentId: complaint.studentId ?? null,
          category: complaint.category,
          submitterEmail: complaint.submitterEmail,
          body: complaint.body,
          status: complaint.status,
          createdAt: complaint.createdAt,
          updatedAt: complaint.updatedAt,
          responses: responses.map(r => ({
            id: r.id,
            complaintId: r.complaintId,
            responderUserId: r.responderUserId ?? null,
            body: r.body,
            emailSent: r.emailSent,
            createdAt: r.createdAt,
          })),
        });
      }

      return results;
    } catch (error) {
      logger.error("Failed to get parent complaints", { actorUserId, parentId: parent.id, error });
      throw error;
    }
  }

  export async function getAdminQueue(
    actorUserId: string,
    options: AdminQueueOptions,
    locale?: string
  ): Promise<AdminQueueResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_LIST
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await ComplaintRepository.getAdminComplaintQueue({
        limit: options.limit,
        offset: options.offset,
        statusFilter: options.statusFilter ?? null,
      });

      return {
        complaints: result.complaints.map(c => ({
          id: c.id,
          parentId: c.parentId,
          studentId: c.studentId ?? null,
          category: c.category,
          submitterEmail: c.submitterEmail,
          body: c.body,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
        totalCount: result.totalCount,
        unansweredCount: result.unansweredCount,
        answeredCount: result.answeredCount,
      };
    } catch (error) {
      logger.error("Failed to get admin complaint queue", { actorUserId, options, error });
      throw error;
    }
  }

  export async function respondToComplaint(
    actorUserId: string,
    complaintId: string,
    body: string,
    sendEmail: boolean,
    locale?: string
  ): Promise<RespondToComplaintResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_RESPOND
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const complaint = await ComplaintRepository.getComplaintById(complaintId);
    if (!complaint) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("complaintNotFound", { id: complaintId }));
    }

    try {
      const response = await ComplaintResponseRepository.createResponse(
        {
          complaintId,
          responderUserId: actorUserId,
          body,
          emailSent: sendEmail,
        },
        undefined,
        locale
      );

      if (sendEmail) {
        await CommunicationService.dispatch(
          {
            userId: actorUserId,
            title: "Complaint Response",
            body: response.body,
            channel: "email",
            eventType: NotificationEventType.COMPLAINT_RESPONSE,
          },
          locale
        );
      }

      const parent = await ParentRepository.findByUserId(complaint.parentId);
      const notificationUserId = parent?.userId ?? actorUserId;

      await CommunicationService.dispatch(
        {
          userId: notificationUserId,
          title: "Complaint Response",
          body: response.body,
          channel: "on_app",
          eventType: NotificationEventType.COMPLAINT_RESPONSE,
        },
        locale
      );

      logger.info("Complaint response created", {
        actorUserId,
        complaintId,
        responseId: response.id,
        sendEmail,
      });

      return {
        id: response.id,
        complaintId: response.complaintId,
        responderUserId: response.responderUserId ?? null,
        body: response.body,
        emailSent: response.emailSent,
        createdAt: response.createdAt,
      };
    } catch (error) {
      logger.error("Failed to respond to complaint", { actorUserId, complaintId, error });
      throw error;
    }
  }

  export async function deleteComplaint(
    actorUserId: string,
    complaintId: string,
    locale?: string
  ): Promise<{ readonly deletedAt: string }> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_DELETE
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await SoftDeleteRepository.softDeleteComplaint(complaintId, actorUserId);

      logger.info("Complaint soft-deleted", {
        actorUserId,
        complaintId,
        deletedAt: result.deletedAt,
      });

      return {
        deletedAt: result.deletedAt.toISOString(),
      };
    } catch (error) {
      logger.error("Failed to delete complaint", { actorUserId, complaintId, error });
      throw error;
    }
  }
}
```

**Key points:**
- All 5 methods gate on the appropriate `AppPermission` before proceeding.
- `submitComplaint` resolves `parentId` from `actorUserId` via `ParentRepository.findByUserId()` and validates `studentId` ownership.
- `getParentComplaints` fetches complaints and enriches each with its responses.
- `respondToComplaint` dispatches to both email (stub) and on_app channels.
- `deleteComplaint` delegates to `SoftDeleteRepository.softDeleteComplaint()`.
- No direct DB/Drizzle imports — all data access goes through repositories.

---

##### Step 5 — Create `backend/services/communication/suggestion.service.ts`

This service handles suggestion submission, admin listing, and marking suggestions as reviewed.

```typescript
import { ParentRepository, SuggestionRepository } from "@/backend/db/repo";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, NotificationEventType } from "@/shared/lib/enum";

export interface SubmitSuggestionInput {
  readonly submitterName: string;
  readonly body: string;
}

export interface SuggestionResult {
  readonly id: string;
  readonly parentId: string;
  readonly submitterName: string;
  readonly body: string;
  readonly emailSentAt: Date | null;
  readonly createdAt: Date;
}

export interface AdminSuggestionOptions {
  readonly limit: number;
  readonly offset: number;
}

export interface AdminSuggestionsResult {
  readonly suggestions: ReadonlyArray<SuggestionResult>;
  readonly totalCount: number;
  readonly reviewedCount: number;
  readonly pendingCount: number;
}

export namespace SuggestionService {
  export async function submitSuggestion(
    actorUserId: string,
    input: SubmitSuggestionInput,
    locale?: string
  ): Promise<SuggestionResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMMUNICATION_SUBMIT_SUGGESTION
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    const parent = await ParentRepository.findByUserId(actorUserId);
    if (!parent) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("parentNotFound", { userId: actorUserId }));
    }

    try {
      const created = await SuggestionRepository.submitSuggestion(
        {
          parentId: parent.id,
          submitterName: input.submitterName,
          body: input.body,
        },
        undefined,
        locale
      );

      await CommunicationService.dispatch(
        {
          userId: actorUserId,
          title: "New Suggestion Submitted",
          body: created.body,
          channel: "email",
          eventType: NotificationEventType.NEW_SUGGESTION,
        },
        locale
      );

      logger.info("Suggestion submitted", {
        actorUserId,
        suggestionId: created.id,
        parentId: parent.id,
      });

      return {
        id: created.id,
        parentId: created.parentId,
        submitterName: created.submitterName,
        body: created.body,
        emailSentAt: created.emailSentAt ?? null,
        createdAt: created.createdAt,
      };
    } catch (error) {
      logger.error("Failed to submit suggestion", { actorUserId, error });
      throw error;
    }
  }

  export async function getAdminSuggestions(
    actorUserId: string,
    options: AdminSuggestionOptions,
    locale?: string
  ): Promise<AdminSuggestionsResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_LIST
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const result = await SuggestionRepository.getSuggestionsForAdmin({
        limit: options.limit,
        offset: options.offset,
      });

      return {
        suggestions: result.suggestions.map(s => ({
          id: s.id,
          parentId: s.parentId,
          submitterName: s.submitterName,
          body: s.body,
          emailSentAt: s.emailSentAt ?? null,
          createdAt: s.createdAt,
        })),
        totalCount: result.totalCount,
        reviewedCount: result.reviewedCount,
        pendingCount: result.pendingCount,
      };
    } catch (error) {
      logger.error("Failed to get admin suggestions", { actorUserId, options, error });
      throw error;
    }
  }

  export async function markSuggestionReviewed(
    actorUserId: string,
    suggestionId: string,
    locale?: string
  ): Promise<SuggestionResult> {
    const hasPermission = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.COMPLAINTS_LIST
    );
    if (!hasPermission) {
      const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(tFunc("insufficientPermissions"));
    }

    try {
      const updated = await SuggestionRepository.markSuggestionReviewed(suggestionId, undefined, locale);

      logger.info("Suggestion marked as reviewed", {
        actorUserId,
        suggestionId: updated.id,
      });

      return {
        id: updated.id,
        parentId: updated.parentId,
        submitterName: updated.submitterName,
        body: updated.body,
        emailSentAt: updated.emailSentAt ?? null,
        createdAt: updated.createdAt,
      };
    } catch (error) {
      logger.error("Failed to mark suggestion as reviewed", { actorUserId, suggestionId, error });
      throw error;
    }
  }
}
```

**Key points:**
- `submitSuggestion` resolves `parentId` from `actorUserId`, creates the suggestion, and dispatches a stub email to the admin inbox.
- `getAdminSuggestions` reuses `AppPermission.COMPLAINTS_LIST` for admin access control.
- `markSuggestionReviewed` also reuses `AppPermission.COMPLAINTS_LIST`.
- All methods use `getBackendTranslations` for i18n error messages.
- No direct DB/Drizzle imports.

---

#### File Creation Order

Execute the steps in this exact order to satisfy incremental type-checking:

1. `backend/services/communication/channels/email.channel.ts` — no internal dependencies
2. `backend/services/communication/channels/on-app.channel.ts` — depends on `NotificationRepository` (existing)
3. `backend/services/communication/communication.service.ts` — depends on both channel files
4. `backend/services/communication/complaint.service.ts` — depends on `communication.service.ts`
5. `backend/services/communication/suggestion.service.ts` — depends on `communication.service.ts`

After creating each file, run the Quality Gate — Per-File Validation checklist before proceeding to the next file.

---

#### Test Execution Requirements

After completing all 5 files, run the following test suites to verify correctness:

```bash
bun run test:db
```

This executes all database repository and logic tests in `backend/db/test/`. Ensure no regressions in existing tests.

If integration tests exist for the communication domain:

```bash
bun run test:graphql
```

---

#### Success Criteria

- [ ] All 5 service files created in `backend/services/communication/`
- [ ] `CommunicationService.dispatch()` correctly routes to `OnAppChannel` and `EmailChannel`
- [ ] `OnAppChannel` creates `notificationDeliveries` records via `NotificationRepository.createDelivery()`
- [ ] `EmailChannel` logs a warning and returns void without sending emails
- [ ] `ComplaintService` implements all 5 methods: `submitComplaint`, `getParentComplaints`, `getAdminQueue`, `respondToComplaint`, `deleteComplaint`
- [ ] `SuggestionService` implements all 3 methods: `submitSuggestion`, `getAdminSuggestions`, `markSuggestionReviewed`
- [ ] All permission checks use `PermissionsService.hasPermission()` with correct `AppPermission` keys
- [ ] All error messages use `getBackendTranslations` — no hardcoded strings
- [ ] No service file imports from `drizzle-orm` or `backend/db/schema` — only from `backend/db/repo/`
- [ ] `respondToComplaint` dispatches to both email (stub) and on_app channels
- [ ] `submitSuggestion` dispatches to email channel (stub) for admin notification
- [ ] All files use `namespace` pattern consistent with existing services
- [ ] All files use `logger` from `@/backend/lib/logger` — no `console` methods

---

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
