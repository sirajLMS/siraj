# Design: GraphQL Dev-Log Error Catching

## Document Information

- **Feature Name**: graphql-devlog-catch-errors
- **Target Directory**: `.ai/plans/graphql-devlog-catch-errors`
- **Outcome Directory**: `.ai/plans/graphql-devlog-catch-errors/outcome`
- **Version**: 1.1 (refined via docs MCP server)
- **Date**: 2026-08-19
- **Related Documents**: [Requirements](specs.md), [Research](plan.md)

## Overview

This design makes `DomainError` subclasses propagate `extensions.code` through GraphQL responses by refactoring `DomainError` to extend `GraphQLError`. This matches Siraj's existing proven pattern (`scopeAuth.unauthorizedError` throws `new GraphQLError(msg, { extensions: { code } })`, verified by `auth.test.ts:184`). No schema-shape change is required — the Pothos `errorUnion`/`errorUnionField` union migration path is explicitly rejected.

### Design Goals

- Make every `DomainError` subclass automatically surface `extensions.code` through Apollo Server 4
- Replace all raw `new Error(...)` throws in affected services/repositories with typed `DomainError` subclasses
- Split collapsed validation errors into distinct translated codes per failure mode
- Fix FK RESTRICT ordering in test-helper cleanup to prevent test data leaks
- Make silent skips (quota release, meeting URL) observable in GraphQL responses
- Upgrade GraphQL test assertions from `result.error` truthiness to `extensions.code` assertions

### Key Design Decisions

#### Decision: DomainError extends GraphQLError (not Pothos errorUnion)

**Context:** The `@pothos/plugin-errors` v4.9.1 plugin wraps fields in union types (`errorUnion`/`errorUnionField`). Siraj has `errors: { defaultTypes: [] }` and zero `errorUnion` usage. `DomainError` subclasses are thrown from services/repositories but surface as generic `GraphQLError` without `extensions.code`.

**Options Considered:**
1. **Strategy A — Pothos `errorUnion`/`errorUnionField` schema migration** — Register each `DomainError` subclass as a Pothos object type implementing an `Error` interface, add to `defaultTypes`, add `errors: { types: [...] }` to affected resolvers. Tests query with `__typename` + `... on NotFoundError { message }` fragments.
   - Pros: Plugin's designed path; exposes extra fields on error objects.
   - Cons: Schema-shape change for every affected mutation; Apollo cache normalization impact; rewriting all consumers (stories, Apollo hooks, codegen output); breaking change with no incremental path.
2. **Strategy B — `DomainError` extends `GraphQLError`** — Refactor `DomainError` in `backend/lib/errors.ts` to extend `GraphQLError` with `extensions: { code }` in the constructor.
   - Pros: Zero schema-shape change; matches Siraj's existing `UNAUTHENTICATED`/`BAD_USER_INPUT` pattern; additive to existing tests; minimal blast radius.
   - Cons: Doesn't expose extra error fields beyond `message` + `extensions.code` (but Siraj doesn't need them).

**Decision:** Strategy B.

**Rationale:** Siraj already uses `new GraphQLError(msg, { extensions: { code } })` in `gqlSchemaBuilder.ts:156` (scopeAuth) and `meeting.mutation.ts:129-215`. The `auth.test.ts:184` test proves this pattern works with Apollo Server 4. Strategy B makes every existing `throw new NotFoundError(...)` immediately surface `extensions.code` with zero schema change, zero new files, and zero per-resolver wiring.

#### Decision: Keep `errors.defaultTypes: []` as-is

**Context:** The Pothos errors plugin's `defaultTypes` only adds members to fields that opt in via `errors: {...}`. Since we're not using the union path, `defaultTypes` is irrelevant.

**Decision:** Leave `defaultTypes: []` and `onResolvedError` logger unchanged. They're harmless no-ops.

### Pothos Errors Plugin Investigation (CRITICAL)

Confirmed against installed `node_modules/@pothos/plugin-errors/` v4.9.1 AND docs MCP server (`docs-search_docs` on `pothos` library):

- **`src/types.ts`** — `ErrorsPluginOptions` interface: `defaultTypes`, `directResult`, `onResolvedError`, `unsafelyHandleInputErrors`, `defaultResultOptions`, `defaultUnionOptions`.
- **`src/schema-builder.ts`** — `errorUnion` implementation: merges field `types` with `defaultTypes`, builds a `union` type, attaches `pothosErrorTypes` extension.
- **`esm/index.js`** — `PothosErrorsPlugin.wrapIsTypeOf` & `onOutputFieldConfig` confirm the plugin only engages on fields with `errors: { types: [...] }` or `errorUnionField`.
- **Docs MCP** (pothos `errors.mdx`): `errorUnionField` wraps a field's return type in a union: `<FieldName>Result = Error | FieldSuccess`. Error types must be registered via `builder.objectType(ValidationError, { name: 'ValidationError', ... })`. Type resolution uses `instanceof` for class-based error types.
- **Siraj grep**: `grep -rn "errorUnion" backend/graphql/` → zero matches. Siraj has zero fields opted into the union-wrapping path.

### UX/Navigation Specification

N/A — this is a backend-only feature. No new routes, sidebar items, or UI components. Error messages are already rendered by existing UI components; the change is that messages now carry `extensions.code` and new validation failures use distinct translated strings.

### Translation System Requirements

**New i18n keys** to add to `SchedulingErrors` in `shared/locale/types/errors/index.ts`:

| Key | English | Arabic |
|-----|---------|--------|
| `recurringClassDaysRequired` | "At least one day is required." | "يوم واحد على الأقل مطلوب." |
| `invalidDuration` | "Duration must be greater than zero." | "يجب أن تكون المدة أكبر من صفر." |
| `subjectRequired` | "Subject is required." | "المادة مطلوبة." |

**Existing keys reused:**
- `recordNotFound({ tableName, entityId })` — for suggestion not found (REQ-2)
- `unauthorizedViewMetrics` — for unauthorized daily metrics (REQ-3)

### Concurrency & Race Condition Assessment

N/A — no shared mutable state changes. The `DomainError` refactor is a class-hierarchy change; FK cleanup ordering is a delete-sequence fix within a single transaction.

### Drizzle SQL Template Anti-Patterns

N/A — no inline SQL templates in this feature. The FK cleanup uses standard Drizzle query builders (`tx.delete(...).where(...)`).

### Outcome & Knowledge Transfer Protocol

- **BEFORE Execution:** Read ALL existing files in `.ai/plans/graphql-devlog-catch-errors/outcome/`
- **AFTER Execution:** Write `<task-id>-outcome.md` with research findings, implementation details, cross-file dependencies, and carry-over points
- **PROGRESS TRACKING:** Update task checkboxes `[ ]` -> `[x]` in `tasks.md`

## Architecture

### System Context

```mermaid
graph TB
    subgraph "Current State"
        S1[Service throws DomainError] --> S2[Apollo wraps as generic GraphQLError]
        S2 --> S3[Client receives message WITHOUT extensions.code]
        S3 --> S4[Test asserts result.error truthy ONLY]
    end
    subgraph "After Fix"
        F1[Service throws DomainError\nextends GraphQLError] --> F2[Apollo preserves extensions.code]
        F2 --> F3[Client receives message WITH extensions.code]
        F3 --> F4[Test asserts extensions.code === 'SPECIFIC_CODE']
    end
```

### High-Level Architecture

```mermaid
graph LR
    A[DomainError\nbackend/lib/errors.ts] -->|extends| B[GraphQLError\ngraphql]
    C[NotFoundError] -->|subclass| A
    D[ValidationError] -->|subclass| A
    E[UnauthorizedError] -->|subclass| A
    F[ForbiddenError] -->|subclass| A
    G[ConflictError] -->|subclass| A
    H[Service Layer] -->|throws| C
    H -->|throws| D
    H -->|throws| E
    I[Repository Layer] -->|throws| C
    I -->|throws| G
    J[Apollo Server] -->|preserves\nextensions.code| K[GraphQL Response]
```

### Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Error classes | `GraphQLError` (from `graphql` package) | Apollo Server 4 preserves `extensions` on `GraphQLError` instances |
| i18n | Compile-time TypeScript system in `shared/locale/` | Project standard — no `next-intl` |
| Testing | Bun test runner + Apollo `CombinedGraphQLErrors` | Existing pattern from `auth.test.ts:184` |
| Dev server verification | Next.js devtools MCP server (port 3000) | `compile_route`, `get_errors`, `get_logs`, `get_compilation_issues` for per-phase verification |

## Components and Interfaces

### Component 1: `DomainError` (modified)

**Purpose**: Base class for all siraj-specific errors, now extending `GraphQLError` to carry `extensions.code`.

**Responsibilities**:
- Extend `GraphQLError` with `extensions: { code }` in constructor
- Preserve `instanceof Error` (GraphQLError already extends Error)
- Preserve `err.message` and `err.code` properties
- Ensure subclass prototype chain is restored (ES5 `Object.setPrototypeOf`)

**Interfaces**:
- **Input**: `code: string`, `message: string`, `options?: ErrorOptions`
- **Output**: `GraphQLError` instance with `extensions.code`
- **Dependencies**: `graphql` package (`GraphQLError`)

**Implementation Notes**:
```typescript
// backend/lib/errors.ts
import { GraphQLError } from "graphql";

export class DomainError extends GraphQLError {
  constructor(
    public readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, { ...options, extensions: { code } });
    this.name = new.target.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
```

**CRITICAL — Constructor arg order preserved**: The current `DomainError` uses `(code, message, options)`. The refactor preserves this exact order to minimize blast radius — all existing subclass constructors (`NotFoundError`, `UnauthorizedError`, `ValidationError`, etc.) continue to work without modification. Only the base class changes: `extends Error` → `extends GraphQLError`, and `super(message, options)` → `super(message, { ...options, extensions: { code } })`.

**Apollo Server v5.5.1 docs confirm**: "If a resolver throws a generic error that is _not_ a `GraphQLError` instance, that error is thrown with `extensions` that includes `code: INTERNAL_SERVER_ERROR`." — By extending `GraphQLError`, our `DomainError` subclasses bypass this default and surface their own `extensions.code`.

**Apollo Client v4.2.12 docs confirm**: `CombinedGraphQLErrors.is(error)` is the recommended type check. `error.errors?.[0]?.extensions?.code` is the correct access path (not `error.graphQLErrors` — that's v3).

### Component 2: Repository layer — suggestion not found (modified)

**Purpose**: Replace raw `new Error(...)` with `NotFoundError` in `suggestion.repository.ts`.

**Responsibilities**:
- Accept `locale` or `tErrors` context from service callers
- Throw `NotFoundError("SUGGESTION_NOT_FOUND", tErrors.recordNotFound(...))`

**Interfaces**:
- **Input**: `suggestionId: string`, `locale?: string` (or `tErrors` callback)
- **Output**: `NotFoundError` throw (extends `GraphQLError`)
- **Dependencies**: `NotFoundError` from `@/backend/lib/errors`, `tErrors` from `@/shared/locale/server-graphql`

### Component 3: Service layer — schedule unauthorized (modified)

**Purpose**: Replace `new Error(tErrors.unauthorizedViewMetrics)` with `UnauthorizedError` in `schedule.service.ts`.

**Responsibilities**:
- Throw `new UnauthorizedError("UNAUTHORIZED", tErrors.unauthorizedViewMetrics)`

**Interfaces**:
- **Input**: none (uses existing `tErrors` already built in the service)
- **Output**: `UnauthorizedError` throw
- **Dependencies**: `UnauthorizedError` from `@/backend/lib/errors`

### Component 4: Service layer — recurring class validation (modified)

**Purpose**: Split collapsed `ValidationError(tErrors.invalidInput)` into three distinct translated errors.

**Responsibilities**:
- Check `days` empty → `ValidationError("RECURRING_CLASS_DAYS_REQUIRED", tErrors.recurringClassDaysRequired)`
- Check `durationMinutes <= 0` → `ValidationError("INVALID_DURATION", tErrors.invalidDuration)`
- Check `subjectId` empty → `ValidationError("SUBJECT_REQUIRED", tErrors.subjectRequired)`

**Interfaces**:
- **Input**: `input: CreateRecurringClassInput`
- **Output**: `ValidationError` throw with specific code
- **Dependencies**: `ValidationError` from `@/backend/lib/errors`, 3 new i18n keys

### Component 5: Test helper — FK-aware cleanup (modified)

**Purpose**: Delete FK-blocking child rows before parent rows in `cleanupTestSuperAdmin` and `cleanupTestEntities`.

**Responsibilities**:
- Delete `admin_audit_logs` rows for user before deleting user
- Delete `class_status_events` rows for instances before deleting instances

**Interfaces**:
- **Input**: `userId: string` (cleanupTestSuperAdmin), `studentId/teacherId: string` (cleanupTestEntities)
- **Output**: `true` on success (not `false`)
- **Dependencies**: `adminAuditLogs`, `classStatusEvents` from `@/backend/db/schema`

### Component 6: Test assertions — `expectMutationError` upgrade (modified)

**Purpose**: Upgrade `frontend/common/graphql/test/helpers.ts` to support `extensions.code` assertions.

**Responsibilities**:
- Add a `expectMutationErrorCode(mutation, expectedCode)` helper that asserts both `result.error` truthiness AND `error.extensions.code === expectedCode`

**Interfaces**:
- **Input**: mutation document + variables + expected code string
- **Output**: assertion pass/fail
- **Dependencies**: `CombinedGraphQLErrors` fromApollo error handling

## Data Models

### Error Code Enum (new)

```typescript
// shared/types/errorCodes.ts (or inline in backend/lib/errors.ts)
export const ErrorCode = {
  SUGGESTION_NOT_FOUND: "SUGGESTION_NOT_FOUND",
  COMPLAINTS_NOT_FOUND: "COMPLAINTS_NOT_FOUND",
  UNAUTHORIZED: "UNAUTHORIZED",
  RECURRING_CLASS_DAYS_REQUIRED: "RECURRING_CLASS_DAYS_REQUIRED",
  INVALID_DURATION: "INVALID_DURATION",
  SUBJECT_REQUIRED: "SUBJECT_REQUIRED",
  // ... existing codes
} as const;

export type ErrorCode = typeof ErrorCode[keyof typeof ErrorCode];
```

### Data Flow

```mermaid
sequenceDiagram
    participant Test
    participant Apollo
    participant Resolver
    participant Service
    participant Repo

    Test->>Apollo: Mutation { markSuggestionReviewed(id: "nonexistent") }
    Apollo->>Resolver: resolve()
    Resolver->>Service: markSuggestionReviewed(id, locale)
    Service->>Repo: markSuggestionReviewed(id, tErrors)
    Repo-->>Service: throw NotFoundError("SUGGESTION_NOT_FOUND", msg)
    Service-->>Resolver: throw NotFoundError (propagates)
    Resolver-->>Apollo: throw DomainError (extends GraphQLError)
    Apollo-->>Test: { errors: [{ message: msg, extensions: { code: "SUGGESTION_NOT_FOUND" } }] }
    Test->>Test: assert error.extensions.code === "SUGGESTION_NOT_FOUND" ✅
```

## API Design

No new endpoints. The change affects the shape of error responses on existing GraphQL mutations:

### Error Response Format (before)

```json
{
  "errors": [{
    "message": "Suggestion 86dee45d-... not found",
    "extensions": {}
  }]
}
```

### Error Response Format (after)

```json
{
  "errors": [{
    "message": "السجل غير موجود: suggestion برقم 86dee45d-...",
    "extensions": { "code": "SUGGESTION_NOT_FOUND" }
  }]
}
```

## Security Considerations

### Input Validation

- No new user inputs — error codes are hardcoded constants in service/repository code.
- Apollo's `hideSchemaDetailsFromClientErrors` remains active; `extensions.code` is on the allow-list (confirmed by existing `UNAUTHENTICATED`/`FORBIDDEN` codes).

### Data Protection

- Error messages use translated strings — no SQL fragments or stack traces in production responses.
- The `code` property is a machine-readable constant, not user data.

## Error Handling

### Error Categories

| Category | Code | Description | User Action |
|----------|------|-------------|-------------|
| Not Found | `*_NOT_FOUND` | Resource doesn't exist | Check identifier |
| Unauthorized | `UNAUTHORIZED` | Insufficient role/permissions | Contact administrator |
| Validation | `*_REQUIRED`, `INVALID_*` | Invalid input data | Fix input and retry |
| Conflict | `*_CONFLICT` | Duplicate/conflicting state | Resolve conflict and retry |

### Logging Strategy

- **Error Logs**: `DomainError` throws are logged by the service-layer catch blocks (existing behavior — no change)
- **Warn Logs**: Silent skips (quota release, meeting URL) upgrade from `logger.info` to `logger.warn` with structured fields
- **Debug Logs**: Notification dropped-payload warnings include channel type for scannability

## Testing Strategy

### Three-Layer Test Architecture

Every backend fix must be verified across three test layers — DB repository, service, and GraphQL integration — so regressions are caught at the right layer, not only at the already-collapsed GraphQL boundary.

```mermaid
graph TD
    subgraph "DB Layer Tests (bun run test:db)"
        DB1["suggestion.repository.test.ts\nassert error instanceof NotFoundError\nassert error.code === 'SUGGESTION_NOT_FOUND'"]
        DB2["complaint.repository.test.ts\nassert error instanceof NotFoundError\nassert error.code === 'COMPLAINTS_NOT_FOUND'"]
        DB3["domain-error.test.ts (NEW)\nassert DomainError extends GraphQLError\nassert extensions.code propagation"]
        DB4["test-helper.repository.test.ts (NEW)\nassert FK cleanup ordering\nassert true return"]
    end
    subgraph "Service Layer Tests (bun run test:services)"
        SV1["suggestion.service.test.ts\nassert thrown error.code === 'SUGGESTION_NOT_FOUND'"]
        SV2["schedule.service.test.ts\nassert thrown error.code === 'UNAUTHORIZED'"]
        SV3["recurring-class.service.test.ts (NEW)\nassert 3 distinct error codes"]
        SV4["class-session.service.test.ts (NEW)\nassert quota-skip warning observability"]
        SV5["meeting-config-snapshot.test.ts\nassert logger.warn not logger.info"]
        SV6["notification-dispatch.helpers.test.ts\nassert skippedNotificationsByType in return"]
        SV7["test-helper.service.test.ts (NEW)\nassert cleanup deletes FK children first"]
    end
    subgraph "GraphQL Layer Tests (bun run test:graphql)"
        GQL1["suggestion.test.ts\nassert extensions.code === 'SUGGESTION_NOT_FOUND'"]
        GQL2["schedule.test.ts\nassert extensions.code === 'UNAUTHORIZED'"]
        GQL3["schedule.test.ts\nassert 3 distinct codes for validation"]
        GQL4["complaint.test.ts\nassert extensions.code === 'COMPLAINTS_NOT_FOUND'"]
        GQL5["schedule.test.ts\nassert meetingUrl === null on non-provider path"]
        GQL6["rate-limit.test.ts (NEW)\nassert extensions.code === 'RATE_LIMIT_EXCEEDED'"]
    end
```

### Unit Testing

#### DB Repository Layer (`backend/db/test/repo/`)

- **Framework**: Bun test runner + `runInRollback` wrapper + `entity-setup.ts` helpers
- **Pattern**: `expectRepoError(() => Repo.method(...))` → assert `error instanceof NotFoundError` AND `error.code`
- **Test Runner**: `bun run scripts/run-test/run-test.ts <test-path>` (log capture mandatory)
- **Full Suite**: `bun run test:db` (parallel via `scripts/run-db-tests-parallel.ts`)
- **Key Constraint**: `runInRollback` — never use `expect(...).rejects.toThrow()` inside (causes deadlocks)

**Example upgrade pattern (suggestion.repository.test.ts):**
```typescript
// BEFORE (current): only checks message length
async function expectNonExistentError(name, operation) {
  suggestionTest(name, async tx => {
    const error = await expectRepoError(() => operation(tx));
    expect(error.message.length).toBeGreaterThan(0);
  });
}

// AFTER (with DomainError assertions):
async function expectNonExistentError(name, operation, expectedCode?: string) {
  suggestionTest(name, async tx => {
    const error = await expectRepoError(() => operation(tx));
    expect(error.message.length).toBeGreaterThan(0);
    if (expectedCode) {
      expect(error).toBeInstanceOf(NotFoundError);
      expect((error as NotFoundError).code).toBe(expectedCode);
    }
  });
}
```

#### Service Layer (`backend/services/**/test/`)

- **Framework**: Bun test runner with `spyOn` mocks (no live DB)
- **Pattern**: `expectErrorMatching(promise, predicate)` → upgrade to `expect((error as DomainError).code).toBe(expectedCode)`
- **Test Runner**: `bun run scripts/run-test/run-test.ts <test-path>` (log capture)
- **Full Suite**: `bun run test:services` (parallel via `scripts/run-services-tests-parallel.ts`)

**Example upgrade pattern (suggestion.service.test.ts):**
```typescript
// BEFORE: predicate on message string
async function expectErrorMatching(promise, predicate: (message: string) => boolean) {
  // ... catches error, asserts predicate(error.message.toLowerCase())
}

// AFTER: also assert error.code
async function expectErrorCode(promise, expectedCode: string) {
  let errorCaught: Error | null = null;
  try { await promise; } catch (e) { errorCaught = e as Error; }
  expect(errorCaught).not.toBeNull();
  expect((errorCaught as DomainError).code).toBe(expectedCode);
}
```

### Integration Testing

#### GraphQL Layer (`frontend/common/graphql/test/`)

- **API Testing**: GraphQL integration tests (dev server, `testClient`)
- **Test Pattern**: ` CombinedGraphQLErrors` from Apollo → `error.errors?.[0]?.extensions?.code`
- **Runner**: `bun run test:graphql` (dev server)
- **Upgrade**: New `expectMutationErrorCode(token, document, variables, expectedCode)` helper in `helpers.ts`

```typescript
export async function expectMutationErrorCode<TData, TVars>(
  token: string,
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  expectedCode: string
): Promise<void> {
  const result = await testClient.mutate({
    mutation: document,
    variables,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  expect(result.error).toBeDefined();
  expect(CombinedGraphQLErrors.is(result.error)).toBe(true);
  if (CombinedGraphQLErrors.is(result.error)) {
    expect(result.error.errors?.[0]?.extensions?.code).toBe(expectedCode);
  }
}
```

**Apollo Client v4 docs note**: `CombinedGraphQLErrors.is(error)` is preferred over `instanceof` because it avoids false positives/negatives across realms. The existing `auth.test.ts:184` uses `instanceof` — it works, but `.is()` is the recommended pattern for all new helpers.

### Docs MCP Server Library Confirmation

The following installed library versions were confirmed via `docs-list_libraries` + `docs-search_docs` and validated against `node_modules/`:

| Library | Installed Version | Docs MCP Key Finding | Plan Impact |
|---------|-------------------|---------------------|-------------|
| `apollo-server` | v5.5.1 | Custom errors use `new GraphQLError(msg, { extensions: { code } })`. Non-`GraphQLError` throws get `INTERNAL_SERVER_ERROR`. | Confirms Strategy B — `DomainError extends GraphQLError` surfaces custom codes |
| `pothos` | v4.9.1 (plugin-errors) | `errorUnionField` wraps fields in union types; `defaultTypes` only affects opted-in fields. | Confirms Strategy A rejection — no schema-shape change needed |
| `apollo-client` | v4.2.12 | `CombinedGraphQLErrors.is(error)` preferred over `instanceof`; `error.errors?.[0]?.extensions?.code` is the v4 access path. | Upgrades test helper to use `.is()` instead of `instanceof` |
| `graphql` | v17.0.2 | `GraphQLError` constructor accepts `{ extensions }` options. | Confirms `DomainError` constructor refactor is safe |
| `graphql-codegen` | — | No error-type-specific config needed. | `bun codegen` output unchanged — no new schema types |

### Verification via Next.js Devtools MCP Server

After each phase, use the Next.js devtools MCP server (port 3000) to confirm:

| MCP Tool | Purpose |
|---|---|
| `compile_route` (`/api/graphql`) | Pre-compile route, catch module-graph breakage |
| `get_compilation_issues` | Zero compilation issues across all routes |
| `get_errors` | No build/SSR/global errors introduced |
| `get_logs` | Dev server log tail — confirm localized messages + error codes |
| `get_routes` (`routerType: "app"`) | `/api/graphql` still registered |
| `get_request_insights` | Request timeline for slow mutations |

### End-to-End Testing

- **Full Suite**: `bun test:graphql` with log capture to `graphql_tests_logs/dev-post-fix.log`
- **Log Diff**: Compare `dev.log` (original) vs `dev-post-fix.log` — confirm issues 1-9 resolved
- **Test Runner**: `bun run scripts/run-test/run-test.ts <test-path>` for individual test log capture

## Performance Considerations

### Expected Load

- No new load — error handling is on existing mutation paths.
- `DomainError` constructor adds `Object.setPrototypeOf` call (nanosecond-level, negligible).

### Optimization Strategies

- No caching changes; no database query changes; no network changes.

## Migration and Compatibility

### Backward Compatibility

- Existing tests that check `result.error` truthiness continue to pass (additive).
- `DomainError` still `instanceof Error` (GraphQLError extends Error).
- `err.message` and `err.code` unchanged.
- No schema-shape change (no `errorUnion` migration).
- `bun codegen` output unchanged (no new types added to schema).

### Integration Impact

- No impact on existing Apollo Client cache normalization (error responses aren't cached entities).
- No impact on Storybook (error states are mocked, not from live GraphQL).

---

## Design Review Checklist

- [x] High-level architecture is clearly described (DomainError → GraphQLError inheritance)
- [x] Component responsibilities are well-defined (6 components)
- [x] Interfaces between components are specified
- [x] Technology choices are justified (Strategy B over A, with rationale)
- [x] Design addresses all functional requirements (REQ-1 through REQ-11)
- [x] Error handling is comprehensive (error categories table, response format before/after)
- [x] Data models complete (ErrorCode enum, data flow sequence diagram)
- [x] Testing strategy is comprehensive (three-layer: DB repository, service, GraphQL integration, MCP verification, E2E log diff)
- [x] Backward compatibility addressed (additive, no breaking changes)
- [x] UX/Navigation: N/A (backend-only feature) — documented
