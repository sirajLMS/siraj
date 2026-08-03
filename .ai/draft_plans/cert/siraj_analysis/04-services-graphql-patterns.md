# Siraj Services & GraphQL Layers — Pattern Analysis for Certificate Integration

> **Scope:** `backend/services/` and `backend/graphql/` layers of the Siraj project at `/home/ahmed/Projects/siraj-cert/`.
> **Purpose:** Establish the canonical patterns a new **certificate feature** must follow so it integrates consistently with existing domain logic, error handling, permissions, caching, idempotency, and Pothos/GraphQL conventions.
> **Companion:** This is file `04-products-services-graphql-patterns.md` (intended path: `.ai/draft_plans/cert/siraj_analysis/`). Building on the preceding CGVS analysis (`cert/cgvs_analysis/01–08`), which documented a *prior* certificate system's data model and gaps.

---

## A. Guiding Rules (from AGENTS.md)

Three AGENTS.md files define the non‑negotiable rules for these layers. Key obligations:

### `backend/services/AGENTS.md`
- **Domain‑Driven Architecture** — one service namespace per domain concern (`PermissionsService`, `ScheduleService`). **No monolithic services** (e.g. no single `DashboardService`).
- **Service = business‑logic hub** — orchestration + complex permission gating before calling the **Repository** layer.
- **SSR‑safe** — services are used directly by Next.js Server Components / Server Actions and must not depend on a GraphQL context unless explicitly passed.
- **i18n / localized errors — MANDATORY:** all user‑facing errors must use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql`. **Hardcoded strings are forbidden.** The legacy `getBackendTranslations` helper is deprecated and **must not be used**.
- **Type Definition Pattern** — import types from `backend/types/` (`{Entity}ReturnType`, `{Entity}SubmitInput`) rather than ad‑hoc types or schema types directly.
- **Batch methods for DataLoader** — services called from field resolvers must expose batch versions (`ids: string[]` → `Map<string, T | null>`), named `resolve{Entity}IdsForUsers` / `get{Entity}Contexts`. See `docs/graphql/dataloader-batching.md`.
- **Hot‑resolver caching (`EntityCacheService`)** — cache keys must be identity+role scoped and **fail‑open**; permission checks must execute *before* cache lookups; use named invalidation helpers (`invalidateParentWrite`, etc.).

### `backend/graphql/AGENTS.md`
- **Code‑first Pothos** schema.
- **Nullability** — fields are non‑nullable by default; explicit `nullable: true` otherwise.
- **Resolvers delegate to services** — no business logic in resolvers; never call repositories directly.
- **Always expose `id`** on GraphQL objects (Apollo cache normalization).
- **Locale propagation** — resolvers pass `ctx.locale` to services/repos; direct resolver errors use `ctx.t("<namespace>")` (already locale‑bound). **Do NOT** import `getBackendTranslations`/`next-intl` in resolvers.
- **Types from `backend/types/`** as the Pothos basis.

### `backend/graphql/pothos/AGENTS.md`
- **Enum registration** — canonical `.enum.ts` in `backend/enum/`, registered **once** in `pothos/shared/enum.pothos.ts` via `gqlSchemaBuilder.enumType(MyEnum, { name })`. **Hardcoded value arrays are prohibited.**
- **Single canonical object type** per entity — `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>")`. No local `SimpleDefinition` types.
- **DataLoader batching (CRITICAL)** — per‑parent resolvers **must** use `t.loadable()` / `loadableObject` / `loadableObjectRef`; `t.loadable()` cannot return lists — use `t.field()` for arrays.

> ⚠️ For a certificate feature, every type, enum, service, error string, resolver, and field must obey these rules. The sections below use **existing domain code as the reference implementation** to copy.

---

## B. Service Layer (`backend/services/`)

### B.1 Directory layout
```
backend/services/
├── AGENTS.md
├── idempotency.service.ts          ← cross-cutting
├── index.ts                        ← barrel: re-exports domain services
├── auth/                           (permissions, session, impersonation, …)
├── billing/                        (invoices, credit, currency, fx-display, …)
├── storage/                        (storage.service.ts, site-content.service.ts)
├── student/                        (lifecycle, management, onboarding, profile, …)
├── cache/                          (EntityCacheService, adapters, factory)
├── redis/  fx/  communication/  payment-method/  …
```
Domains are one-per-fol
der. Each folder contains `*.service.ts` files, an `index.ts` barrel that side-effect/namespace-exports them, and `*.test.ts` colocated tests (`bun run test:services`).

### B.2 Service‑exaporation pattern (Namespaces, NOT classes)

Services are **namespaces of pure async functions**, not instantiated classes. Example from `backend/services/storage/storage.service.ts:1-43`:

```typescript
// backend/services/storage/storage.service.ts
export namespace StorageService {
  // Bootstrap (no auth): delegates straight to repo
  export async function upsertManySiteContent(inputs) {
    return SiteContentRepository.upsertMany(inputs);
  }

  // Permission gate: throws a localized error
  export async function requireStorageManage(userId: string, tErrors: ErrorsLabels): Promise<void> {
    const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.STORAGE_MANAGE);
    if (!hasPermission) {
      throw new Error(tErrors.insufficientPermissions);   // localized!
    }
  }

  // Owner-or-permission variant
  export async function requireStorageManageOrOwner(userId, filePath, tErrors) { … }
  // … delegate to repositories after gating
}
```
Other examples of the same namespace-of-functions pattern:
- `backend/services/auth/permissions.service.ts:15` — `export namespace PermissionsService { … }`
- `backend/services/student/student-management.service.ts:16` — `export namespace StudentManagementService { … }`
- `backend/services/idempotency.service.ts:3` — `export namespace IdempotencyService { … }`

There is also legacy forward-compat aliasing pattern in storage (`StorageAuthService`, `StorageManageService`, `StorageUtils` at lines 305–341) re-exporting from `StorageService`. For a *new* feature, **don't replicate the legacy aliases** — just use the canonical namespace.

### B.3 Service index (`backend/services/index.ts`)
Barrel‑exposes domain services (lines 1–17):
```typescript
export * from "@/backend/services/auth";
export * from "@/backend/services/billing";
// …
export * from "@/backend/services/storage";
export * from "@/backend/services/student";
export * from "./supervisor";
```
A new `cert/` service folder must add itself here and have its own `index.ts` barrel that namespace‑exports certificate services. Resolvers import services from the root barrel: `import { BillingManagementService } from "@/backend/services"`.

### B.4 Error handling — the canonical three styles

Three error styles coexist; the dominant one is **`throw new Error(tErrors.<key>)`** with localized strings.

**Style 1 — Localized `new Error(tErrors…)` (MOST COMMON, permissions/validation):**
```typescript
// backend/services/student/student-management.service.ts:33-53
async function editQuota(actorUserId, studentId, tErrors, newClassesRemaining, expectedVersion, locale) {
  const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
  try { assertStudentFieldEdit(fieldCtx, "student_quota_edit"); }
  catch { throw new Error(tErrors.insufficientPermissions); }

  if (!Number.isInteger(newClassesRemaining) || newClassesRemaining < 0)
    throw new Error(tErrors.invalidInput);

  const current = await StudentRepository.findById(studentId);
  if (!current) throw new Error(tErrors.studentNotFound(studentId));
  if (newClassesRemaining > current.classesTotal)
    throw new Error(tErrors.quotaExceedsTotal({ requested, total }));
}
```
`tErrojects is `ErrorsLabels` from `@/shared/locale`; functions like `tErrors.studentNotFound(id)` return a localized, interpolated message.

**Style 2 — Structured `DomainError` subclasses (errors.ts hierarchy) — used for typed not-found/auth):**
```typescript
// backend/lib/errors.ts:1-28
export class DomainError extends Error {
  constructor(public readonly code: string, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}
export class NotFoundError extends DomainError {
  constructor(entity: string, message: string, options?) { super(`${entity}_NOT_FOUND`, message, options); }
}
export class UnauthorizedError extends DomainError { super("UNAUTHORIZED", …) }
export class ForbiddenError    extends DomainError { super("FORBIDDEN",    …) }
```
Used in billing with localized messages:
```typescript
// backend/services/billing/billing-management.service.ts:299, 320, 387, …
throw new NotFoundError("INVOICE", tErrors.billing.invoiceNotFound(invoiceId));
```
`NotFoundError` is imported via `@/backend/lib` (re‑exported in `backend/lib/index.ts:5`). The `code` field (`INVOICE_NOT_FOUND`) lets the resolver layer categorize errors without regex‑matching messages.

**Style 3 — Typed domain validation error with `code` discriminator (newer pattern):**
```typescript
// backend/services/storage/site-content.service.ts:31-42
export type SiteContentValidationErrorCode = "ESLUG_INVALID";
export class SiteContentValidationError extends Error {
  readonly code: SiteContentValidationErrorCode;
  constructor(code, message) { super(message); this.name = "SiteContentValidationError"; this.code = code; }
}
```
Used when callers must react to specific codes (e.g. slug validation). The cert feature should prefer the namespace code pattern where one service may surface multiple stable codes.

> **Recommendation for certificates:** use **Style 1** for permission/validation branches with `tErrors.cert.*` namespace keys; use **Style 2** (`NotFoundError`/`ForbiddenError`) for entity lookups missing, with codes like `CERTIFICATE_NOT_FOUND`, `TEMPLATE_NOT_FOUND`; optionally use **Style 3** for template‑input validation with stable codes (`invalidTemplate`, `invalidVariable`, `generationFailed`).

### B.5 Translation plumbing
- `shared/locale/server-graphql.ts:3` — thin wrapper `getServerTranslations(locale) → getTranslations(locale)`.
- Inside a GraphQL request, resolvers use `ctx.t() → Translations`; old `ctx.t()` re‑binds `getServerTranslations(locale)`.
  - The context's `t` is created in `gqlContext.ts:70` (`() => getServerTranslations(locale)`).
  - The error subset is `ctx.t().errorsTranslations` (an `ErrorsLabels` instance), passed to services as `tErrors`.
- **Services never read `ctx`; they receive `tErrors` (and `locale?`) as explicit parameters**, keeping them SSR‑safe. Example signature from `billing-management.service.ts:60`:
  ```typescript
  createInvoice(actorUserId, input, tErrors, locale?) 
  ```
- New cert error keys must be added to the translation message files (the `errors` namespace: `errors.cert.*`) in both `ar` and `en`. The AGENTS.md mandates the *frontend* error `tErrors.cert.*` and the compile-time namespaces.

### B.6 Permissions (PermissionsService）
Defined in `backend/services/auth/permissions.service.ts`. Core surface:

```typescript
// backend/services/auth/permissions.service.ts:15-79, 180-254
namespace PermissionsService {
  getUserContext(userId): UserPermissionContext   // {permissions, permissionGroups, isSuperAdmin, role}
  getUserContexts(userIds[]): Map<string, UserPermissionContext>  // BATCH for DataLoader
  hasPermission(userId, key): Promise<boolean>
  hasAnyPermission(userId, keys[]): Promise<boolean>
  getPermissionGroupContext(slug): Promise<UserPermissionContext>
  getUserIdsWithPermission(key): Promise<string[]>   // soft-fails to []
}
```
`AppPermission` is a TypeScript enum in `backend/enum/` (re‑exported via `backend/enum/index.ts`). Services gate like:
```typescript
const hasPermission = await PermissionsService.hasPermission(userId, AppPermission.BILLING_CREATE_INVOICE);
if (!hasPermission) throw new Error(tErrors.insufficientPermissions);
```
The more sophisticated (student) variant composes a **field‑ACL** service:
```typescript
// backend/services/student/student-management.service.ts:34-39
const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);
assertStudentFieldEdit(fieldCtx, "student_quota_edit");
```
> **Recommendation:** add new permission keys to the `AppPermission` enum (e.g. `CERT_MANAGE`, `CERT_GENERATE`, `CERT_VERIFY`, `TEMPLATE_MANAGE`). The enum must then be registered in Pothos through `shared/enum.pothos.ts` (see §C.4). Avoid hardcoding permission strings.

### B.7 Caching (`backend/services/cache/`)

Files: `ICacheService.ts`, `EntityCacheService.ts`, `CacheServiceFactory.ts`, `RedisCacheAdapter.ts`, `PostgresCacheAdapter.ts`, `ApolloCacheAdapter.ts`.

**Two cache surfaces:**

**(1) Cache provider abstraction (`CacheServiceFactory`) — generic key/value:**
```typescript
type CacheProvider = "redis" | "postgres";            // backend/services/cache/ICacheService.ts:13
const cacheService = getCacheService();               // async singleton
await cacheService.get(key);  await cacheService.set(key, val, { ex });
await cacheService.pipeline([{ command: "set", args: [k, v, "EX", 60, "NX"] }]);
```

**(2) Entity read cache (`EntityCacheService`) — `cachedRead` / `cachedReadSingleFlight`:** `backend/services/cache/EntityCacheService.ts:137-242`
```typescript
const entry = { version: CACHE_VERSION, data, cachedAt: Date.now() };
await cachedRead<T>(key, ttlSeconds, loader, tags = []);
await cachedReadSingleFlight<T>(key, ttl, loader, tags);  // Postgres insertIfNotExists / Redis SETNX
```
Key contracts (from `services/AGENTS.md` "Hot‑resolver & Read Caching"):
- **Fail‑open:** every read/write wraps provider errors in `try/catch` and falls through to the loader/DB. `cachedRead` already swallows errors internally (EntityCacheService.ts:147-181) and only `recordHit/miss`; never throw on cache failure.
- **Permission gate happens BEFORE cache lookup** — authorization must execute before `cachedRead`.
- **Tag invalidation** — keys are indexed into `tag:<name>` → list-of-keys; `invalidateTag(tag)` deletes all listed keys (EntityCacheService.ts:244-289). Named helpers:
  ```typescript
  invalidateParentWrite(parentId, userId);   invalidateTeacherWrite(teacherId, userId);
  invalidateClassLifecycle(teacherId, parentId);   invalidateRoleChange(userId);
  ```
- **Key shapes are documented:** `ec:user:${userId}:${roleId}`, `ec:teacher:byUserId:${userId}:${roleId}`, `ec:teacher:dir:${roleId}:${stableStringify(queryArgs)}`, etc.
- `stableStringify()` (EntityCacheService.ts:93) sorts object keys, so query‑arg maps produce deterministic keys.
- `CACHE_VERSION = 1`; entries with wrong version are ignored as a cache miss.
- A `dateReviver` (line 17) rehydrates ISO timestamps into `Date`s on read, so callers always see `Date` (a certificate service can write `createdAt` directly without `toISOString()` guards).
- `getEntityCacheStats()` exposes per‑prefix hit/miss counters (line 80).

> **Recommendations for certificates:**
> - Cache certified‑render results via `cachedReadSingleFlight` (avoids duplicate generation under concurrent requests): key `ec:cert:render:${templateVersionId}:${recipientGroupId}`; tag `cert:render` (and per-template `cert:tmpl:${templateId}`).
> - Since generation is expensive, prefer **single‑flight** to coalesce concurrent requests. Invalidate on template edit (`cert:tmpl:<id>`) or revoke.
> - Expose `invalidateCertificateTemplateWrite(templateId)` / `invalidateCertificateWrite(certificateId)` named helpers.
> - **Keep permission checks OUTSIDE `cachedRead`** (rule applied identically to teacher/parent dirs).

### B.8 Idempotency (`backend/services/idempotency.service.ts`)

Two operations, namespace style:
```typescript
// backend/services/idempotency.service.ts:3-17
namespace IdempotencyService {
  checkAndMark(key, userId): Promise<boolean>     // true = first call, false = duplicate
  release(key, userId): Promise<void>             // free the idempotency slot
}
```
- Storage = Postgres `CacheDbRepository.insertIfNotExists(key, "used", expiresAt)`; expiry = **24h** (`Date.now() + 24*60*60*1000`).
- Key format = `idempotency:${userId}:${key}` — scoped per user.
- The canonical pattern is **DB unique index**, more reliable than this service though:
```typescript
// backend/services/billing/billing-management.service.ts:32-41
function deriveIdempotencyKey(input) {
  const parts = [input.parentId, input.studentId ?? "", input.amount, input.currency, input.invoiceType];
  return createHash("sha256").update(parts.join(":")).digest("hex");
}
// buildInvoiceInsertPayload:74
idempotencyKey: input.idempotencyKey ?? deriveIdempotencyKey(input),
```
That key is persisted on the `invoices` row and enforced by **`uniqueIndex("invoices_idempotency_key_unique_idx")`** (`backend/db/schema/billing/billing.ts`). A duplicate insert will hit the unique constraint and throw — the caller normalizes to a localized error.

> **Recommendation:** for certificate *generation* (write once per (student,template,recipientGroup)), add an `idempotencyKey` column with a **`uniqueIndex`**. Generate via `sha256` over `(templateId, studentId, recipientGroupId, versionId)`. Mutations accept an optional `idempotencyKey` (mirroring the student create input that already carries an `idempotencyKey: t.string({ required: true })` at `pothos/students/student.pothos.ts:97`). `IdempotencyService.checkAndMark/release` is suitable for *non‑persistent* transient mutexes (e.g. test setup); **prefer the DB unique constraint** for durable writes.

### B.9 PDF generation — status quo

- Installed (`package.json`): `pdf-lib@^1.17.1`, `@pdf-lib/fontkit@^1.1.1`, `@pdfme/common|schemas|ui@^6.1.12`, `puppeteer@^25.4.0`.
- **No backend code currently imports any of them** (grep across `backend/` and `shared/` returns no source references). They were installed in anticipation of the certificate feature.
- No existing invoice PDF code; only *payment‑proof files* are uploaded as pre‑existing files via the storage flow (no on‑the‑fly PDF rendering).
- `html-to-image` does not appear in Siraj (note the CGVS analysis saw it in the *prior* project; in Siraj it is absent).

> **Recommendations for cert PDF generation:**
> - Create a new **`backend/services/cert/renderer.service.ts`** namespace (`CertificateRendererService.renderPdf(input): Promise<{filePath, fileSize, contentHash}>`).
> - Keep the renderer service pure (no repository reads for auth): pass all resolved variables in; the orchestration service does lookups.
> - For PDFs of mostly text + images + qrcode, use `pdf-lib` + `@pdfme/schemas` (template-driven, no headless browser). Reserve `puppeteer` for HTML/CSS‑rich templates — it is heavier and slower and should be cached via `cachedReadSingleFlight` (§B.7).
> - The rendered PDF must flow through the **storage upload pipeline** (§B.10): renderer returns `filePath`, an orchestrator links it to the certificate record via `StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId, usageType: "certificate_file", filePath })`.
> - Generate a verification code and an optional **QR code** (encode the verification URL with code) using `@pdfme/schemas` (barcode/qr schemas) — they render natively without puppeteer.

### B.10 Storage service (`backend/services/storage/`)

#### Files
- `backend/services/storage/storage.service.ts` — 342 lines, `StorageService` namespace.
- `backend/services/storage/site-content.service.ts` — site-content CMS service with audit logging pattern (separate concern).
- `backend/db/repo/shared/signedUrl.repository.ts` — signed URL atomic claim.

#### Key functions (`storage.service.ts`)
- `requireStorageManage(userId, tErrors)` / `requireStorageManageOrOwner(userId, filePath, tErrors)` — permission/owner gates; throw localized `Error` (lines 33–58). **Mirrored by `requireStudentManageStatus` in `student.mutation.ts:14`.**
- `validateUpload(params)` — delegates to `StorageDbRepository.validateUpload`.
- `validateSignedUrlSession(sessionId, filePath)` — checks existence, `used`, `expiresAt`, and path‑match (lines 72–107). Returns `{error, status}` or `null`.
- `claimSignedUrl(sessionId)` — returns metadata (contentType, fileSize, contentHash, filePath); marks token `used` via repo.
- `createFileAndGet(filePath, isProtected?)` — creates a `files` DB record, returns entity (line 131).
- `getFileUsages(filePath)` / `checkFileAccess(userId, filePath)` — reference-table based access (line 168) — supports ownership through `users`, `teachers`, `parents`.
- `linkFileToEntity({referenceTable, referenceId, usageType, filePath})` — **the central file-attachment API** (line 265). Calls `StorageDbRepository.registerFileUsage`.
- `validatePath(filePath)` — refuses `..`, leading `/`, leading `~` (line 233) — copy this guard for any path input on cert mutations. Resolver-side there is also `sanitizeStoragePath` + `validateStoragePath` (see `mutation/storage/storage.mutation.ts:6`).
- `updateDirectoryPermissions` / `setStorageItemProtection` — admin mutations.

#### Upload/upload-storage flow
1. Client calls the **`prepareUpload`** mutation → service calls `StorageAuthService.requireStorageManage` → `getStorageService().prepareUpload()` returns an **`UploadPreparation`** (id, url, uploadType, access). See `pothos/storage/storage.pothos.ts:20-32` and `mutation/storage/storage.mutation.ts:117-139`.
2. Client PUTs bytes to the signed URL.
3. A separate API route validates the session via `validateSignedUrlSession` and **atomically claims** the URL through `SignedUrlRepository.claimSignedUrl` (row-level `FOR UPDATE SKIP LOCKED`, `signedUrl.repository.ts:46-89`).
4. Storage registers a `files` row (`createFileAndGet`) → caller links via `linkFileToEntity`.

#### `getStorageService()` factory
`backend/storage/storage.service.ts` exports `getStorageService(): Promise<StorageService>` — **async singleton** with provider dispatch:
```typescript
type StorageProvider = "gcp" | "local" | "vercel" | "s3" | "r2";
const adapters = { gcp: createGcpAdapter, local: createLocalAdapter, vercel: createVercelAdapter, s3:…, r2:… };
```
Resolvers get it via `const storageService = await getStorageService();` (every storage resolver, e.g. `mutation/storage/storage.mutation.ts:70, 96, …`). Resolves to **GCP in production**, **local** in dev, **Vercel Blob** in Vercel preview.

#### Cache fail-open on file access
`checkFileAccess` (lines 168-196) does **not** cache — but if cached, it must never short‑circuit permission gates (no `cachedRead` wrapping around the user access test). This is the *anti‑pattern called out* in AGENTS.md.

> **Recommendations for certificate storage:**
> - Use **`StorageService.linkFileToEntity({ referenceTable: "certificates", referenceId, usageType: "certificate_pdf", filePath })`** (and `"cert-template-bg"` / `"cert-template-preview"` usage types) to attach rendered PDFs and template background files.
> - Reuse `getFilesForInvoice` analog → add `StorageService.getFilesForCertificate(certificateId, usageType)` (the repo likely has a generic join; mirror invoice helper in `storage.service.ts:213`).
> - For certificate file access checks, expose `StorageService.checkCertificateFileAccess(userId, certificateId, filePath)` — combine file usages with certificate ownership (only the issued student/parent or a staff/admin with `CERT_MANAGE` should download).
> - Path validation is mandatory: call `sanitizeStoragePath` + `validateStoragePath` in resolvers and `StorageService.validatePath` in services.

---

## C. GraphQL Layer (`backend/graphql/`)

### C.1 Builders file — `gqlSchemaBuilder.ts`

Pothos builder is the single source of schema truth. Defined at `backend/graphql/gqlSchemaBuilder.ts:75-150`.

**Plugins (lines 76–86):** Drizzle, AddGraphQL, Directives, Errors, ScopeAuth, WithInput, SimpleObjects, Dataloader, Tracing.

**`PothosTypes` interface (lines 28–70):** the type system wiring.

**Auth scopes (the most central config) — `scopeAuth.authScopes` (lines 92–111):**
```typescript
scopeAuth: {
  authScopes: async ctx => {
    const realUserId = ctx.realUserId ?? ctx.actorUserId ?? ctx.user?.id;
    let actorIsSuperAdmin = ctx.isSuperAdmin;
    if (realUserId)        actorIsSuperAdmin = (await PermissionsService.getUserContext(realUserId)).isSuperAdmin;
    else if (ctx.actorUserId) actorIsSuperAdmin = (await PermissionsService.getUserContext(ctx.actorUserId)).isSuperAdmin;
    return {
      loggedIn: !!ctx.user,
      permission: (key) => ctx.isSuperAdmin || ctx.permissions.includes(key),
      superAdmin: actorIsSuperAdmin,
      notImpersonating: !ctx.isImpersonating,
      notSimulatingGroup: !ctx.isSimulatingGroup,
    };
  },
  unauthorizedError: (_p, _c, _i, result) => { … return new GraphQLError(result.message, { extensions: { code: isUnauthenticated ? "UNAUTHENTICATED" : "FORBIDDEN" } }); },
}
```
The scope map supports both `{ loggedIn: true }` and `{ permission: AppPermission.X }`, as well as **combinations** (e.g. billing uses `{ permission, notImpersonating: true }`).

`unauthorizedError` discriminates **unauthenticated vs forbidden** by inspecting the scope‑failure tree (lines 112–133) and sets the GraphQL error code accordingly — frontends can branch on `extensions.code`.

**Errors plugin (lines 135–140):** just logs resolved errors (`onResolvedError: error => logger.error(...)`). Let errors bubble up to the route handler. Critically, services do NOT throw `GraphQLError` (grep in `backend/services/` finds none); they throw `Error`/`DomainError`. The route layer (Apollo Server) translates to GraphQL errors — service code stays framework‑agnostic per the SSR rule.

**Tracing plugin (lines 141–149):** traces root fields by default; logs resolver execution duration via `wrap`.

**Scalars (lines 39–54):**
```typescript
Scalars: {
  DateTime:       { Input: Date; Output: Date | string };
  Date:           { Input: Date; Output: Date };
  JSON:           { Input: unknown; Output: unknown };
  StringMap:      { Input: Record<string,string>; Output: Record<string,string> };
  LocalizedString:{ Input: LocalizedString; Output: LocalizedString };
  PhoneNumber, Email  // input-validation scalars
}
```
Resolvers glue scalars in `gqlSchema.ts:37-43` (`addScalarType("DateTime", DateTimeResolver)`, etc.). The `constraint` directive SDL is appended inline (lines 16–35 + 49–56) for the Apollo 4 validation plugin.

**Drizzle config:** `{ client: () => db, getTableConfig, relations }`.

**HMR:** `SchemaBuilder.allowPluginReRegistration = true` in dev (line 24); builder is *never* cached on `globalThis` deliberately (lines 73–74) so HMR gets a fresh `ConfigStore`. A dynamic import of `gqlSchema.definitions.ts` (line 166) creates the HMR dependency edge.

### C.2 GraphQL context — `gqlContext.ts` + `gqlContextFactory.ts`

`BaseContext` (gqlContext.ts:7-31) carries:
- `user: { id, displayCurrency } | undefined`, `permissions: AppPermission[]`, `permissionGroups: string[]`, `isSuperAdmin: boolean`, `actorUserId?`, `isImpersonating`, `realUserId?`, `isSimulatingGroup`, `simulatedGroupSlug?`, `refreshToken?`, `sessionId?`, `ipAddress?`, `cookies?`, `role: UserRole`, `locale: string`, `billingFxDisplayCurrency?`, `billingFxDisplayCurrencyByUserId?`, and `t: () => Translations`.

`createContext(...)` (gqlContext.ts:38-98): for unauthenticated requests → guest context with empty permissions, `UserRole.GUEST`, `locale` default `ar`, `t: () => getServerTranslations(locale)`; for authenticated → loads `PermissionsService.getUserContext` (or `getPermissionGroupContext` for group simulation), then `UserRepository.findSafeById` for displayCurrency.

`createGraphQLContext()` (gqlContextFactory.ts:105-146): the function used per‑request by the GraphQL route. Pipeline:
1. Read Next headers/cookies.
2. `refreshToken` (httpOnly), `sessionId`, `accessToken` (cookie fallback).
3. `getLocale` → `NEXT_LOCALE` cookie or `Accept-Language`. Default `ar`.
4. `resolveAuthFromRequest` — verifies JWT (lines 8-67), resolves impersonation via `ImpersonationService.resolveAuthIdentityFromToken`, then group simulation via `PermissionGroupSimulationService.resolveGroupSimulationFromToken`.
5. `getIpAddress` from `x-real-ip`/`x-forwarded-for` (lines 69-78).
6. Calls `createContext` with resolved identity, returns enriched `BaseContext`.

> Cert resolvers don't need to touch context — they use `ctx.user.id`, `ctx.t().errorsTranslations`, `ctx.locale`. The translation `t()` is pre‑locale‑bound.

### C.3 GraphQL definitions/layout

Three parallel trees all side-effect-imported (`gqlSchema.definitions.ts:10-13`):
- `backend/graphql/pothos/` — type + field + input definitions (no top-level fields).
- `backend/graphql/query/` — root query fields.
- `backend/graphql/mutation/` — root mutation fields.

Each tree has its own `index.ts` barrel importing every domain folder. `mutation/index.ts` example:
```typescript
import "./auth"; import "./billing"; import "./classes"; import "./meeting";
import "./notifications"; import "./profile"; import "./scheduling";
import "./shared"; import "./storage"; import "./students"; import "./teachers";
```
There is **no** `cert` folder yet — must be added in each of `pothos/`, `query/`, `mutation/` and added to the three `index.ts` barrels.

`pothos/index.ts` is a `export * from "@/backend/graphql/pothos/<domain>"` barrel so any file importing the root can resolve object refs by namespace.

### C.4 Pothos enum registration

Canonical registration site: `backend/graphql/pothos/shared/enum.pothos.ts`. The whole file is ~40 enum registrations, each:
```typescript
export const AppPermissionPothosEnum    = gqlSchemaBuilder.enumType(AppPermission,    { name: "AppPermission" });
export const InvoiceTypePothosObject     = gqlSchemaBuilder.enumType(InvoiceType,     { name: "InvoiceType" });
export const InvoiceStatusPothosObject  = gqlSchemaBuilder.enumType(InvoiceStatus,  { name: "InvoiceStatus" });
export const ProfileModePothosEnum       = gqlSchemaBuilder.enumType(ProfileMode,     { name: "ProfileMode" });
// … 40+ enums
```
Then domain Pothos files import them: `import { ProfileModePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos"`.

Two `enumType` overloads coexist:
- **Enum-object form** (preferred, canonical): `gqlSchemaBuilder.enumType(MyEnum, { name })`. (Used for ~40 enums.)
- **Name+values map form** (rare): `gqlSchemaBuilder.enumType("SystemSettingCategory", { values: { app: { value: SystemSettingCategory.App }, … } })` (lines 213-241). Used when the enum must be split between camelCase GraphQL keys and PascalCase TS enum values.
  - **Hardcoding string arrays is PROHIBITED** by `pothos/AGENTS.md` — must always reference `backend/enum/` enums.

> **Certificate enums to add in `backend/enum/`:** `CertificateStatus { PENDING, ISSUED, REVOKED, EXPIRED }`, `CertificateResolution { LOW, MEDIUM, HIGH, ARCHIVAL }`, `CertificateVerificationResult { VALID, REVOKED, NOT_FOUND, EXPIRED }`, `TemplateVariableType { TEXT, NUMBER, DATE, SELECT, IMAGE }`, `TemplateElementSource { STUDENT, VARIABLE, CERTIFICATE }`. Register each once in `pothos/shared/enum.pothos.ts`. Then run `bun run generate:gqlSchema` and `bun codegen`.

### C.5 Object type pattern — single canonical

Object refs back onto `{Entity}ReturnType` from `backend/types/`. Examples:

```typescript
// backend/graphql/pothos/students/student.pothos.ts:21-69
export const StudentPothosObject = gqlSchemaBuilder
  .loadableObjectRef<Student, string>("Student", {
    load: async (ids: string[]) => StudentRepository.loadByIds(ids),  // batch repo
    sort: s => s.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      name: t.exposeString("name", { nullable: false }),
      gender: t.field({ type: GenderPothosObject, nullable: true, resolve: s => s.gender }),
      status: t.field({ type: StudentStatusPothosObject, nullable: false, resolve: s => s.status }),
      …
    }),
  });
```
Note `loadableObjectRef` — couples the type to a DataLoader batch loader (§C.7).

For a *simple* object (no batch load), use plain `objectRef` as in `pothos/storage/storage.pothos.ts:74`:
```typescript
export const FileInfoPothosObject = gqlSchemaBuilder.objectRef<Types.FileInfo>("FileInfo").implement({
  interfaces: [StorageItemPothosInterface],
  isTypeOf: item => typeof item === "object" && item !== null && "size" in item,
  fields: t => ({ … }),
});
```
**Interfaces** are supported (line 66): `interfaceRef<Types.StorageObject>("StorageObject")`. `isTypeOf` discriminates implementations (e.g. has `size` → FileInfo; else DirectoryInfo). Certificates likely need an interface (`CertificateObject`) separating `IssuedCertificate` and `RevokedCertificate` only if they diverge significantly; otherwise one object.

### C.6 Input types

Inputs are defined via `inputRef<{InputType}>` from `backend/types/`:
```typescript
// pothos/students/student.pothos.ts:71-99
export const StudentCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentCreateInput>("StudentCreateInput")
  .implement({ fields: t => ({
    parentId: t.string({ required: true }),
    dateOfBirth: t.field({ type: "DateTime", required: false }),
    gender:     t.field({ type: GenderPothosObject, required: false }),
    status:     t.field({ type: StudentStatusPothosObject, required: true }),
    idempotencyKey: t.string({ required: true }),          // ← pattern!
  }) });
```
*A `WithInputPlugin` is configured in the builder* (line 79 in builder) but the codebase prefers **explicit `inputRef` + `args: { input: t.arg({ type, required: true }) }`** in mutations (see §C.9). Either is acceptable; existing domains universally use explicit `inputRef`.

Filter inputs are enumerations of predicate variants (see `StudentFilterArgsPothosObject` lines 140-181 — `parentId`, plus per-field predicates: `nameContains`, `createdAtFrom`/`To`, etc.). For certificates, a `CertificateFilterArgs` would mirror this shape (`status`, `studentId`, `templateId`, `issuedAtFrom/To`).

### C.7 DataLoader (DataloaderPlugin)

**Plugin registered:** `DataloaderPlugin` in the builder. Two usage styles:

**(1) Object-level batch — `loadableObjectRef`** (coupled to type):
```typescript
// pothos/students/student.pothos.ts:21-26
.loadableObjectRef<Student, string>("Student", {
  load: async (ids: string[]) => StudentRepository.loadByIds(ids),
  sort: s => s.id,
})
```
The `load` callback returns an **array sorted by `sort`** — Pothos re-aligns with requested IDs. The batch repo method (`loadByIds`) uses `inArray(column, ids)` (see `pothos/AGENTS.md` "DataLoader Batching" — they suggest the transaction fallback pattern for ordering).

**(2) Field-level batch — `t.loadable({ load, resolve })`** for scalar/object subfields:
```typescript
someField: t.loadable({ load: (keys) => repo.batchGet(keys), resolve: (parent, child) => child, }),
```
Caveat from AGENTS.md: **`t.loadable()` cannot return list types**; use `t.field()` with a manual batch instead for arrays (e.g. `[AppPermissionPothosEnum]` permissions).

**Batch service method naming convention** (from `services/AGENTS.md`): `resolve{Entity}IdsForUsers` / `get{Entity}Contexts`, returning `Map<string, T | null>`. Example realized in `PermissionsService.getUserContexts(userIds)` (`permissions.service.ts:180-244`).

**Batch repository pattern:** use `inArray(column, sql.placeholder("ids"))` — `permissions.service.ts:160-178` shows its own `fetchPermissionKeysForUsers` building the `Map` from an `inArray` query.

> **For cert DataLoader:**
> - `CertificatePothosObject` via `loadableObjectRef<CertificateReturnType, string>("Certificate", { load: ids => CertificateRepository.loadByIds(ids), sort: c => c.id })`.
> - Don't use loadable for `[CertificateFilePothosObject]` (array) — instead use a manual batch: `t.field({ resolve: async (parent) => … })`. Better: a service-level batch method `resolveCertificateFilesForIds(certificateIds): Promise<Map<string, FileUsageInfo[]>>`.

### C.8 Query/mutation structure

**Per-domain file split:** each domain's `mutation/<domain>` folder contains domain-specific mutation files and an `index.ts` barrel:
```
mutation/students/ → index.ts, student.mutation.ts, student-profile-edit.mutation.ts
mutation/storage/  → index.ts, storage.mutation.ts
mutation/billing/  → … (multiple files per concern)
```

**Mutation style — `mutationFields(t => ({ ... }))` block:**
```typescript
// mutation/students/student.mutation.ts:21-65
gqlSchemaBuilder.mutationFields(t => ({
  partiallyUpdateStudent: t.field({
    type: StudentPothosObject,
    authScopes: { permission: AppPermission.STUDENTS_EDIT },
    args: { input: t.arg({ type: PartialStudentUpdateInputPothosObject, required: true }) },
    resolve: async (_query, args, ctx) => {
      const userId = await requireAuth(ctx);              // throws localized unauthorized
      const tErrors = ctx.t().errorsTranslations;
      …
      return StudentRepository.partiallyUpdate(restInput, tErrors).then(StudentUtils.mapEntityToDto);
    },
  }),
  deleteStudent: t.field({ authScopes: { loggedIn: true }, … }),
}));
```

**Alternative style — `mutationField(name, t => t.field({ ... }))`:** billing uses this additive form (one mutation per call), which scales better for large domains:
```typescript
// pothos/billing/billing-management.pothos.ts:143-188
gqlSchemaBuilder.mutationField("createManualInvoice", t =>
  t.field({
    type: ManualInvoiceResultRef,
    authScopes: { permission: AppPermission.BILLING_CREATE_INVOICE, notImpersonating: true },
    args: { parentId: t.arg.string({ required: true }), … },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      const result = await BillingManagementService.createManualInvoice(userId, { … }, tErrors);
      const displayAmounts = await resolveDisplayAmountFields([result], ctx, "amount", "currency");
      return { ...result, displayAmount: displayAmounts.get(result.id) ?? null };
    },
  })
);
```
**A subtle distinction:** billing Pothos files colocate queries/mutations with the object types in `pothos/billing/*.pothos.ts`; storage/students keep them in dedicated `mutation/` folders. Both are valid. **Recommendation:** colocate certificate Pothos types in `pothos/cert/certificate.pothos.ts` and `pothos/cert/template.pothos.ts` (mirror billing), but use `mutation/cert/` for mutations (mirror students/storage) for cleaner review diffs.

### C.9 Auth scopes — applied to resolvers

Two scopes are used in practice:
- `{ loggedIn: true }` — for not‑auth‑specific mutations where the resolver later does finer checks (delete: StorageService `requireStorageManageOrOwner`, StudentService `requireStudentManageStatus`).
- `{ permission: AppPermission.X }` — direct permission gate at schema level. Combined with `{ notImpersonating: true }` for mutation safety (billing examples). Sometimes `{ notSimulatingGroup: true }` for system admin.

The `authScopes.permission` callback checks `ctx.isSuperAdmin || ctx.permissions.includes(key)` — so **super admins are always allowed** unless the rule is enforced differently in the service.

`requireAuth(ctx)` (`utils/requireAuth.ts:1-9`) is called at the **top of every resolver** *in addition* to `authScopes`, to map `ctx.user.id` into a reliably non-null `userId`. This double protection is universal.

```typescript
export async function requireAuth(ctx: BaseContext): Promise<string> {
  if (!ctx.user?.id) {
    const tErrors = ctx.t().errorsTranslations;
    throw new Error(tErrors.unauthorized);
  }
  return ctx.user.id;
}
```
Other utils: `requireNotImpersonating.ts`, `delete-entity-resolver.ts`, `class-session.utils.ts`.

> **For cert mutations:** use `{ permission: AppPermission.CERT_GENERATE, notImpersonating: true }` for the generation mutation; `{ permission: AppPermission.CERT_REVOKE, notImpersonating: true }` for revocation; `{ loggedIn: true }` for read queries where verification is public. Always call `requireAuth(ctx)` at resolver top.

### C.10 Errors plugin — runtime behavior

The `ErrorsPlugin` (`@pothos/plugin-errors`) is configured only to *log*:
```typescript
errors: { defaultTypes: [], onResolvedError: error => logger.error("Handled error:", error) },
```
(i.e. no custom error types registered). Services throw plain `Error`/`DomainError`; the GraphQL route layer (Apollo Server in `app/api/graphql/route.ts`) wraps them. The `unauthorizedError` callback (builder lines 112-133) on the *ScopeAuth plugin* maps auth‑scope failures to a `GraphQLError` with `extensions.code = "UNAUTHENTICATED" | "FORBIDDEN"`.

This means the only GraphQL-aware error creation in the codebase is:
1. `ScopeAuthPlugin.unauthorizedError` for permission failures — already configured globally.
2. `GraphQLError` thrown explicitly **inside resolvers** when needed — see example in `graphql/AGENTS.md`:
   ```typescript
   const tErrors = await ctx.t("errors"); throw new GraphQLError(tErrors.auth.invalidCredentials, ...);
   ```
   In practice, resolvers throw `Error(tErrors.<key>)` and let the route wrap them.

> For cert errors, **services throw `DomainError`(code, localized message) or `Error(tErrors.cert.*)`**; resolvers just propagate. **No** service throws `GraphQLError`. Add cert keys to the `errors` namespace translation messages.

### C.11 Scalars

Defined under `backend/graphql/scalars/`: `jsonScalar.ts`, `emailScalar.ts`, `phoneNumberScalar.ts`, `stringMapScalar.ts`, `localizedStringScalar.ts`. `Date` and `DateTime` come from `graphql-scalars` (`gqlSchema.ts:4, 37-38`). For certificates the `DateTime` scalar covers all date fields; the `LocalizedString` scalar can power localized certificate titles/award text (ar/en). `JSON` is useful for arbitrary variable values payload.

### C.12 Notification/audit side-effects (relevant for entities like certificates)

Although not the focus, several services emit notifications / write audit logs as **fire‑and‑forget from the main write path** (best‑effort, failure is logged and does not roll back). Patterns observed:

```typescript
// student-management.service.ts:62-71 (fire-and-forget notification dispatch)
await dispatchStudentQuotaOverriddenNotifications(studentId, name, n, locale)
  .catch(error => { logger.error("Student quota override notification dispatch failed", { …, error }); });
```
The dispatch is built via `dispatchWithPreferences(payloads, targetUserIds, locale)` (`notification-dispatch.helpers`), payloads constructed via `buildStudentLifecyclePayloads` (`notification-payloads.builders`). `PermissionsService.getUserIdsWithPermission(key)` resolves reviewer fan‑outs (soft‑fails to `[]`).

`site-content.service.ts` writes audit logs via `AuditService.createManyAuditLogs` wrapped in try/catch.

> For certificates: publish `NotificationEventType.CERTIFICATE_ISSUED` (add to enum + register in `enum.pothos.ts`), build payloads via a new `notification-payloads.builders.ts` helper (`buildCertificateIssuedPayloads`), and dispatch best‑effort. Mirror `backend/services/billing/billing-management.service.ts` which does exactly this for invoices on `INVOICE_GENERATED`/`INVOICE_STATUS_CHANGED` events.

---

## D. Certificate Feature — Concrete Integration Blueprint

Below is a concrete, AGENTS‑compliant blueprint synthesizing the preceding patterns. Use it as the design contract for the implementation phase.

### D.1 File inventory (to create)

| Layer | Path | Purpose |
|---|---|---|
| DB schema | `backend/db/schema/cert/certificates.ts` | `certificates` table w/ `idempotencyKey` + `UNIQUE(index)` |
| DB schema | `backend/db/schema/cert/templates.ts` | `certificateTemplates` + `templateElements` + `templateVariables` |
| DB schema | `backend/db/schema/cert/template-recipient-groups.ts` | recipient groups + items + variable values |
| Enum | `backend/enum/cert/certificate.enum.ts` | `CertificateStatus`, `CertificateResolution`, `CertificateVerificationResult` |
| Enum | `backend/enum/cert/template.enum.ts` | `TemplateElementSource`, `TemplateVariableType`, `TemplateLayout` |
| Types | `backend/types/cert/*.types.ts` | `CertificateReturnType`, `TemplateReturnType`, `…SubmitInput`, etc. |
| Repository | `backend/db/repo/cert/certificate.repository.ts` w/ `loadByIds` (batch) | CRUD + targeted predicates |
| Service | `backend/services/cert/certificate-generation.service.ts` | orchestrator (`generateCertificate(actorUserId, input, tErrors, locale)`) |
| Service | `backend/services/cert/certificate-verification.service.ts` | `verifyCertificate(code): Promise<CertificateVerificationResultReturnType>` |
| Service | `backend/services/cert/renderer.service.ts` | `renderPdf(input)` — pdf-lib / pdfme (no puppeteer unless needed) |
| Service | `backend/services/cert/template-management.service.ts` | CRUD + `assertTemplateOwner` |
| Service | `backend/services/cert/index.ts` + add to `backend/services/index.ts` | barrel |
| Pothos | `backend/graphql/pothos/cert/certificate.pothos.ts` | `CertificatePothosObject` (`loadableObjectRef`) + inputs |
| Pothos | `backend/graphql/pothos/cert/template.pothos.ts` | `CertificateTemplatePothosObject` |
| Pothos | `backend/graphql/pothos/shared/enum.pothos.ts` (edit) | register new enums once |
| Mutation | `backend/graphql/mutation/cert/certificate.mutation.ts` | `generateCertificate`, `revokeCertificate` |
| Mutation | `backend/graphql/mutation/cert/template.mutation.ts` | CRUD on templates |
| Query | `backend/graphql/query/cert/certificate.query.ts` | `certificate`, `verifyCertificate`, `certificateByStudent` |
| Barrels | edit `pothos/index.ts`, `mutation/index.ts`, `query/index.ts` | add cert sub-trees |
| i18n | `shared/locale/messages/{ar,en}/errors.cert.ts` | localized keys |
| Cache | (optional) `backend/services/cert/cache.ts` | `invalidateCertificateTemplateWrite`, etc. |

### D.2 Service method signature (mirrors billing/student patterns)

```typescript
// backend/services/cert/certificate-generation.service.ts
import { createHash } from "node:crypto";
import { AppPermission } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib";
import { PermissionsService } from "@/backend/services";
import { CertificateRepository, TemplateRepository } from "@/backend/db/repo";
import { StorageService } from "@/backend/services/storage";
import { CertificateRendererService } from "./renderer.service";
import type { ErrorsLabels } from "@/shared/locale";
import type * as Types from "@/backend/types";

export namespace CertificateGenerationService {
  export async function generateCertificate(
    actorUserId: string,
    input: Types.GenerateCertificateInput,
    tErrors: ErrorsLabels,                 // localized errors (yet not an unknown stack overflow)
    locale?: string,
  ): Promise<Types.CertificateReturnType> {
    await requirePermission(actorUserId, AppPermission.CERT_GENERATE, tErrors);

    const template = await TemplateRepository.findById(input.templateId);
    if (!template) throw new NotFoundError("TEMPLATE", tErrors.cert.templateNotFound(input.templateId));

    const recipientGroup = await TemplateRepository.findRecipientGroup(input.templateRecipientGroupId);
    if (!recipientGroup) throw new NotFoundError("RECIPIENT_GROUP", tErrors.cert.recipientGroupNotFound);

    // Build deterministic idempotency key
    const idempotencyKey = input.idempotencyKey
      ?? deriveCertificateIdempotencyKey({ templateId: template.id, templateVersionId: template.versionId, recipientGroupId: recipientGroup.id });

    // Render via pure renderer service
    const { filePath, fileSize, contentHash } = await CertificateRendererService.renderPdf({
      template,
      recipientGroup,
      locale,
    });

    // Insert record (DB unique on idempotencyKey throws on dup →LocalizedError)
    const certificate = await CertificateRepository.createCertificate({
      templateId: template.id, studentId: recipientGroup.studentId,
      recipientGroupId: recipientGroup.id, versionId: template.versionId,
      filePath, verificationCode: generateVerificationCode(),
      status: "ISSUED", idempotencyKey, createdByUserId: actorUserId,
    });

    // Link PDF file to certificate record (used by StorageService.checkFileAccess)
    await StorageService.linkFileToEntity({
      referenceTable: "certificates", referenceId: certificate.id,
      usageType: "certificate_pdf", filePath,
    });

    // Best-effort notification dispatch (mirrors billing)
    dispatchCertificateIssuedNotification(certificate.id, certificate.studentId, locale)
      .catch(e => logger.error("cert issued notification failed", e));

    return mapToReturnType(certificate);
  }
}

function deriveCertificateIdempotencyKey(parts: { templateId, templateVersionId, recipientGroupId }): string {
  return createHash("sha256").update([parts.templateId, parts.templateVersionId, parts.recipientGroupId].join(":")).digest("hex");
}

async function requirePermission(userId, key, tErrors): Promise<void> {
  const ok = await PermissionsService.hasAnyPermission(userId, [key]);
  if (!ok) throw new Error(tErrors.insufficientPermissions);
}
```

### D.3 Pothos object + mutation (mirror students + billing)

```typescript
// backend/graphql/pothos/cert/certificate.pothos.ts
import { gqlSchemaBuilder } from "@/backend/graphql/gqlSchemaBuilder";
import { CertificateStatusPothosEnum, CertificateResolutionPothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
import type { CertificateReturnType, GenerateCertificateInput } from "@/backend/types";

export const CertificatePothosObject = gqlSchemaBuilder
  .loadableObjectRef<CertificateReturnType, string>("Certificate", {
    load: async (ids: string[]) => CertificateRepository.loadByIds(ids),
    sort: c => c.id,
  })
  .implement({
    fields: t => ({
      id: t.exposeString("id", { nullable: false }),
      verificationCode: t.exposeString("verificationCode", { nullable: false }),
      status: t.field({ type: CertificateStatusPothosEnum, nullable: false, resolve: c => c.status }),
      resolution: t.field({ type: CertificateResolutionPothosEnum, resolve: c => c.resolution }),
      studentId: t.exposeString("studentId", { nullable: false }),
      templateId: t.exposeString("templateId", { nullable: false }),
      issueDate: t.expose("issueDate", { type: "DateTime", nullable: false }),
      revokedAt: t.expose("revokedAt", { type: "DateTime" }),
      // fileUrl resolved manually (loadable doesn't support list; here it's a single)
      fileUrl: t.field({
        type: "String",
        resolve: async c => (await getStorageService()).fileSignedUrl(c.filePath),
      }),
    }),
  });

export const GenerateCertificateInputRef = gqlSchemaBuilder
  .inputRef<GenerateCertificateInput>("GenerateCertificateInput")
  .implement({ fields: t => ({
    templateId: t.string({ required: true }),
    templateRecipientGroupId: t.string({ required: true }),
    idempotencyKey: t.string({ required: false }),     // optional; auto-derived otherwise (mirror invoice)
  }) });
```

```typescript
// backend/graphql/mutation/cert/certificate.mutation.ts
gqlSchemaBuilder.mutationField("generateCertificate", t =>
  t.field({
    type: CertificatePothosObject,
    authScopes: { permission: AppPermission.CERT_GENERATE, notImpersonating: true },
    args: { input: t.arg({ type: GenerateCertificateInputRef, required: true }) },
    resolve: async (_root, args, ctx) => {
      const userId = await requireAuth(ctx);
      const tErrors = ctx.t().errorsTranslations;
      return CertificateGenerationService.generateCertificate(userId, args.input, tErrors, ctx.locale);
    },
  })
);
```

### D.4 Verification endpoint (public, `loggedIn: true`)

```typescript
gqlSchemaBuilder.queryField("verifyCertificate", t =>
  t.field({
    type: CertificateVerificationResultRef,
    nullable: false,
    authScopes: { loggedIn: true },          // or absent for true public
    args: { verificationCode: t.arg.string({ required: true }) },
    resolve: async (_root, args, ctx) => {
      const tErrors = ctx.t().errorsTranslations;
      return CertificateVerificationService.verifyCertificate(args.verificationCode, tErrors);
    },
  })
);
```

### D.5 Cache strategy

```typescript
// backend/services/cert/cache.ts
import { cachedReadSingleFlight, invalidateTag } from "@/backend/services/cache/EntityCacheService";

export async function getRenderedCertificatePdf(certificateId: string): Promise<Buffer> {
  return cachedReadSingleFlight(
    `ec:cert:pdf:${certificateId}`,
    60 * 60,                                   // 1h
    async () => CertificateRendererService.renderPdfFromCertificateId(certificateId),
    [`cert:${certificateId}`],
  );
}

export async function invalidateCertificateWrite(certificateId: string): Promise<void> {
  await invalidateTag(`cert:${certificateId}`);
}
export async function invalidateTemplateWrite(templateId: string, versionId: string): Promise<void> {
  await invalidateTags([`cert:tmpl:${templateId}`, `cert:tmpl:v:${versionId}`]);
}
```
Generation invalidates **only** if the template is re-published (versionId changes) — the DB uniqueness on `idempotencyKey` ensures the same cert generation params won't accidentally insert twice.

### D.6 Idempotency & storage

- Persist `idempotencyKey varchar(255).notNull()` on `certificates`, `uniqueIndex("certificates_idempotency_key_unique_idx")`. Duplicate insert → 23505 Postgres error → resolver maps to `tErrors.cert.duplicateCertificate`.
- For template version control, use `template_version_id` so a re-publish creates a new version row; old certs reference the old version, ensuring historical fidelity and avoiding retroactive PDF changes.

### D.7 Notification + audit

- Add `NotificationEventType.CERTIFICATE_ISSUED`, `CERTIFICATE_REVOKED` to the enum → re-export `backend/enum/index.ts` → register in `enum.pothos.ts`.
- Build `backend/services/notification/notification-payloads.builders.ts` addendum: `buildCertificateIssuedPayloads(certificateId, studentId, targetUserIds, locale)`.
- Best-effort dispatch via `dispatchWithPreferences` after `StorageService.linkFileToEntity` (mirror `billing-management.service.ts:62-71`).
- Optionally write an audit log via `AuditService.createManyAuditLogs` for template publish/revoke (mirror `site-content.service.ts`).

---

## E. Things to double-check during implementation

1. **Enum registration only once** in `pothos/shared/enum.pothos.ts` after defining them in `backend/enum/cert/`. Re-registering produces the `"X" has already been declared` runtime error. Always run `bun run generate:gqlSchema` then `bun codegen`.
2. **Batch service methods**: `CertificateRepository.loadByIds(ids): Promise<(Certificate | null)[]>` returning an array aligned with the input order (or use `Map`); any field resolver reading certificate relations (e.g., the student's certificates) must avoid N+1.
3. **`t.loadable()` cannot return arrays** — for `[CertificateFilePothosObject]` use a manual batch service (`resolveCertificateFilesForIds` → `Map<string, FileUsageInfo[]>`) inside `t.field`.
4. **Permission gate before cache lookup.** Never wrap a permission check inside `cachedRead`/`cachedReadSingleFlight`.
5. **i18n errors** — services accept `tErrors: ErrorsLabels` and `locale?: string`; resolvers source them via `ctx.t().errorsTranslations` and `ctx.locale`. Add `cert.*` keys in both locales.
6. **Path validation** — certificate file paths coming from input must pass `sanitizeStoragePath` + `validateStoragePath` (resolver) and `StorageService.validatePath` (service).
7. **`requireAuth(ctx)`** at the top of every resolver even when `authScopes` already gate; both must agree.
8. **Never throw `GraphQLError` from a service** — keep services SSR-clean; only `ScopeAuth.unauthorizedError` and explicit resolver code construct `GraphQLError`.
9. **Type from `backend/types/`** — every Pothos object/input uses `{Entity}ReturnType`/`{Entity}SubmitInput` types as bases; never define local entity types in `*.pothos.ts`.
10. **HMR safety** — new enum/object registrations trigger HMR of the builder; the dev-only `allowPluginReRegistration = true` and the `gqlSchema.definitions.ts` dynamic import edge already cover new domain folders as long as they are added to `pothos/index.ts`, `query/index.ts`, and `mutation/index.ts`.

---

## F. References (file:line anchors)

### Services
- `backend/services/AGENTS.md` — authoritative rules
- `backend/services/index.ts:1-17` — domain barrel
- `backend/services/storage/storage.service.ts:22-302` — `StorageService` namespace full surface
- `backend/services/storage/storage.service.ts:33, 45` — `requireStorageManage`/`requireStorageManageOrOwner`
- `backend/services/storage/storage.service.ts:168-196` — `checkFileAccess`
- `backend/services/storage/storage.service.ts:265-279` — `linkFileToEntity`
- `backend/services/storage/site-content.service.ts:31-42` — `SiteContentValidationError` code pattern
- `backend/services/auth/permissions.service.ts:15-90` — `PermissionsService` core
- `backend/services/auth/permissions.service.ts:180-254` — `getUserContexts` (batch)
- `backend/services/student/student-management.service.ts:16-79` — service + permission + notification 1
- `backend/services/idempotency.service.ts:3-17` — `IdempotencyService`
- `backend/services/billing/billing-management.service.ts:32-77` — `deriveIdempotencyKey` + insert payload
- `backend/services/billing/billing-management.service.ts:299, 320, 387, 555, 635` — `NotFoundError("INVOICE", …)` usage
- `backend/services/cache/EntityCacheService.ts:137-181` — `cachedRead` + fail-open
- `backend/services/cache/EntityCacheService.ts:198-242` — `cachedReadSingleFlight`
- `backend/services/cache/EntityCacheService.ts:244-327` — tag invalidation helpers
- `backend/services/cache/ICacheService.ts:13` — `CacheProvider = "redis" | "postgres"`
- `backend/lib/errors.ts:1-28` — `DomainError`/`NotFoundError`/`UnauthorizedError`/`ForbiddenError`
- `backend/lib/index.ts:5` — errors re-export
- `backend/storage/storage.service.ts:1-80` — `getStorageService()` async singleton factory
- `backend/db/repo/shared/signedUrl.repository.ts:46-89` — atomic CLAIM (`FOR UPDATE SKIP LOCKED`)
- `shared/locale/server-graphql.ts:3` — `getServerTranslations(locale)`

### GraphQL
- `backend/graphql/AGENTS.md` & `backend/graphql/pothos/AGENTS.md` — rules
- `backend/graphql/gqlSchemaBuilder.ts:75-150` — builder config (plugins, scopes, scalars, tracing, errors)
- `backend/graphql/gqlSchemaBuilder.ts:92-111` — `authScopes` callback
- `backend/graphql/gqlSchemaBuilder.ts:112-133` — `unauthorizedError` (UNAUTHENTICATED vs FORBIDDEN)
- `backend/graphql/gqlSchemaBuilder.ts:135-140` — errors plugin (logs only)
- `backend/graphql/gqlSchemaBuilder.ts:39-54` — scalar types map
- `backend/graphql/gqlSchema.ts:1-56` — scalar registration + constraint directive SDL
- `backend/graphql/gqlSchema.definitions.ts:10-13` — side-effect register tree edges
- `backend/graphql/gqlContext.ts:7-31` — `BaseContext`
- `backend/graphql/gqlContext.ts:38-98` — `createContext`
- `backend/graphql/gqlContextFactory.ts:8-67` — JWT + impersonation + group-sim resolution
- `backend/graphql/gqlContextFactory.ts:105-146` — `createGraphQLContext()`
- `backend/graphql/utils/requireAuth.ts:1-9` — `requireAuth(ctx)`
- `backend/graphql/pothos/shared/enum.pothos.ts:49-253` — all enum registrations (canonical)
- `backend/graphql/pothos/students/student.pothos.ts:21-69` — `loadableObjectRef` object
- `backend/graphql/pothos/students/student.pothos.ts:71-99, 140-181` — input/filter input patterns
- `backend/graphql/pothos/storage/storage.pothos.ts:20-208` — object/interface/input variety
- `backend/graphql/pothos/billing/billing-management.pothos.ts:69-287` — mutationField additive style + result flattening
- `backend/graphql/mutation/students/student.mutation.ts:21-65` — mutationFields block style
- `backend/graphql/mutation/storage/storage.mutation.ts:117-139` — `prepareUpload` mutation

### PDF (package.json)
- `package.json:pdf-lib "^1.17.1"`, `@pdf-lib/fontkit ^1.1.1`, `@pdfme/{common,schemas,ui} ^6.1.12`, `puppeteer ^25.4.0` — installed, not yet used anywhere in backend/shared TS.

---

## G. Summary of recommended *first-pass decisions* for a Siraj certificate feature

1. Add domain folders (`backend/services/cert`, `backend/db/repo/cert`, `backend/db/schema/cert`, `backend/types/cert`, `backend/graphql/pothos/cert`, `backend/graphql/mutation/cert`, `backend/graphql/query/cert`) and wire each into the four `index.ts` barrels.
2. Define enums in `backend/enum/cert/`, register once in `pothos/shared/enum.pothos.ts`.
3. Use a namespace-style service module `CertificateManagementService` (and generation/verification/renderer children), pure async functions, signature `serviceFn(actorUserId, input, tErrors, locale?)`.
4. Permission gate via `PermissionsService.has[Any]Permission` using new `AppPermission.CERT_{GENERATE,MANAGE,REVOKE,VERIFY}`; super_admin auto-allowed by `authScopes.permission` callback.
5. Throw `NotFoundError("CERTIFICATE"|"TEMPLATE", tErrors.cert.*…)` from services, `Error(tErrors.cert.*)` for validation; never `GraphQLError`.
6. GraphQL objects `loadableObjectRef` backed by `loadByIds` batch repository; arrays via manual batch service.
7. PDFs via `pdf-lib + @pdfme/schemas` (template-driven, no browser); cache render results with `cachedReadSingleFlight`; link PDFs to certificate records via `StorageService.linkFileToEntity({ referenceTable: "certificates", usageType: "certificate_pdf" })`.
8. Idempotency via persisted `idempotencyKey` column + `uniqueIndex` (mirror invoices), hash key over `(templateId, templateVersionId, recipientGroupId)`.
9. Public verification endpoint via `verifyCertificate(code)` returning a `CertificateVerificationResultPothosObject` whose status enum gives frontends precise branching.
10. Notification + audit side-effects fire-and-forget with `dispatchWithPreferences` + `AuditService.createManyAuditLogs`, mirroring billing.

— end of document —