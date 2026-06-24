# Task E1 — Suggestion Service Extensions

## Sprint 15 · Services Layer · Section 6

---

## Objective

Extend `SuggestionService` with review, respond, duplicate marking, soft-delete, and parent history methods. Update permission checks from `COMPLAINTS_LIST` to dedicated `SUGGESTIONS_*` permissions.

---

## Dependencies

| Task | Description |
|------|-------------|
| B1 | SuggestionRepository extensions (new query methods) |
| D1 | OnApp channel implementation |
| D2 | Email channel implementation |
| D3 | SMS/Push channel implementations |

---

## Layer-Specific Rules

- **🚫 NO Local Type Definitions**: Service files MUST NOT define local types. All entity types MUST be imported from canonical `backend/types/{entity}.types.ts` files.
- **Import canonical types**: Services MUST import types from `@/backend/types` — use `SuggestionEntity`, `SuggestionWithParent`, `SuggestionWithResponse`, `SoftDeleteResult` etc. from their respective canonical `.types.ts` files.

---

## Target Files

| File | Action |
|------|--------|
| `backend/services/communication/suggestion.service.ts` | Extend with new methods |

---

## Pre-Implementation Checklist

- [ ] Read `backend/services/AGENTS.md` for service layer rules
- [ ] Read `backend/db/repo/AGENTS.md` for repository conventions
- [ ] Verify `SuggestionRepository` methods exist: `getSuggestionsByParent()`, `respondToSuggestion()`, `markAsDuplicate()`, `getSuggestionById()`
- [ ] Verify `SoftDeleteRepository.softDeleteSuggestion()` exists
- [ ] Verify `CommunicationService.dispatchMulti()` exists (Task E3)
- [ ] Confirm `SuggestionStatus` enum includes `DUPLICATE` value
- [ ] Confirm new `AppPermission` values exist: `SUGGESTIONS_LIST`, `SUGGESTIONS_REVIEW`, `SUGGESTIONS_DELETE`
- [ ] Confirm `support.view_history` permission exists in `AppPermission`

---

## Implementation Details

### 1. Permission Migration

Update existing methods to use dedicated suggestion permissions instead of complaint permissions.

#### `getAdminSuggestions()`

```typescript
// BEFORE:
const canList = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);

// AFTER:
const canList = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_LIST);
```

#### `markSuggestionReviewed()`

```typescript
// BEFORE:
const canReview = await PermissionsService.hasPermission(actorUserId, AppPermission.COMPLAINTS_LIST);

// AFTER:
const canReview = await PermissionsService.hasPermission(actorUserId, AppPermission.SUGGESTIONS_REVIEW);
```

---

### 2. New Method: `getParentSuggestions()`

Retrieves the suggestion history for a specific parent. Requires `support.view_history` permission.

```typescript
export async function getParentSuggestions(
  actorUserId: string,
  options: { limit: number; offset: number },
  locale?: string
): Promise<{ suggestions: SuggestionWithParent[]; total: number }> {
  const canViewHistory = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SUPPORT_VIEW_HISTORY
  );
  if (!canViewHistory) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  const parentId = await resolveParentIdFromActor(actorUserId);
  if (!parentId) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  const suggestions = await SuggestionRepository.getSuggestionsByParent(
    parentId,
    { limit: options.limit, offset: options.offset }
  );

  const total = await SuggestionRepository.countSuggestionsByParent(parentId);

  return { suggestions, total };
}
```

---

### 3. New Method: `respondToSuggestion()`

Allows an admin to respond to a suggestion with a text response. Dispatches notification via `CommunicationService.dispatchMulti()`.

```typescript
export async function respondToSuggestion(
  actorUserId: string,
  suggestionId: string,
  adminResponse: string,
  locale?: string
): Promise<SuggestionWithResponse> {
  const canReview = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SUGGESTIONS_REVIEW
  );
  if (!canReview) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
  if (!suggestion) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  const result = await SuggestionRepository.respondToSuggestion(
    suggestionId,
    actorUserId,
    adminResponse
  );

  const tNotifications = await getBackendTranslations({
    locale,
    namespace: "dashboard.notifications",
  });

  await CommunicationService.dispatchMulti(
    [
      {
        userId: suggestion.parentId,
        channel: "on_app",
        eventType: "SUGGESTION_RESPONSE",
        title: tNotifications("suggestionResponseTitle"),
        body: adminResponse.length > 200
          ? `${adminResponse.substring(0, 200)}...`
          : adminResponse,
      },
      {
        userId: suggestion.parentId,
        channel: "email",
        eventType: "SUGGESTION_RESPONSE",
        title: tNotifications("suggestionResponseTitle"),
        body: adminResponse,
        metadata: {
          suggestionId: suggestion.id,
          submitterName: suggestion.submitterName,
        },
      },
    ],
    locale
  );

  logger.info("Admin responded to suggestion", {
    actorUserId,
    suggestionId,
  });

  return result;
}
```

---

### 4. New Method: `markAsDuplicate()`

Marks a suggestion as a duplicate of another suggestion. Includes comprehensive validation to prevent circular references, chaining, and invalid targets.

```typescript
export async function markAsDuplicate(
  actorUserId: string,
  suggestionId: string,
  duplicateOfId: string,
  locale?: string
): Promise<SuggestionEntity> {
  const canReview = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SUGGESTIONS_REVIEW
  );
  if (!canReview) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  const t = await getBackendTranslations({ locale, namespace: "errors" });

  // 1. Cannot mark self as duplicate
  if (duplicateOfId === suggestionId) {
    throw new Error(t("suggestionCannotDuplicateSelf"));
  }

  // 2. Source suggestion must exist
  const source = await SuggestionRepository.getSuggestionById(suggestionId);
  if (!source) {
    throw new Error(t("notFound"));
  }

  // 3. Target must exist and not be soft-deleted
  const target = await SuggestionRepository.getSuggestionById(duplicateOfId);
  if (!target) {
    throw new Error(t("suggestionTargetNotFound"));
  }

  // 4. Target must not be DUPLICATE (no chaining)
  if (target.status === SuggestionStatus.DUPLICATE) {
    throw new Error(t("suggestionTargetAlreadyDuplicate"));
  }

  // 5. No circular reference (target.duplicateOfId !== suggestionId)
  if (target.duplicateOfId === suggestionId) {
    throw new Error(t("suggestionCircularDuplicate"));
  }

  const result = await SuggestionRepository.markAsDuplicate(
    suggestionId,
    duplicateOfId,
    actorUserId
  );

  const tNotifications = await getBackendTranslations({
    locale,
    namespace: "dashboard.notifications",
  });

  await CommunicationService.dispatchMulti(
    [
      {
        userId: source.parentId,
        channel: "on_app",
        eventType: "SUGGESTION_STATUS_CHANGE",
        title: tNotifications("suggestionDuplicateTitle"),
        body: tNotifications("suggestionDuplicateBody", {
          originalId: duplicateOfId.substring(0, 8),
        }),
      },
    ],
    locale
  );

  logger.info("Suggestion marked as duplicate", {
    actorUserId,
    suggestionId,
    duplicateOfId,
  });

  return result;
}
```

---

### 5. New Method: `deleteSuggestion()`

Soft-deletes a suggestion. Requires `suggestions.delete` permission (super admin only).

```typescript
export async function deleteSuggestion(
  actorUserId: string,
  suggestionId: string,
  locale?: string
): Promise<SoftDeleteResult> {
  const canDelete = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SUGGESTIONS_DELETE
  );
  if (!canDelete) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("unauthorizedAction"));
  }

  const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
  if (!suggestion) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  const result = await SoftDeleteRepository.softDeleteSuggestion(
    suggestionId,
    actorUserId
  );

  logger.info("Suggestion soft-deleted", {
    actorUserId,
    suggestionId,
  });

  return result;
}
```

---

## Complete Service File Structure

```typescript
import { SuggestionRepository } from "@/backend/db/repo/suggestion.repository";
import { SoftDeleteRepository } from "@/backend/db/repo/soft-delete.repository";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { CommunicationService } from "@/backend/services/communication/communication.service";
import { AppPermission, SuggestionStatus } from "@/shared/lib/enum";
import type { SuggestionEntity, SuggestionWithParent, SuggestionWithResponse } from "@/backend/types/suggestions.types";
import type { SoftDeleteResult } from "@/backend/types/soft-delete.types";

export namespace SuggestionService {
  // --- Existing methods with permission migration ---

  export async function getAdminSuggestions(
    actorUserId: string,
    options: { status?: SuggestionStatus; limit: number; offset: number },
    locale?: string
  ): Promise<{ suggestions: SuggestionWithParent[]; total: number }> {
    const canList = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUGGESTIONS_LIST
    );
    if (!canList) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const suggestions = await SuggestionRepository.getAdminSuggestions(options);
    const total = await SuggestionRepository.countAdminSuggestions(options);

    return { suggestions, total };
  }

  export async function markSuggestionReviewed(
    actorUserId: string,
    suggestionId: string,
    locale?: string
  ): Promise<SuggestionEntity> {
    const canReview = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUGGESTIONS_REVIEW
    );
    if (!canReview) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!suggestion) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    return SuggestionRepository.markAsReviewed(suggestionId, actorUserId);
  }

  // --- New methods ---

  export async function getParentSuggestions(
    actorUserId: string,
    options: { limit: number; offset: number },
    locale?: string
  ): Promise<{ suggestions: SuggestionWithParent[]; total: number }> {
    const canViewHistory = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUPPORT_VIEW_HISTORY
    );
    if (!canViewHistory) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const parentId = await resolveParentIdFromActor(actorUserId);
    if (!parentId) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const suggestions = await SuggestionRepository.getSuggestionsByParent(
      parentId,
      { limit: options.limit, offset: options.offset }
    );

    const total = await SuggestionRepository.countSuggestionsByParent(parentId);

    return { suggestions, total };
  }

  export async function respondToSuggestion(
    actorUserId: string,
    suggestionId: string,
    adminResponse: string,
    locale?: string
  ): Promise<SuggestionWithResponse> {
    const canReview = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUGGESTIONS_REVIEW
    );
    if (!canReview) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!suggestion) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const result = await SuggestionRepository.respondToSuggestion(
      suggestionId,
      actorUserId,
      adminResponse
    );

    const tNotifications = await getBackendTranslations({
      locale,
      namespace: "dashboard.notifications",
    });

    await CommunicationService.dispatchMulti(
      [
        {
          userId: suggestion.parentId,
          channel: "on_app",
          eventType: "SUGGESTION_RESPONSE",
          title: tNotifications("suggestionResponseTitle"),
          body: adminResponse.length > 200
            ? `${adminResponse.substring(0, 200)}...`
            : adminResponse,
        },
        {
          userId: suggestion.parentId,
          channel: "email",
          eventType: "SUGGESTION_RESPONSE",
          title: tNotifications("suggestionResponseTitle"),
          body: adminResponse,
          metadata: {
            suggestionId: suggestion.id,
            submitterName: suggestion.submitterName,
          },
        },
      ],
      locale
    );

    logger.info("Admin responded to suggestion", {
      actorUserId,
      suggestionId,
    });

    return result;
  }

  export async function markAsDuplicate(
    actorUserId: string,
    suggestionId: string,
    duplicateOfId: string,
    locale?: string
  ): Promise<SuggestionEntity> {
    const canReview = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUGGESTIONS_REVIEW
    );
    if (!canReview) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const t = await getBackendTranslations({ locale, namespace: "errors" });

    if (duplicateOfId === suggestionId) {
      throw new Error(t("suggestionCannotDuplicateSelf"));
    }

    const source = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!source) {
      throw new Error(t("notFound"));
    }

    const target = await SuggestionRepository.getSuggestionById(duplicateOfId);
    if (!target) {
      throw new Error(t("suggestionTargetNotFound"));
    }

    if (target.status === SuggestionStatus.DUPLICATE) {
      throw new Error(t("suggestionTargetAlreadyDuplicate"));
    }

    if (target.duplicateOfId === suggestionId) {
      throw new Error(t("suggestionCircularDuplicate"));
    }

    const result = await SuggestionRepository.markAsDuplicate(
      suggestionId,
      duplicateOfId,
      actorUserId
    );

    const tNotifications = await getBackendTranslations({
      locale,
      namespace: "dashboard.notifications",
    });

    await CommunicationService.dispatchMulti(
      [
        {
          userId: source.parentId,
          channel: "on_app",
          eventType: "SUGGESTION_STATUS_CHANGE",
          title: tNotifications("suggestionDuplicateTitle"),
          body: tNotifications("suggestionDuplicateBody", {
            originalId: duplicateOfId.substring(0, 8),
          }),
        },
      ],
      locale
    );

    logger.info("Suggestion marked as duplicate", {
      actorUserId,
      suggestionId,
      duplicateOfId,
    });

    return result;
  }

  export async function deleteSuggestion(
    actorUserId: string,
    suggestionId: string,
    locale?: string
  ): Promise<SoftDeleteResult> {
    const canDelete = await PermissionsService.hasPermission(
      actorUserId,
      AppPermission.SUGGESTIONS_DELETE
    );
    if (!canDelete) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }

    const suggestion = await SuggestionRepository.getSuggestionById(suggestionId);
    if (!suggestion) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const result = await SoftDeleteRepository.softDeleteSuggestion(
      suggestionId,
      actorUserId
    );

    logger.info("Suggestion soft-deleted", {
      actorUserId,
      suggestionId,
    });

    return result;
  }
}
```

---

## Error Handling Strategy

| Scenario | Error Type | Translation Key |
|----------|-----------|-----------------|
| Unauthorized actor | Permission denied | `errors.unauthorizedAction` |
| Suggestion not found | Not found | `errors.notFound` |
| Self-duplicate attempt | Validation | `errors.suggestionCannotDuplicateSelf` |
| Target is already duplicate | Validation | `errors.suggestionTargetAlreadyDuplicate` |
| Circular reference detected | Validation | `errors.suggestionCircularDuplicate` |
| Target suggestion deleted | Not found | `errors.suggestionTargetNotFound` |

---

## Logging Requirements

All methods must use `logger` (never `console`):

- `logger.info()` — Successful operations (respond, mark duplicate, delete)
- `logger.error()` — Caught exceptions in try/catch blocks
- `logger.warn()` — Non-critical failures (notification dispatch partial failure)

---

## Quality Gate — Implementation

- [ ] All new methods follow namespace pattern (`export namespace SuggestionService`)
- [ ] All user-facing errors use `getBackendTranslations()` with `locale` parameter
- [ ] Permission checks use dedicated `SUGGESTIONS_*` permissions (not `COMPLAINTS_*`)
- [ ] `markAsDuplicate()` includes all four validation checks (self, exists, chain, circular)
- [ ] `respondToSuggestion()` dispatches via `CommunicationService.dispatchMulti()` with both `on_app` and `email` channels
- [ ] `deleteSuggestion()` delegates to `SoftDeleteRepository.softDeleteSuggestion()`
- [ ] `getParentSuggestions()` checks `SUPPORT_VIEW_HISTORY` permission
- [ ] All logging uses `logger` (no `console.*` calls)
- [ ] No hardcoded error strings in the service
- [ ] TypeScript types are fully resolved (no `any`)
- [ ] Service can be used from SSR context (no GraphQL-specific dependencies)
- [ ] NO local type definitions in service files — all types imported from canonical `backend/types/` files
- [ ] All entity types sourced from their respective canonical `.types.ts` files

---

## Quality Gate — Verification

- [ ] `bun tsgo` passes with zero errors
- [ ] `bun lint` passes with zero errors
- [ ] `bun run test:db` passes (integration tests from Task E4)
- [ ] Manual verification: admin can respond to suggestion and notification is dispatched
- [ ] Manual verification: duplicate marking rejects self-reference
- [ ] Manual verification: duplicate marking rejects chain (target already DUPLICATE)
- [ ] Manual verification: duplicate marking rejects circular reference
- [ ] Manual verification: soft-delete sets `deletedAt` and audit log is created
- [ ] Manual verification: parent can view own suggestion history with `support.view_history`
- [ ] Manual verification: unauthorized user cannot access any suggestion admin method

---

## Notes

- The `resolveParentIdFromActor()` helper should query the `parents` table by `userId` to find the associated parent record. If the actor is not a parent, return `null`.
- `SuggestionStatus` enum must include: `PENDING`, `REVIEWED`, `RESPONDED`, `DUPLICATE`, `REJECTED`.
- The `SUGGESTIONS_DELETE` permission should be restricted to super admin role only.
- Notification event types `SUGGESTION_RESPONSE` and `SUGGESTION_STATUS_CHANGE` must be added to `NotificationEventType` enum if not already present.
