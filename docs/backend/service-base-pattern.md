# Backend Service Base Pattern

## Overview

When two or more service files in `backend/services/` share identical or near-identical helper functions (auth preludes, config upserts, insert payload builders, session creation), extract the shared logic into `__shared__/` modules within the service directory.

## When to Use

- Two service files share the same auth/user-resolution prelude
- Two services build the same type of insert payload with minor variations
- Two services call the same repository upsert pattern with the same config shape
- Two services create auth sessions with the same structure

## Patterns

### 1. Service Base Class (ParentServiceBase)

When two services share the same constructor dependencies and common methods:

```typescript
// backend/services/parents/__shared__/ParentServiceBase.ts
export abstract class ParentServiceBase {
  constructor(
    protected readonly repo: ParentRepo,
    protected readonly authRepo: AuthRepo,
  ) {}

  protected async resolveParentId(tx: Tx | null, parentId: string): Promise<ParentSelectType> {
    // shared logic
  }
}

export class ParentPortalService extends ParentServiceBase { ... }
export class ParentSocialService extends ParentServiceBase { ... }
```

### 2. Shared Resolver Function (resolveTeacherId)

When two services share the same ID resolution logic but don't share a base class:

```typescript
// backend/services/scheduling/__shared__/resolveTeacherId.ts
export async function resolveTeacherId(
  authRepo: AuthRepo,
  tx: Tx | null,
  teacherId?: string,
): Promise<string> {
  if (teacherId) return teacherId;
  // fallback to authenticated user's teacherId
}
```

### 3. Config Upsert Helper (prepareMeetingConfigUpsert)

When two services build the same config shape for upsert:

```typescript
// backend/services/meetings/__shared__/prepareMeetingConfigUpsert.ts
export function prepareMeetingConfigUpsert(
  input: MeetingConfigInput,
): MeetingConfigUpsertType {
  return {
    provider: input.provider,
    autoGenerate: input.autoGenerate ?? true,
    // ...shared field mapping
  };
}
```

### 4. Insert Payload Builder (buildParentInsertPayload, buildTeacherInsertPayload)

When two services construct the same insert shape with field-level transformations:

```typescript
// backend/services/parents/__shared__/buildParentInsertPayload.ts
export function buildParentInsertPayload(
  input: ParentSubmitInput,
): ParentInsertType {
  return {
    name: input.name.trim(),
    email: input.email.toLowerCase(),
    phone: input.phone?.replace(/\s/g, ""),
    // ...shared transformations
  };
}
```

### 5. Auth Session Creator (createAuthSession)

When two services create auth sessions with the same structure:

```typescript
// backend/services/auth/__shared__/createAuthSession.ts
export async function createAuthSession(
  authRepo: AuthRepo,
  tx: Tx | null,
  userId: string,
): Promise<SessionSelectType> {
  return authRepo.createSession(tx, { userId, ...sharedFields });
}
```

### 6. Soft-Fail Delegation (listUserIdsWithPermission)

When a service calls a repo method that may not be available on all entity types:

```typescript
// Instead of duplicating try/catch logic:
const userIds = await this.repo.listUserIdsWithPermission(tx, perm).catch(() => []);
```

Delegate to a shared repo method that handles the soft-fail pattern.

## Existing Shared Service Modules

| Helper | Location | Used By |
|--------|----------|---------|
| `ParentServiceBase` | `backend/services/parents/__shared__/ParentServiceBase.ts` | `ParentPortalService`, `ParentSocialService` |
| `resolveTeacherId` | `backend/services/scheduling/__shared__/resolveTeacherId.ts` | `ScheduleService`, `WeeklyScheduleService` |
| `prepareMeetingConfigUpsert` | `backend/services/meetings/__shared__/prepareMeetingConfigUpsert.ts` | `MeetingProviderService`, `MeetingConfigService` |
| `buildParentInsertPayload` | `backend/services/parents/__shared__/buildParentInsertPayload.ts` | `ParentPortalService.create`, `ParentSocialService.create` |
| `buildTeacherInsertPayload` | `backend/services/teachers/__shared__/buildTeacherInsertPayload.ts` | `TeacherService.create`, `TeacherProfileService.create` |
| `createAuthSession` | `backend/services/auth/__shared__/createAuthSession.ts` | `AuthService.login`, `AuthService.refresh` |

## Key Rules

1. **`__shared__/` directory** — All shared service helpers go in a `__shared__/` subdirectory within the service domain directory (e.g., `backend/services/parents/__shared__/`).
2. **No business logic in helpers** — Shared helpers should be pure functions or thin wrappers. Domain-specific business logic stays in the service.
3. **Types from `backend/types/`** — All shared helpers use canonical types from `backend/types/{entity}.types.ts`, never local type definitions.
4. **Transaction parameter** — All shared helpers that access the database accept `tx: Tx | null` as a parameter.
5. **Import via `@/` alias** — All imports use the `@/` path alias, never relative paths.
