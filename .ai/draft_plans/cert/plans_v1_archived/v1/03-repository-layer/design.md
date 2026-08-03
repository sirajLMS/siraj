# Plan 03 — Repository Layer: Technical Design

> **Feature**: Certificate Generation & Verification (Siraj)
> **Plan**: 03 — Repository (Data Access) Layer
> **Depends on**: Plan 01 (DB Schema), Plan 02 (Types & Permissions)
> **Patterns source**: `siraj_analysis/03-repository-patterns.md`, `backend/db/repo/AGENTS.md`, `backend/db/repo/billing/billing.repository.ts`, `backend/db/repo/students/student.repository.ts`

---

## 1. Architecture Overview

### 1.1 Layer Position

```
GraphQL Resolver (Plan 04)
        ↓ calls
Service Layer (Plan 05)
        ↓ calls
Repository Layer (THIS PLAN)    ← backend/db/repo/certificates/
        ↓ queries
Database (Plan 01 — schema tables)
```

Repositories are the **only** layer that touches the database. They expose pure data-access functions as `namespace` exports — no classes, no business logic, no permission checks.

### 1.2 Pattern Compliance Matrix

| Pattern | Source | Application |
|---|---|---|
| `queryDb(tx)` for reads | `drizzleDb.ts:58`, `AGENTS.md` §Neon HTTP | All `find*`, `count*`, `exists*` methods |
| `tx ?? db` for writes | `student.repository.ts:128`, `billing.repository.ts:406` | All `create`, `update`, `delete` methods |
| Prepared statements | `docs/drizzle/prepared-statements.md` | `findById` only (simple scalar lookup) |
| `inArray` + prepared PROHIBITED | `AGENTS.md` §Prepared Statements | `loadByIds` uses dynamic `inArray` |
| Soft delete via `deletedAt` | `soft-delete.repository.ts:19-52` | `certificates`, `certificate_templates` |
| FTS via `to_tsvector` + trigram GiST | `query.extensions.ts:28-61` | Certificate recipient name, template name |
| Cursor pagination `(createdAt, id)` | `student.repository.ts:18-80` | `findMany` on certificates, templates, recipient groups |
| Idempotency unique index catch | `student.repository.ts:122-133` | `CertificateRepository.create` |
| Entity mapping `mapEntityToDto` | `student.repository.ts:63`, `StudentUtils` | Each repository has its own mapper |
| Advisory locks | `billing.repository.ts:28`, `student.repository.ts:87` | `softDelete` operations |
| Audit log on soft delete | `soft-delete.repository.ts:100` | `softDelete` writes audit entry |

### 1.3 Entity Relationship (from Plan 01 / CGVS analysis)

```
certificate_categories (1) ──┐
                             ├── (N) certificate_templates
                             │               │
                             │               ├── (N) template_elements (+ sub-tables)
                             │               ├── (N) template_variables (+ sub-tables)
                             │               ├── (N) certificate_recipient_groups
                             │               │        │
                             │               │        ├── (N) recipient_group_items
                             │               │        │        │
                             │               │        │        └── (N) recipient_group_item_variable_values
                             │               │        │
                             │               │        └── (1:1) students
                             │               │
                             │               └── (N) certificate_templates (version chain)
                             │
                             └── (N) certificate_templates (self-ref parentCategoryId)

certificates (N) ── (1) certificate_templates
certificates (N) ── (1) students (via studentId)
certificates (N) ── (1) certificate_recipient_groups

certificate_verifications (N) ── (1) certificates
```

---

## 2. Repository Files to Create

### 2.1 Directory Layout

```
backend/db/repo/certificates/
├── index.ts                                        (barrel — re-export all namespaces)
├── certificate.repository.ts                       (namespace CertificateRepository)
├── certificate-template.repository.ts              (namespace TemplateRepository)
├── template-element.repository.ts                   (namespace TemplateElementRepository)
├── template-variable.repository.ts                 (namespace TemplateVariableRepository)
├── certificate-recipient-group.repository.ts       (namespace RecipientGroupRepository)
├── certificate-verification.repository.ts          (namespace VerificationRepository)
└── certificate-category.repository.ts              (namespace CertificateCategoryRepository)
```

Registration in `backend/db/repo/index.ts`:
```ts
export {
  CertificateRepository,
  TemplateRepository,
  TemplateElementRepository,
  TemplateVariableRepository,
  RecipientGroupRepository,
  VerificationRepository,
  CertificateCategoryRepository,
} from "@/backend/db/repo/certificates";
```

---

### 2.2 certificate.repository.ts — `namespace CertificateRepository`

#### Imports
```ts
import { and, count, desc, eq, inArray, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";
import { queryDb } from "@/backend/db";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { fullTextSearch } from "@/backend/db/query.extensions";
import { certificates, certificateVerifications, students, certificateTemplates } from "@/backend/db/schema";
import { CertificateStatus } from "@/backend/enum";
import { parseCertificateStatus } from "@/backend/lib/enum";
import { NotFoundError } from "@/backend/lib";
import type * as Types from "@/backend/types";
import type { ErrorsLabels } from "@/shared/locale";
import { AuditRepository } from "@/backend/db/repo/audit";
import { getServerTranslations } from "@/shared/locale";
```

#### Module-Level Prepared Statement
```ts
const findByIdPrepared = db
  .select()
  .from(certificates)
  .where(and(eq(certificates.id, sql.placeholder("id")), isNull(certificates.deletedAt)))
  .limit(1)
  .prepare("find_certificate_by_id");
```

#### Entity Mapping Function
```ts
function mapCertificateToDto(row: Types.CertificateSelectType): Types.CertificateReturnType {
  return {
    id: row.id,
    templateId: row.templateId,
    studentId: row.studentId,
    recipientGroupId: row.recipientGroupId,
    recipientName: row.recipientName,
    releaseDate: row.releaseDate,
    verificationCode: row.verificationCode,
    status: parseCertificateStatus(row.status),
    pdfFilePath: row.pdfFilePath ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // Omit: idempotencyKey, deletedAt, internal version
  };
}
```

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id: string, tx?: DBTransaction) => Promise<Types.CertificateReturnType \| null>` | Prepared or `queryDb(tx)` | Branches: prepared for no-tx, `tx.select()` for tx |
| `findMany` | `(filters?: CertificateFilterArgs, paginationArgs?: PaginationArgs, orderBy?: CertificateOrderByClause[], tx?: DBTransaction) => Promise<CertificatePaginatedResponse>` | `queryDb(tx)` | Cursor pagination, `count(*) over()`, FTS |
| `create` | `(input: Types.CertificateInsertType, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<Types.CertificateReturnType>` | `tx ?? db` | Catches idempotency key unique violation → return existing |
| `update` | `(id: string, input: Partial<Types.CertificateInsertType>, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<Types.CertificateReturnType>` | `tx ?? db` | Filters `isNull(deletedAt)`, throws if missing |
| `softDelete` | `(id: string, actorUserId: string, tErrors: ErrorsLabels, tx?: DBTransaction) => Promise<SoftDeleteResult>` | `tx ?? db.transaction(runner)` | Advisory lock + audit log |
| `findCertificatesByStudent` | `(studentId: string, tx?: DBTransaction) => Promise<Types.CertificateReturnType[]>` | `queryDb(tx)` | `eq(studentId)`, `isNull(deletedAt)`, `orderBy(desc(createdAt))` |
| `findCertificatesByTemplate` | `(templateId: string, tx?: DBTransaction) => Promise<Types.CertificateReturnType[]>` | `queryDb(tx)` | `eq(templateId)`, `isNull(deletedAt)`, `orderBy(desc(createdAt))` |
| `findCertificatesByStatus` | `(status: CertificateStatus, tx?: DBTransaction) => Promise<Types.CertificateReturnType[]>` | `queryDb(tx)` | `eq(status)`, `isNull(deletedAt)` |
| `searchByRecipientName` | `(searchText: string, tx?: DBTransaction) => Promise<Types.CertificateReturnType[]>` | `queryDb(tx)` | `fullTextSearch(certificates.recipientName, searchText, "simple")` |
| `loadByIds` | `(ids: string[], locale?: string) => Promise<(Types.CertificateReturnType \| Error)[]>` | `queryDb()` | Dynamic `inArray`, NOT prepared, pre-seeded Map |
| `existsById` | `(id: string, tx?: DBTransaction) => Promise<boolean>` | `queryDb(tx)` | `q.$count(certificates, eq(certificates.id, id)) > 0` |
| `findOutcomesByCertificateId` | `(certificateId: string, tx?: DBTransaction) => Promise<Types.CertificateOutcomeReturnType[]>` | `queryDb(tx)` | Feature 6 — join certificates_outcomes + outcomes |
| `findProgressByStudentId` | `(studentId: string, tx?: DBTransaction) => Promise<Types.CertificateProgressReturnType[]>` | `queryDb(tx)` | Feature 6 — join student_progress + certificates + outcomes |
| `updateProgress` | `(input: Types.CertificateProgressInsertType, tx?: DBTransaction) => Promise<Types.CertificateProgressReturnType>` | `tx ?? db` | Feature 6 — `onConflictDoUpdate` on `(studentId, outcomeId)` |

#### Idempotency Pattern (create)
```ts
export const create = async (input, tErrors, tx?) => {
  const executor = tx ?? db;
  try {
    const [row] = await executor
      .insert(certificates)
      .values({ ...input, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return mapCertificateToDto(row);
  } catch (error) {
    // Unique constraint violation on idempotencyKey — return existing
    if (isUniqueViolation(error)) {
      const q = queryDb(tx);
      const [existing] = await q
        .select()
        .from(certificates)
        .where(eq(certificates.idempotencyKey, input.idempotencyKey))
        .limit(1);
      if (existing) return mapCertificateToDto(existing);
    }
    throw error;
  }
};
```

#### Cursor Pagination (findMany)
```ts
export const findMany = async (filters?, paginationArgs?, orderBy?, tx?) => {
  const q = queryDb(tx);
  let baseQuery = q
    .select({
      certificate: certificates,
      total: sql<number>`cast(count(*) over() as int)`,
    })
    .from(certificates)
    .where(isNull(certificates.deletedAt))
    .$dynamic();

  // Apply filters (status, templateId, studentId, dateRange)
  if (filters?.status) baseQuery = baseQuery.where(eq(certificates.status, filters.status));
  if (filters?.templateId) baseQuery = baseQuery.where(eq(certificates.templateId, filters.templateId));
  if (filters?.studentId) baseQuery = baseQuery.where(eq(certificates.studentId, filters.studentId));
  if (filters?.dateRange) { /* lte/gte on releaseDate */ }

  // Apply FTS
  if (filters?.searchText) {
    const ftsCondition = fullTextSearch(certificates.recipientName, filters.searchText, "simple");
    if (ftsCondition) baseQuery = baseQuery.where(ftsCondition);
  }

  // Apply cursor
  if (paginationArgs?.after) {
    const cursorObj = decodeCursor(paginationArgs.after);
    // DESC: or(lt(createdAt, cursorDate), and(eq(createdAt, cursorDate), lt(id, cursorId)))
    baseQuery = baseQuery.where(/* cursor condition */);
  }

  // Apply ordering + limit
  baseQuery = baseQuery.orderBy(desc(certificates.createdAt), desc(certificates.id));
  if (paginationArgs) baseQuery = baseQuery.limit(paginationArgs.perPage);

  const results = await baseQuery;
  const total = results[0]?.total ?? 0;
  const items = results.map(r => mapCertificateToDto(r.certificate));

  // Build pageInfo with encoded cursors
  return { data: items, pageInfo: buildPageInfo(paginationArgs, items, total) };
};
```

---

### 2.3 certificate-template.repository.ts — `namespace TemplateRepository`

#### Structure
Same import pattern as certificate repository. Imports `certificateTemplates`, `certificateCategories` from schema.

#### Module-Level Prepared Statement
```ts
const findByIdPrepared = db
  .select()
  .from(certificateTemplates)
  .where(and(eq(certificateTemplates.id, sql.placeholder("id")), isNull(certificateTemplates.deletedAt)))
  .limit(1)
  .prepare("find_certificate_template_by_id");
```

#### Entity Mapper
```ts
function mapTemplateToDto(row: Types.CertificateTemplateSelectType): Types.CertificateTemplateReturnType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    status: row.status, // re-apply enum if needed
    version: row.version,
    parentTemplateId: row.parentTemplateId ?? null,
    imageFileId: row.imageFileId ?? null,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    // Omit: idempotencyKey, deletedAt
  };
}
```

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id: string, tx?: DBTransaction) => Promise<Types.CertificateTemplateReturnType \| null>` | Prepared or `queryDb(tx)` | Branches prepared vs tx |
| `findMany` | `(filters?, paginationArgs?, orderBy?, tx?) => Promise<TemplatePaginatedResponse>` | `queryDb(tx)` | Cursor pagination, FTS on name |
| `create` | `(input, tErrors, tx?) => Promise<Types.CertificateTemplateReturnType>` | `tx ?? db` | Initial `version = 1` |
| `update` | `(id, input, tErrors, tx?) => Promise<Types.CertificateTemplateReturnType>` | `tx ?? db` | Increments `version: sql\`${certificates.version} + 1\`` |
| `softDelete` | `(id, actorUserId, tErrors, tx?) => Promise<SoftDeleteResult>` | `db.transaction(runner)` ternary | Advisory lock + audit |
| `findTemplatesByCategory` | `(categoryId, tx?) => Promise<Types.CertificateTemplateReturnType[]>` | `queryDb(tx)` | `eq(categoryId)`, `isNull(deletedAt)`, `orderBy(asc(order), desc(createdAt))` |
| `createVersion` | `(templateId, input, tErrors, tx?) => Promise<Types.CertificateTemplateReturnType>` | `tx ?? db.transaction(runner)` | Copies current template, sets `parentTemplateId = templateId`, `version = current.version + 1` |
| `findLatestVersion` | `(templateId, tx?) => Promise<Types.CertificateTemplateReturnType \| null>` | `queryDb(tx)` | `where(or(eq(id, templateId), eq(parentTemplateId, templateId)))`, `orderBy(desc(version))`, `limit(1)` |
| `findOutcomesByTemplateId` | `(templateId, tx?) => Promise<Types.TemplateOutcomeReturnType[]>` | `queryDb(tx)` | Feature 6 — join `template_outcomes` |
| `createOutcome` | `(input, tx?) => Promise<Types.TemplateOutcomeReturnType>` | `tx ?? db` | Feature 6 |
| `updateOutcome` | `(id, input, tx?) => Promise<Types.TemplateOutcomeReturnType>` | `tx ?? db` | Feature 6 |
| `deleteOutcome` | `(id, tx?) => Promise<void>` | `tx ?? db` | Feature 6 — hard delete |

#### Version Management Diagram
```
Template v1 (root) — id: "abc", parentTemplateId: null, version: 1
  └─ Template v2 — id: "def", parentTemplateId: "abc", version: 2
      └─ Template v3 — id: "ghi", parentTemplateId: "abc", version: 3

findLatestVersion("abc") → returns v3 (ghi)
findLatestVersion("def") → returns v3 (ghi) — queries by parentTemplateId OR id
```

---

### 2.4 template-element.repository.ts — `namespace TemplateElementRepository`

#### Structure
Handles the polymorphic element pattern: base `template_elements` table + type-specific sub-tables (`template_static_text_elements`, `template_data_text_elements`, `template_data_date_elements`, `template_image_elements`, `template_qr_code_elements`).

#### Private Helper — Sub-table Router
```ts
async function insertSubElement(
  tx: DBTransaction | typeof db,
  elementType: TemplateElementType,
  elementId: string,
  subData: Record<string, unknown>
): Promise<void> {
  switch (elementType) {
    case TemplateElementType.STATIC_TEXT:
      await tx.insert(templateStaticTextElements).values({ elementId, ...subData });
      break;
    case TemplateElementType.DATA_TEXT:
      await tx.insert(templateDataTextElements).values({ elementId, ...subData });
      break;
    // ... etc
  }
}
```

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id, tx?) => Promise<Types.TemplateElementReturnType \| null>` | `queryDb(tx)` | Base + sub-table LEFT JOIN |
| `findByTemplateId` | `(templateId, tx?) => Promise<Types.TemplateElementReturnType[]>` | `queryDb(tx)` | `eq(templateId)`, `orderBy(asc(createdAt))` |
| `findByTemplateIdWithSubElements` | `(templateId, tx?) => Promise<Types.TemplateElementReturnType[]>` | `queryDb(tx)` | Base LEFT JOIN each sub-table, unified DTO |
| `create` | `(input, tx?) => Promise<Types.TemplateElementReturnType>` | `tx ?? db.transaction(runner)` | Insert base + sub-table in one tx |
| `update` | `(id, input, tx?) => Promise<Types.TemplateElementReturnType>` | `tx ?? db.transaction(runner)` | Update base + sub-table |
| `delete` | `(id, tx?) => Promise<void>` | `tx ?? db.transaction(runner)` | Delete sub-table + base |

---

### 2.5 template-variable.repository.ts — `namespace TemplateVariableRepository`

#### Structure
Same polymorphic pattern as elements. Base `template_variable_base` + sub-tables (`template_text_variables`, `template_number_variables`, `template_date_variables`, `template_select_variables`).

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id, tx?) => Promise<Types.TemplateVariableReturnType \| null>` | `queryDb(tx)` | Base + sub-table LEFT JOIN |
| `findByTemplateId` | `(templateId, tx?) => Promise<Types.TemplateVariableReturnType[]>` | `queryDb(tx)` | `eq(templateId)`, `orderBy(asc(order))` |
| `create` | `(input, tx?) => Promise<Types.TemplateVariableReturnType>` | `tx ?? db.transaction(runner)` | Insert base + sub-table |
| `update` | `(id, input, tx?) => Promise<Types.TemplateVariableReturnType>` | `tx ?? db.transaction(runner)` | Update base + sub-table |
| `delete` | `(id, tx?) => Promise<void>` | `tx ?? db.transaction(runner)` | Delete sub-table + base |

---

### 2.6 certificate-recipient-group.repository.ts — `namespace RecipientGroupRepository`

#### Structure
Handles three tables: `certificate_recipient_groups` (group), `recipient_group_items` (items), `recipient_group_item_variable_values` (per-item variable values).

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id, tx?) => Promise<Types.RecipientGroupReturnType \| null>` | `queryDb(tx)` | Group row |
| `findMany` | `(filters?, paginationArgs?, orderBy?, tx?) => Promise<RecipientGroupPaginatedResponse>` | `queryDb(tx)` | Filters: `templateId`, `searchText` (FTS on name), cursor pagination |
| `create` | `(input, tx?) => Promise<Types.RecipientGroupReturnType>` | `tx ?? db` | `.returning()` |
| `update` | `(id, input, tx?) => Promise<Types.RecipientGroupReturnType>` | `tx ?? db` | `.returning()` |
| `delete` | `(id, tx?) => Promise<void>` | `tx ?? db.transaction(runner)` | Hard delete group + items + item variable values |
| `findItemsByGroupId` | `(groupId, tx?) => Promise<Types.RecipientGroupItemReturnType[]>` | `queryDb(tx)` | Join items + students |
| `addItem` | `(input, tx?) => Promise<Types.RecipientGroupItemReturnType>` | `tx ?? db` | Unique constraint `(studentId, recipientGroupId)` |
| `removeItem` | `(groupId, studentId, tx?) => Promise<void>` | `tx ?? db.transaction(runner)` | Delete item + its variable values |
| `setItemVariableValue` | `(input, tx?) => Promise<Types.RecipientGroupItemVariableValueReturnType>` | `tx ?? db` | `.onConflictDoUpdate()` on `(templateRecipientGroupItemId, templateVariableId)` |

---

### 2.7 certificate-verification.repository.ts — `namespace VerificationRepository`

#### Structure
Handles `certificate_verifications` table. No soft delete, no pagination — verification records are append-only audit trail entries.

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id, tx?) => Promise<Types.CertificateVerificationReturnType \| null>` | `queryDb(tx)` | Simple select by id |
| `findByVerificationCode` | `(code, tx?) => Promise<Types.CertificateVerificationReturnType \| null>` | `queryDb(tx)` | `eq(verificationCode, code)` — dynamic, not prepared |
| `findByCertificateId` | `(certificateId, tx?) => Promise<Types.CertificateVerificationReturnType[]>` | `queryDb(tx)` | `eq(certificateId)`, `orderBy(desc(verifiedAt))` |
| `create` | `(input, tx?) => Promise<Types.CertificateVerificationReturnType>` | `tx ?? db` | `.returning()` |
| `update` | `(id, input, tx?) => Promise<Types.CertificateVerificationReturnType>` | `tx ?? db` | `.returning()` |

---

### 2.8 certificate-category.repository.ts — `namespace CertificateCategoryRepository`

#### Structure
Handles `certificate_categories` table — self-referencing tree via `parentCategoryId`. No pagination (client builds tree from full list).

#### Methods

| Method | Signature | tx Pattern | Notes |
|---|---|---|---|
| `findById` | `(id, tx?) => Promise<Types.CertificateCategoryReturnType \| null>` | `queryDb(tx)` | Simple select |
| `findMany` | `(filters?, tx?) => Promise<Types.CertificateCategoryReturnType[]>` | `queryDb(tx)` | Optional filter by `parentCategoryId`; FTS on name; ordered by `order ASC` |
| `create` | `(input, tx?) => Promise<Types.CertificateCategoryReturnType>` | `tx ?? db` | `.returning()` |
| `update` | `(id, input, tx?) => Promise<Types.CertificateCategoryReturnType>` | `tx ?? db` | `.returning()` |
| `delete` | `(id, tx?) => Promise<void>` | `tx ?? db` | Checks for children first |
| `findRootCategories` | `(tx?) => Promise<Types.CertificateCategoryReturnType[]>` | `queryDb(tx)` | `isNull(parentCategoryId)`, `orderBy(asc(order))` |

---

### 2.9 index.ts (Barrel)

```ts
export { CertificateRepository } from "./certificate.repository";
export { TemplateRepository } from "./certificate-template.repository";
export { TemplateElementRepository } from "./template-element.repository";
export { TemplateVariableRepository } from "./template-variable.repository";
export { RecipientGroupRepository } from "./certificate-recipient-group.repository";
export { VerificationRepository } from "./certificate-verification.repository";
export { CertificateCategoryRepository } from "./certificate-category.repository";
```

---

### 2.10 Registration in backend/db/repo/index.ts

Add after the existing exports:
```ts
export {
  CertificateRepository,
  TemplateRepository,
  TemplateElementRepository,
  TemplateVariableRepository,
  RecipientGroupRepository,
  VerificationRepository,
  CertificateCategoryRepository,
} from "@/backend/db/repo/certificates";
```

---

## 3. SOFT_DELETE_TABLES Registry Update

In `backend/db/repo/shared/soft-delete.repository.ts`, add:

```ts
import { certificates, certificateTemplates } from "@/backend/db/schema";

const SOFT_DELETE_TABLES = {
  // ... existing entries ...
  certificates: {
    table: certificates,
    entityType: "CERTIFICATE" as const,
  },
  certificate_templates: {
    table: certificateTemplates,
    entityType: "CERTIFICATE_TEMPLATE" as const,
  },
} as const;
```

Add typed convenience wrappers:
```ts
export const softDeleteCertificate = async (
  entityId: string, actorUserId: string, tx?: DBTransaction, locale?: string
) => softDelete({ tableName: "certificates", entityId, actorUserId, description: "Certificate soft-deleted" }, tx, locale);

export const softDeleteCertificateTemplate = async (
  entityId: string, actorUserId: string, tx?: DBTransaction, locale?: string
) => softDelete({ tableName: "certificate_templates", entityId, actorUserId, description: "Certificate template soft-deleted" }, tx, locale);
```

Update the `SoftDeletableTableName` type in `backend/types/shared/soft-delete.types.ts` (or wherever it's defined) to include `"certificates" | "certificate_templates"`.

---

## 4. Shared Utility Functions

### 4.1 Cursor Helpers (reused across repositories)

These already exist in the codebase (`PaginationUtils`) but if certificate-specific cursor helpers are needed:

```ts
function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const obj = JSON.parse(decoded);
    if (obj.createdAt && obj.id) return obj;
    return null;
  } catch {
    return null;
  }
}

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ createdAt: createdAt.toISOString(), id })).toString("base64");
}
```

### 4.2 Unique Violation Detector

```ts
function isUniqueViolation(error: unknown): boolean {
  // PostgreSQL unique constraint violation code: 23505
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("23505") || msg.includes("unique") || msg.includes("duplicate key");
}
```

> **Note:** This may already exist in `@/backend/lib` or `@/backend/utils`. Check before creating a duplicate. If it exists, import from there.

---

## 5. UX / Navigation Specification

> This plan is repository-only — there is no UI, no navigation, and no user-facing surface area. All repository methods are consumed by the service layer (Plan 05) and GraphQL resolvers (Plan 04). The repository layer has zero UX impact.

**No navigation changes required.** The barrel registration in `@/backend/db/repo` exposes the new namespaces to the service layer automatically.

---

## 6. Outcome & Knowledge Transfer Protocol

### 6.1 Knowledge Artifacts Produced

| Artifact | Location | Audience |
|---|---|---|
| Repository pattern examples | `backend/db/repo/certificates/*.repository.ts` | Future developers adding entities to the certificate domain |
| SOFT_DELETE_TABLES entries | `backend/db/repo/shared/soft-delete.repository.ts` | All developers using soft delete |
| Barrel registration | `backend/db/repo/index.ts` | All developers importing repos |
| Idempotency catch pattern | `certificate.repository.ts` | Developers building financial/idempotent mutations |

### 6.2 Knowledge Transfer Mechanisms

1. **Code as Documentation**: Each repository file follows the identical namespace structure, making the pattern self-documenting. New developers can copy any `*.repository.ts` as a template.

2. **AGENTS.md Update**: The `backend/db/repo/AGENTS.md` layout section should be updated to include `certificates/` in the directory listing:
   ```
   ├── certificates/        certificate, template, element, variable, recipient-group, verification, category
   ```

3. **Prepared Statement Registry**: The existing prepared statement rollout count (10 repos, 24 statements) should be updated to include the new certificate repos. This is tracked informally — no registry file exists.

4. **Soft Delete Registry**: The `SOFT_DELETE_TABLES` dict gains two new entries. Any code that iterates or references `SoftDeletableTableName` type must include the new entries.

### 6.3 Impact on Other Plans

| Downstream Plan | Impact | Dependency |
|---|---|---|
| Plan 04 (GraphQL) | Imports repository namespaces from `@/backend/db/repo` | All repository files + barrel must exist |
| Plan 05 (Services) | Calls repository methods directly | All repository files + barrel must exist |
| Plan 06 (Frontend) | No direct impact — frontend calls services via GraphQL | None |
| Plan 07 (Testing) | Tests import repository namespaces | All repository files + barrel + types must exist |

### 6.4 Cross-Plan Knowledge Carry-Forward

- **Idempotency pattern**: The `isUniqueViolation` catch-and-return pattern in `CertificateRepository.create` should be documented in `docs/idempotency.md` if not already present, referencing this implementation as an example.
- **Version management**: The `createVersion` / `findLatestVersion` pattern in `TemplateRepository` is a new pattern (versioned entities). Document this in `docs/drizzle/` or a new `docs/patterns/versioned-entities.md` if the team decides this is reusable beyond certificates.
- **Polymorphic sub-table CRUD**: The element and variable repositories handle a table-per-type inheritance pattern. This is a new structural pattern in the codebase. Document in `docs/patterns/polymorphic-subtables.md` if reusable.

---

## 7. Design Decisions

### D1: Prepared Statements — findById Only
**Decision**: Only `findById` uses prepared statements. All other queries use `queryDb(tx)`.
**Rationale**: Prepared statements are bound to the global `db` and cannot run inside `db.transaction(tx)`. They also cannot handle `inArray`, dynamic WHERE, or joins. Only `findById` meets all the criteria (simple scalar parameter, read-only, commonly called).

### D2: Version Management — In-Place vs Copy
**Decision**: Template versions share a `parentTemplateId` chain. `createVersion` creates a new row with `parentTemplateId` set to the root template's `id`.
**Rationale**: This preserves history (old versions are never mutated) while allowing `findLatestVersion` to find the most current. The service layer decides which version to display/use.

### D3: Soft Delete — Only for Certificates and Templates
**Decision**: Only `certificates` and `certificate_templates` support soft delete. Elements, variables, recipient groups, and verifications use hard delete.
**Rationale**: Certificates and templates are auditable records that may have associated verifications. Hard-deleting a certificate would break verification chains. Elements and variables are subordinate to templates — when a template is updated or deleted, its elements/variables can be hard-deleted.

### D4: No Prepared Statement for Verification Code Lookup
**Decision**: `findByVerificationCode` uses a dynamic `queryDb(tx)` query, not a prepared statement.
**Rationale**: Verification code lookups may be extended with additional WHERE conditions (e.g., `isExpired`, `isActive`) in the future. Prepared statements only support fixed parameters. This defers to flexibility.

### D5: Cursor Pagination — Count Window vs Separate Count Query
**Decision**: Use `sql<number>\`cast(count(*) over() as int)\`` as a window column on each row (same as `student.repository.ts:277`).
**Rationale**: This is the existing codebase pattern. It avoids a separate `SELECT count(*)` query, trading a slightly larger per-row payload for fewer round trips. The window function is evaluated once per query, not per row, thanks to PostgreSQL's query planner.

### D6: Feature 6 — Outcomes on Existing Repositories
**Decision**: Outcome and progress tracking methods are added to `CertificateRepository` and `TemplateRepository` rather than creating separate `OutcomeRepository` and `ProgressRepository`.
**Rationale**: These methods are joined queries on the certificate/template tables. Creating separate repositories would require importing certificate/template schema into a separate namespace, which adds import complexity without improving separation. The service layer can still split outcome/progress logic into separate service classes.

---

## 8. Sequence Diagrams

### 8.1 Certificate Creation with Idempotency

```
Service Layer
    │
    ├─ input = { templateId, studentId, idempotencyKey: "sha256(...)", ... }
    │
    ▼
CertificateRepository.create(input, tErrors, tx?)
    │
    ├─ executor = tx ?? db
    ├─ executor.insert(certificates).values(input).returning()
    │     │
    │     ├─ SUCCESS → return mapCertificateToDto(row)
    │     │
    │     └─ UNIQUE VIOLATION (23505) on idempotencyKey
    │           │
    │           ├─ queryDb(tx).select().from(certificates)
    │           │    .where(eq(idempotencyKey, input.idempotencyKey)).limit(1)
    │           │
    │           └─ return mapCertificateToDto(existing)
    │
    ▼
CertificateReturnType
```

### 8.2 Soft Delete with Advisory Lock

```
Service Layer
    │
    ▼
CertificateRepository.softDelete(id, actorUserId, tErrors, tx?)
    │
    ├─ runner = async (t: DBTransaction) => {
    │     ├─ tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext('certificate_' || ${id}))`)
    │     ├─ SELECT ... WHERE eq(id, id) AND isNull(deletedAt) → throw if missing
    │     ├─ UPDATE certificates SET deletedAt = now(), updatedAt = now() WHERE eq(id, id)
    │     └─ AuditRepository.createAuditLog({ action: "DELETE", ... })
    │  }
    │
    ├─ tx ? runner(tx) : db.transaction(runner)
    │
    ▼
{ entity, deletedAt }
```
