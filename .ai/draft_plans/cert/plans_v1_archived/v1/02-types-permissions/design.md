# Design: Certificate Types & Permissions (Plan 02)

## Document Information

- **Feature Name**: Certificate Type Definitions & Permission Entries
- **Target Directory**: `.ai/draft_plans/cert/plans/02-types-permissions`
- **Version**: 1.0
- **Date**: 2025-01-20
- **Author**: Siraj Development Team
- **Related Documents**:
  - Requirements: `.ai/draft_plans/cert/plans/02-types-permissions/requirements.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/02-types-enums-patterns.md`
  - Analysis: `.ai/draft_plans/cert/siraj_analysis/09-auth-permissions.md`
  - Analysis: `.ai/draft_plans/cert/cgvs_analysis/02-database-schema.md`
  - Dependency: `.ai/draft_plans/cert/plans/01-db-schema-enums/requirements.md`

---

## 1. Architecture Overview

### 1.1 Layer Position

This plan operates at the **type definitions layer** and **enum/permissions layer** of the Siraj architecture:

```
┌──────────────────────────────────────────────────┐
│  Frontend (Apollo Client, GraphQL Codegen)         │  Plan 05+
├──────────────────────────────────────────────────┤
│  GraphQL Layer (Pothos resolvers, schema)         │  Plan 04
├──────────────────────────────────────────────────┤
│  Service Layer (business logic)                   │  Plan 04
├──────────────────────────────────────────────────┤
│  Repository Layer (data access)                   │  Plan 03
├──────────────────────────────────────────────────┤
│  >>> TYPE DEFINITIONS + PERMISSIONS <<<           │  Plan 02 (THIS)
├──────────────────────────────────────────────────┤
│  DB Schema (Drizzle tables, enums, RLS)           │  Plan 01
└──────────────────────────────────────────────────┘
```

### 1.2 Files To Create / Modify

| Action | File | Description |
|--------|------|-------------|
| CREATE | `backend/types/certificates/certificate.types.ts` | Certificate entity types |
| CREATE | `backend/types/certificates/certificate-template.types.ts` | Template entity types |
| CREATE | `backend/types/certificates/template-element.types.ts` | Element entity types |
| CREATE | `backend/types/certificates/template-variable.types.ts` | Variable entity types |
| CREATE | `backend/types/certificates/certificate-recipient-group.types.ts` | Recipient group entity types |
| CREATE | `backend/types/certificates/certificate-verification.types.ts` | Verification entity types |
| CREATE | `backend/types/certificates/certificate-category.types.ts` | Category entity types |
| CREATE | `backend/types/certificates/certificate-outcome.types.ts` | Feature 6: Outcome & progress types |
| CREATE | `backend/types/certificates/index.ts` | Barrel export for all type files |
| MODIFY | `backend/types/index.ts` | Add `export * from "./certificates";` |
| MODIFY | `backend/enum/permissions/permission.enum.ts` | Add 11 `CERTIFICATES_*` entries to `AppPermission` |
| MODIFY | `backend/graphql/pothos/shared/enum.pothos.ts` | Register 6 certificate enums in Pothos |
| VERIFY | `backend/enum/certificates/index.ts` | Ensure barrel exists from Plan 01 |
| VERIFY | `backend/enum/index.ts` | Ensure `export * from "./certificates";` exists from Plan 01 |

### 1.3 Canonical Type Pattern (Reference)

All type files follow the AGENTS.md canonical pattern from `backend/types/AGENTS.md`, demonstrated in `backend/types/billing/billing.types.ts`:

```typescript
import type { entityTable } from "@/backend/db/schema";
import type { EntityEnum } from "@/backend/enum";

// Raw DB row — inferred by Drizzle
export type EntitySelectType = typeof entityTable.$inferSelect;

// Raw insert shape — inferred by Drizzle
export type EntityInsertType = typeof entityTable.$inferInsert;

// Canonical return type — omit forbidden fields, re-apply enums, add resolved props
export type EntityReturnType = Omit<
  EntitySelectType,
  "deletedAt" | "idempotencyKey" | "version"
> & {
  status: EntityEnum; // re-applied from pgEnum-inferred string
  readonly relatedEntity?: RelatedEntityReturnType | null; // resolved props
};

// User-provided input — omit system-generated fields
export type EntitySubmitInput = Omit<
  EntityInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "version" | "status"
>;

// Filter and order-by types (for list queries)
export type EntityFilterInput = { ... };
export type EntityOrderByInput = { ... };
```

---

## 2. Type File Designs

### 2.1 `certificate.types.ts`

**Path**: `backend/types/certificates/certificate.types.ts`

**Imports from**:
- `@/backend/db/schema` → `certificates` table
- `@/backend/enum` → `CertificateStatus`, `CertificateOrientation`
- `@/backend/types/shared/pagination.types` → `PageInfo` (if needed for pagination return types)
- `@/backend/types/students` → `StudentReturnType` (for resolved `student` relation) — cross-type reference

**Type Definitions**:

```typescript
import type { certificates } from "@/backend/db/schema";
import type { CertificateStatus, CertificateOrientation } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";

// ─── Select (raw DB row) ────────────────────────────────────
export type CertificateSelectType = typeof certificates.$inferSelect;

// ─── Insert (raw insert shape) ───────────────────────────────
export type CertificateInsertType = typeof certificates.$inferInsert;

// ─── Return (canonical API return type) ──────────────────────
export type CertificateReturnType = Omit<
  CertificateSelectType,
  "deletedAt" | "idempotencyKey" | "version" | "createdByUserId"
> & {
  status: CertificateStatus;     // re-applied (pgEnum infers string)
  orientation: CertificateOrientation; // re-applied
  studentName: LocalizedString;   // re-applied from jsonb
  readonly template?: CertificateTemplateReturnType | null;
  readonly student?: StudentReturnType | null;
  readonly files?: CertificateFileReturnType[];
  readonly verifications?: CertificateVerificationReturnType[];
};

// ─── Submit Input (user-provided) ────────────────────────────
export type CertificateSubmitInput = Omit<
  CertificateInsertType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "idempotencyKey"
  | "version"
  | "createdByUserId"
  | "status"
  | "issuedAt"
  | "verificationCode"
>;

// ─── Filter & Order By (for list queries) ────────────────────
export type CertificateFilterInput = {
  status?: CertificateStatus;
  templateId?: string;
  studentId?: string;
  recipientGroupId?: string;
  dateFrom?: Date;
  dateTo?: Date;
};

export type CertificateOrderByInput = {
  field: "createdAt" | "issuedAt" | "status";
  direction: "asc" | "desc";
};
```

**Note**: `CertificateTemplateReturnType`, `StudentReturnType`, `CertificateFileReturnType`, `CertificateVerificationReturnType` are defined in their respective type files and imported via barrel. Forward references are handled through the barrel re-export — each type fileexports its own types and the barrel makes them all available.

**Key Design Decisions**:
- `createdByUserId` is omitted from `ReturnType` (internal audit field, not exposed to API)
- `status`, `issuedAt`, `verificationCode` are omitted from `SubmitInput` (server-managed — set during issuance)
- `studentName` is re-typed as `LocalizedString` from the raw jsonb

---

### 2.2 `certificate-template.types.ts`

**Path**: `backend/types/certificates/certificate-template.types.ts`

**Imports from**:
- `@/backend/db/schema` → `certificateTemplates`, `certificateTemplateVersions` tables
- `@/backend/enum` → `TemplateStatus`, `CertificateOrientation`
- `@/shared/types/localized-string` → `LocalizedString`

**Type Definitions**:

```typescript
import type { certificateTemplates, certificateTemplateVersions } from "@/backend/db/schema";
import type { TemplateStatus, CertificateOrientation } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { TemplateElementReturnType } from "./template-element.types";
import type { TemplateVariableReturnType } from "./template-variable.types";
import type { CertificateCategoryReturnType } from "./certificate-category.types";
import type { CertificateRecipientGroupReturnType } from "./certificate-recipient-group.types";

// ─── Template Types ──────────────────────────────────────────
export type CertificateTemplateSelectType = typeof certificateTemplates.$inferSelect;
export type CertificateTemplateInsertType = typeof certificateTemplates.$inferInsert;

export type CertificateTemplateReturnType = Omit<
  CertificateTemplateSelectType,
  "deletedAt" | "idempotencyKey" | "version" | "createdByUserId"
> & {
  status: TemplateStatus;          // re-applied
  orientation: CertificateOrientation; // re-applied
  name: LocalizedString;            // re-applied from jsonb
  description: LocalizedString | null; // re-applied from jsonb
  readonly elements?: TemplateElementReturnType[];
  readonly variables?: TemplateVariableReturnType[];
  readonly category?: CertificateCategoryReturnType | null;
  readonly versions?: CertificateTemplateVersionReturnType[];
  readonly recipientGroups?: CertificateRecipientGroupReturnType[];
};

export type CertificateTemplateSubmitInput = Omit<
  CertificateTemplateInsertType,
  | "id"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
  | "idempotencyKey"
  | "version"
  | "createdByUserId"
  | "status"
  | "publishedAt"
  | "publishedByUserId"
>;

export type CertificateTemplateFilterInput = {
  status?: TemplateStatus;
  categoryId?: string;
  isPublished?: boolean;
};

export type CertificateTemplateOrderByInput = {
  field: "createdAt" | "name" | "status";
  direction: "asc" | "desc";
};

// ─── Template Version Types ──────────────────────────────────
export type CertificateTemplateVersionSelectType = typeof certificateTemplateVersions.$inferSelect;
export type CertificateTemplateVersionInsertType = typeof certificateTemplateVersions.$inferInsert;

export type CertificateTemplateVersionReturnType = Omit<
  CertificateTemplateVersionSelectType,
  "deletedAt"
> & {
  status: TemplateStatus; // shared with parent template
  readonly template?: CertificateTemplateReturnType | null;
};

export type CertificateTemplateVersionCreateInput = Omit<
  CertificateTemplateVersionInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
```

---

### 2.3 `template-element.types.ts`

**Path**: `backend/types/certificates/template-element.types.ts`

**Type Definitions**:

```typescript
import type {
  templateElements,
  templateStaticTextElements,
  templateDataTextElements,
  templateDataDateElements,
  templateImageElements,
  templateQrCodeElements,
} from "@/backend/db/schema";
import type { TemplateElementType } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateTemplateReturnType } from "./certificate-template.types";

// ─── Template Element (base) ────────────────────────────────
export type TemplateElementSelectType = typeof templateElements.$inferSelect;
export type TemplateElementInsertType = typeof templateElements.$inferInsert;

export type TemplateElementReturnType = Omit<
  TemplateElementSelectType,
  "deletedAt"
> & {
  type: TemplateElementType; // re-applied
  config: Record<string, unknown>; // typed from jsonb
  readonly template?: CertificateTemplateReturnType | null;
};

export type TemplateElementSubmitInput = Omit<
  TemplateElementInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "templateId"
> & {
  config: Record<string, unknown>;
};

// ─── Sub-Element Types (by TemplateElementType) ─────────────

// Static Text Element
export type TemplateStaticTextElementSelectType = typeof templateStaticTextElements.$inferSelect;
export type TemplateStaticTextElementReturnType = TemplateStaticTextElementSelectType & {
  content: LocalizedString | null; // re-applied from jsonb
};

// Data Text Element
export type TemplateDataTextElementSelectType = typeof templateDataTextElements.$inferSelect;
export type TemplateDataTextElementReturnType = TemplateDataTextElementSelectType;

// Data Date Element
export type TemplateDataDateElementSelectType = typeof templateDataDateElements.$inferSelect;
export type TemplateDataDateElementReturnType = TemplateDataDateElementSelectType;

// Image Element
export type TemplateImageElementSelectType = typeof templateImageElements.$inferSelect;
export type TemplateImageElementReturnType = TemplateImageElementSelectType;

// QR Code Element
export type TemplateQrCodeElementSelectType = typeof templateQrCodeElements.$inferSelect;
export type TemplateQrCodeElementReturnType = TemplateQrCodeElementSelectType;

// ─── Union of all sub-element return types ──────────────────
export type TemplateElementDetailReturnType =
  | TemplateStaticTextElementReturnType
  | TemplateDataTextElementReturnType
  | TemplateDataDateElementReturnType
  | TemplateImageElementReturnType
  | TemplateQrCodeElementReturnType;
```

---

### 2.4 `template-variable.types.ts`

**Path**: `backend/types/certificates/template-variable.types.ts`

**Type Definitions**:

```typescript
import type {
  templateVariables,
  templateTextVariables,
  templateNumberVariables,
  templateDateVariables,
  templateSelectVariables,
  recipientGroupItemVariableValues,
} from "@/backend/db/schema";
import type { TemplateVariableType } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateTemplateReturnType } from "./certificate-template.types";

// ─── Template Variable (base) ───────────────────────────────
export type TemplateVariableSelectType = typeof templateVariables.$inferSelect;
export type TemplateVariableInsertType = typeof templateVariables.$inferInsert;

export type TemplateVariableReturnType = Omit<
  TemplateVariableSelectType,
  "deletedAt"
> & {
  type: TemplateVariableType; // re-applied
  name: LocalizedString;       // re-applied from jsonb
  description: LocalizedString | null; // re-applied from jsonb
  readonly template?: CertificateTemplateReturnType | null;
};

export type TemplateVariableSubmitInput = Omit<
  TemplateVariableInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "templateId"
>;

// ─── Sub-Variable Types ─────────────────────────────────────
export type TemplateTextVariableSelectType = typeof templateTextVariables.$inferSelect;
export type TemplateTextVariableReturnType = TemplateTextVariableSelectType;

export type TemplateNumberVariableSelectType = typeof templateNumberVariables.$inferSelect;
export type TemplateNumberVariableReturnType = TemplateNumberVariableSelectType;

export type TemplateDateVariableSelectType = typeof templateDateVariables.$inferSelect;
export type TemplateDateVariableReturnType = TemplateDateVariableSelectType;

export type TemplateSelectVariableSelectType = typeof templateSelectVariables.$inferSelect;
export type TemplateSelectVariableReturnType = TemplateSelectVariableSelectType & {
  options: LocalizedString[]; // re-applied from jsonb array
};

// ─── Recipient Group Item Variable Value ────────────────────
export type RecipientGroupItemVariableValueSelectType =
  typeof recipientGroupItemVariableValues.$inferSelect;
export type RecipientGroupItemVariableValueInsertType =
  typeof recipientGroupItemVariableValues.$inferInsert;

export type RecipientGroupItemVariableValueReturnType = Omit<
  RecipientGroupItemVariableValueSelectType,
  "valueIndexed"
> & {
  readonly variable?: TemplateVariableReturnType | null;
};
```

---

### 2.5 `certificate-recipient-group.types.ts`

**Path**: `backend/types/certificates/certificate-recipient-group.types.ts`

**Type Definitions**:

```typescript
import type {
  certificateRecipientGroups,
  recipientGroupItems,
} from "@/backend/db/schema";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateTemplateReturnType } from "./certificate-template.types";
import type { RecipientGroupItemVariableValueReturnType } from "./template-variable.types";

// ─── Recipient Group ────────────────────────────────────────
export type CertificateRecipientGroupSelectType = typeof certificateRecipientGroups.$inferSelect;
export type CertificateRecipientGroupInsertType = typeof certificateRecipientGroups.$inferInsert;

export type CertificateRecipientGroupReturnType = Omit<
  CertificateRecipientGroupSelectType,
  "deletedAt"
> & {
  name: LocalizedString | null;       // re-applied from jsonb
  description: LocalizedString | null; // re-applied from jsonb
  readonly items?: RecipientGroupItemReturnType[];
  readonly template?: CertificateTemplateReturnType | null;
};

export type CertificateRecipientGroupSubmitInput = Omit<
  CertificateRecipientGroupInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "templateId"
>;

// ─── Recipient Group Item ────────────────────────────────────
export type RecipientGroupItemSelectType = typeof recipientGroupItems.$inferSelect;
export type RecipientGroupItemInsertType = typeof recipientGroupItems.$inferInsert;

export type RecipientGroupItemReturnType = RecipientGroupItemSelectType & {
  readonly variableValues?: RecipientGroupItemVariableValueReturnType[];
};
```

---

### 2.6 `certificate-verification.types.ts`

**Path**: `backend/types/certificates/certificate-verification.types.ts`

**Type Definitions**:

```typescript
import type { certificateVerifications } from "@/backend/db/schema";
import type { VerificationStatus } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateReturnType } from "./certificate.types";

// ─── Verification ────────────────────────────────────────────
export type CertificateVerificationSelectType = typeof certificateVerifications.$inferSelect;
export type CertificateVerificationInsertType = typeof certificateVerifications.$inferInsert;

export type CertificateVerificationReturnType = CertificateVerificationSelectType & {
  result: VerificationStatus; // re-applied
  readonly certificate?: CertificateReturnType | null;
};

export type CertificateVerificationSubmitInput = {
  verificationCode: string;
  verificationMethod?: "public_link" | "qr_code" | "api";
};

// ─── Public Verification Result (no PII) ─────────────────────
export type PublicVerificationResult = {
  certificateFound: boolean;
  status: VerificationStatus;
  certificateIssueDate: Date | null;
  certificateTemplateName: LocalizedString | null;
  studentName: string | null; // display name only — no ID or contact info
};
```

**Key Design Decision**: `PublicVerificationResult` is a separate type that strips PII. The `CertificateVerificationSubmitInput` only accepts the verification code and method — no authenticated user context. This enforces PII protection at the type level.

---

### 2.7 `certificate-category.types.ts`

**Path**: `backend/types/certificates/certificate-category.types.ts`

**Type Definitions**:

```typescript
import type { certificateCategories } from "@/backend/db/schema";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateTemplateReturnType } from "./certificate-template.types";

// ─── Category (self-referencing tree) ────────────────────────
export type CertificateCategorySelectType = typeof certificateCategories.$inferSelect;
export type CertificateCategoryInsertType = typeof certificateCategories.$inferInsert;

export type CertificateCategoryReturnType = Omit<
  CertificateCategorySelectType,
  "deletedAt"
> & {
  name: LocalizedString;              // re-applied from jsonb
  description: LocalizedString | null;  // re-applied from jsonb
  readonly parent?: CertificateCategoryReturnType | null;
  readonly children?: CertificateCategoryReturnType[];
  readonly templates?: CertificateTemplateReturnType[];
};

export type CertificateCategorySubmitInput = Omit<
  CertificateCategoryInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;
```

---

### 2.8 `certificate-outcome.types.ts` (Feature 6)

**Path**: `backend/types/certificates/certificate-outcome.types.ts`

**Type Definitions**:

```typescript
import type {
  certificateLearningOutcomes,
  certificateProgressTracking,
} from "@/backend/db/schema";
import type { ProgressStatus } from "@/backend/enum";
import type { LocalizedString } from "@/shared/types/localized-string";
import type { CertificateTemplateReturnType } from "./certificate-template.types";
import type { CertificateReturnType } from "./certificate.types";

// ─── Learning Outcome (Knowledge Base) ──────────────────────
export type LearningOutcomeSelectType = typeof certificateLearningOutcomes.$inferSelect;
export type LearningOutcomeInsertType = typeof certificateLearningOutcomes.$inferInsert;

export type LearningOutcomeReturnType = Omit<
  LearningOutcomeSelectType,
  "deletedAt"
> & {
  title: LocalizedString;              // re-applied from jsonb
  description: LocalizedString | null;  // re-applied from jsonb
  readonly template?: CertificateTemplateReturnType | null;
  readonly progress?: ProgressTrackingReturnType[];
};

export type LearningOutcomeSubmitInput = Omit<
  LearningOutcomeInsertType,
  "id" | "createdAt" | "updatedAt" | "deletedAt" | "templateId"
>;

// ─── Progress Tracking ──────────────────────────────────────
export type ProgressTrackingSelectType = typeof certificateProgressTracking.$inferSelect;
export type ProgressTrackingInsertType = typeof certificateProgressTracking.$inferInsert;

export type ProgressTrackingReturnType = Omit<
  ProgressTrackingSelectType,
  "idempotencyKey"
> & {
  status: ProgressStatus; // re-applied
  readonly certificate?: CertificateReturnType | null;
  readonly outcome?: LearningOutcomeReturnType | null;
};

export type ProgressTrackingSubmitInput = Omit<
  ProgressTrackingInsertType,
  "id" | "createdAt" | "updatedAt" | "idempotencyKey"
>;
```

**Note**: This file requires a `ProgressStatus` enum (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `OVERDUE`). If Plan 01 does not include this enum, add it to `backend/enum/certificates/certificate.enum.ts` as a supplementary enum and register it in Pothos alongside the others.

---

### 2.9 `index.ts` (Barrel Export)

**Path**: `backend/types/certificates/index.ts`

```typescript
export * from "./certificate.types";
export * from "./certificate-template.types";
export * from "./template-element.types";
export * from "./template-variable.types";
export * from "./certificate-recipient-group.types";
export * from "./certificate-verification.types";
export * from "./certificate-category.types";
export * from "./certificate-outcome.types";
```

---

## 3. Permission Enum Design

### 3.1 `AppPermission` Additions

**File to modify**: `backend/enum/permissions/permission.enum.ts`

**Insertion point**: After the last existing permission group (e.g., after the Settings permissions), add a new section:

```typescript
  // ─── Certificate permissions ─────────────────────────────
  CERTIFICATES_LIST           = "certificates.list",
  CERTIFICATES_CREATE          = "certificates.create",
  CERTIFICATES_EDIT            = "certificates.edit",
  CERTIFICATES_DELETE          = "certificates.delete",
  CERTIFICATES_VIEW_OWN        = "certificates.view_own",
  CERTIFICATES_VIEW_OTHER      = "certificates.view_other",
  CERTIFICATES_GENERATE        = "certificates.generate",
  CERTIFICATES_REVOKE          = "certificates.revoke",
  CERTIFICATES_VERIFY          = "certificates.verify",
  CERTIFICATES_MANAGE_TEMPLATE = "certificates.manage_template",
  CERTIFICATES_DOWNLOAD        = "certificates.download",
```

**Naming Convention**: All values use the 2-segment dot-path convention (`certificates.<action>`) consistent with existing permissions like `students.list`, `billing.create_invoice`.

**`filterKnownAppPermissions` helper**: No changes needed — it derives from `Object.values(AppPermission)` dynamically.

**DB `appPermissionEnum` pgEnum**: This PostgreSQL enum needs to be updated to include the new values. This is handled by running `bun run db push` (or a migration) after the TS enum is updated. The DB enum sync is documented but the actual DB push may be deferred to Plan 01/06 coordination.

### 3.2 Permission Group Assignment Documentation

**No code changes in this plan** — group assignments are seed data (Plan 06). This plan documents the intended assignments:

| Group Slug | Permissions | Rationale |
|---|---|---|
| `super_admin` | ALL (11) | Automatic via `isSuperAdmin` flag — no explicit seed |
| `academy_admin` | 10 (all except `MANAGE_TEMPLATE`) | Full certificate management but not template design |
| `teacher_default` | `LIST`, `GENERATE`, `VIEW_OWN` | Teachers generate certificates for their students |
| `student_default` | `VIEW_OWN` | Students view their earned certificates |
| `parent_default` | `VIEW_OWN` | Parents view their children's certificates |
| `staff_default` | `LIST`, `VIEW_OTHER`, `VERIFY`, `DOWNLOAD` | Staff list, verify, download — no create/edit/delete |
| `supervisor_default` | `LIST`, `VIEW_OTHER`, `VERIFY`, `DOWNLOAD` | Same as staff — read-only auditors |

---

## 4. Pothos Enum Registration Design

### 4.1 File to Modify

**File**: `backend/graphql/pothos/shared/enum.pothos.ts`

**Insertion point**: After existing enum registrations, add certificate enums:

```typescript
import {
  CertificateStatus,
  TemplateStatus,
  TemplateElementType,
  TemplateVariableType,
  CertificateOrientation,
  VerificationStatus,
  // If ProgressStatus is added:
  ProgressStatus,
} from "@/backend/enum/certificates";

// ... existing registrations ...

// ─── Certificate enums ──────────────────────────────────────
gqlSchemaBuilder.enumType(CertificateStatus, { name: "CertificateStatus" });
gqlSchemaBuilder.enumType(
  TemplateStatus,
  { name: "TemplateStatus" },
);
gqlSchemaBuilder.enumType(TemplateElementType, { name: "TemplateElementType" });
gqlSchemaBuilder.enumType(TemplateVariableType, { name: "TemplateVariableType" });
gqlSchemaBuilder.enumType(CertificateOrientation, { name: "CertificateOrientation" });
gqlSchemaBuilder.enumType(VerificationStatus, { name: "VerificationStatus" });
gqlSchemaBuilder.enumType(ProgressStatus, { name: "ProgressStatus" }); // if added
```

### 4.2 Post-Registration Steps

After adding enum registrations:
1. Run `bun run generate:gqlSchema` — regenerates the GraphQL schema file with new enum type definitions
2. Run `bun codegen` — generates TypeScript types from the updated schema

These are verification steps that confirm the enum registration is valid.

---

## 5. Barrel Export Wiring Design

### 5.1 `backend/types/index.ts` Modification

Add `export * from "./certificates";` in alphabetical order:

```typescript
// existing exports...
export * from "./billing";
export * from "./certificates";  // ← ADD THIS (after "billing", before "expenses" or next alpha)
// existing exports...
```

### 5.2 Verify `backend/enum/certificates/index.ts` (from Plan 01)

Plan 01 should have created:
- `backend/enum/certificates/index.ts` with `export * from "./certificate.enum";`
- `backend/enum/index.ts` with `export * from "./certificates";`

**Verification**: If these do not exist, create them. If they exist, verify correctness.

---

## 6. Cross-File Type Resolution Strategy

### 6.1 Circular Dependency Avoidance

Type files reference each other via type imports (e.g., `CertificateReturnType` references `CertificateTemplateReturnType`). TypeScript handles this via:
1. All cross-type references use `import type { ... }` (type-only imports — erased at compile time)
2. The barrel `index.ts` re-exports all types, making them available as `import { X } from "@/backend/types"`
3. No runtime circular dependencies — types are compile-time only

### 6.2 Type Reference Graph

```
certificate.types.ts
  ├── certificate-template.types.ts (template relation)
  ├── students.types.ts (student relation — existing)
  └── certificate-verification.types.ts (verifications relation)

certificate-template.types.ts
  ├── template-element.types.ts (elements relation)
  ├── template-variable.types.ts (variables relation)
  ├── certificate-category.types.ts (category relation)
  ├── certificate-recipient-group.types.ts (recipientGroups relation)
  └── (self: template versions)

template-element.types.ts
  └── certificate-template.types.ts (template relation)

template-variable.types.ts
  ├── certificate-template.types.ts (template relation)
  └── certificate-recipient-group.types.ts (variable values)

certificate-recipient-group.types.ts
  ├── certificate-template.types.ts (template relation)
  └── template-variable.types.ts (variable values)

certificate-verification.types.ts
  └── certificate.types.ts (certificate relation)

certificate-category.types.ts
  ├── (self: parent/children)
  └── certificate-template.types.ts (templates relation)

certificate-outcome.types.ts (Feature 6)
  ├── certificate-template.types.ts (template relation)
  ├── certificate.types.ts (certificate relation)
  └── (self: outcome → progress)
```

This graph has no cycles because:
- Relations are typed as `readonly` optional fields
- All cross-references use `import type` (type-only, erased at runtime)
- The barrel re-exports resolve all types at compile time

---

## 7. UX/Navigation Specification

### 7.1 Navigation Impact

**This plan is types-only. No routes, sidebar entries, or frontend components are created.**

However, the permission entries (`AppPermission.CERTIFICATES_*`) defined in this plan will be used by future plans to gate navigation:

| Nav Item | Permission | Visible To Groups |
|---|---|---|
| `SIDEBAR_NAV_ITEMS` → "Certificates" | `CERTIFICATES_LIST` or `CERTIFICATES_VIEW_OWN` | super_admin, academy_admin, staff, supervisor, teacher (view own) |
| `SIDEBAR_NAV_ITEMS` → "Certificate Templates" | `CERTIFICATES_MANAGE_TEMPLATE` | super_admin (default) |
| `SIDEBAR_NAV_ITEMS` → "Verify Certificate" | `CERTIFICATES_VERIFY` | super_admin, academy_admin, staff, supervisor |
| Public verification route | (no permission) | ALL (unauthenticated) |

### 7.2 Navigation Configuration (Deferred to Plan 05+)

The following entries will be added to `frontend/stores/navigationConfig.ts` in Plan 05:

```typescript
// In PAGE_PERMISSIONS:
PAGE_PERMISSIONS.certificates = {
  list: AppPermission.CERTIFICATES_LIST,
  viewOwn: AppPermission.CERTIFICATES_VIEW_OWN,
  viewOther: AppPermission.CERTIFICATES_VIEW_OTHER,
  create: AppPermission.CERTIFICATES_CREATE,
  edit: AppPermission.CERTIFICATES_EDIT,
  delete: AppPermission.CERTIFICATES_DELETE,
  generate: AppPermission.CERTIFICATES_GENERATE,
  revoke: AppPermission.CERTIFICATES_REVOKE,
  verify: AppPermission.CERTIFICATES_VERIFY,
  manageTemplate: AppPermission.CERTIFICATES_MANAGE_TEMPLATE,
  download: AppPermission.CERTIFICATES_DOWNLOAD,
};

// In SIDEBAR_NAV_ITEMS:
{
  labelKey: "nav.certificates",
  href: "/certificates",
  permission: AppPermission.CERTIFICATES_LIST,
  icon: "certificate",
  groupId: "grp_academics",
}
```

### 7.3 Localization Keys (Deferred to Plan 05+)

Translation keys for nav items will be added to `shared/locale/{en,ar}/dashboard/core/nav.ts`:

```typescript
// en
certificates: "Certificates",
// ar
certificates: "الشهادات",
```

---

## 8. Outcome & Knowledge Transfer Protocol

### 8.1 What This Plan Establishes

This plan establishes the **canonical type contract** for the entire certificate feature. Every subsequent plan (03-07) depends on these type definitions:

| Plan | How It Uses Plan 02 Types |
|---|---|
| Plan 03 (Repositories) | `{Entity}SelectType` for repo method return types, `{Entity}InsertType` for create inputs, `mapEntityToDto` return types use `{Entity}ReturnType` |
| Plan 04 (Services) | `{Entity}ReturnType` for service method return types, `{Entity}SubmitInput` for service method inputs, `EntityFilterInput` for query parameters |
| Plan 04 (GraphQL) | `{Entity}ReturnType` defines the Pothos object type shape, Pothos enums registered here are exposed as GraphQL enums |
| Plan 05 (Frontend) | Generated types from `bun codegen` (derived from Pothos schema using these types) |
| Plan 06 (Seeds) | Permission group seed data uses `AppPermission.CERTIFICATES_*` values |
| Plan 07 (Tests) | Test factories create entities using `{Entity}InsertType`, assertions check against `{Entity}ReturnType` |

### 8.2 Knowledge Carry-Forward

**Critical patterns that MUST be preserved across plans**:

1. **Canonical Naming**: Always use `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput` — never the older `{Entity}Entity` / `{Entity}EntityInput` convention
2. **Omit Pattern**: `ReturnType` always omits internal fields (`deletedAt`, `idempotencyKey`, `version`, `createdByUserId`) and re-applies TS enum types that Drizzle infers as `string`
3. **Import Convention**: Types import from `@/backend/db/schema` and `@/backend/enum` — never from relative paths or from `@/backend/types` (barrel)
4. **Permission Dot-Path**: All certificate permissions use 2-segment paths (`certificates.<action>`) — no 3+ segment paths
5. **Pothos Registration**: Enums are registered via `gqlSchemaBuilder.enumType(Enum, { name })` — never hand-coded in Pothos types
6. **Public vs. Authenticated**: `PublicVerificationResult` is a separate type from `CertificateVerificationReturnType` — public verification deliberately strips PII

### 8.3 Outcome Artifacts

After completing this plan, the following artifacts are available for downstream plans:

| Artifact | Location | Used By |
|---|---|---|
| Type barrel | `backend/types/certificates/index.ts` | All TypeScript files importing certificate types |
| Type barrel wiring | `backend/types/index.ts` (modified) | `import { CertificateReturnType } from "@/backend/types"` |
| Permission enum entries | `backend/enum/permissions/permission.enum.ts` (modified) | `PermissionsService.hasAnyPermission(userId, [AppPermission.CERTIFICATES_*])` |
| Pothos enum registrations | `backend/graphql/pothos/shared/enum.pothos.ts` (modified) | GraphQL schema generation, codegen |
| Permission group assignment doc | This design doc | Plan 06 (seed data) |
| Type reference graph | This design doc §6.2 | Developers understanding cross-type relationships |

### 8.4 Progress Tracking Entry Points

Feature 6 (Outcome Knowledge Base & Progress Tracking) introduces these type entry points:

- `LearningOutcomeReturnType` — used by template detail views to show learning outcomes
- `ProgressTrackingReturnType` — used by student dashboard to show progress certificates
- These types will be consumed by:
  - Plan 03: Repository methods `findOutcomesByCertificateId`, `findProgressByStudentId`, `updateProgress`
  - Plan 04: Service methods for outcome CRUD and progress upsert
  - Plan 05: Frontend views for progress tracking dashboard

---

## 9. Risk Analysis & Mitigation

### 9.1 Type-Related Risks

| Risk | Mitigation |
|---|---|
| Circular type imports | All cross-file references use `import type` — erased at compile time. No runtime circular dependencies. Barrel re-exports resolve at type level. |
| Drizzle `$inferSelect` infers pgEnum columns as `string` instead of TS enum | `ReturnType` re-applies the TS enum type via intersection (`& { status: CertificateStatus }`) |
| Missing `ProgressStatus` enum from Plan 01 | Document supplement in tasks; add to `backend/enum/certificates/certificate.enum.ts` if missing |
| `StudentReturnType` import from existing students types | Verify `StudentReturnType` is exported from `backend/types/students/` — if the older dialect uses `Student` as the return type alias, use the correct name |

### 9.2 Permission-Related Risks

| Risk | Mitigation |
|---|---|
| DB `appPermissionEnum` pgEnum not synced with new TS entries | Run `bun run db push` after TS enum update — Drizzle generates ALTER TYPE for pgEnum |
| Existing `filterKnownAppPermissions` breaks | No risk — helper derives from `Object.values(AppPermission)` dynamically |
| Permission group assignment mismatch | Document intended assignments in this plan; seed implementation is Plan 06 scope |

### 9.3 Pothos-Related Risks

| Risk | Mitigation |
|---|---|
| `generate:gqlSchema` fails after enum registration | Verify TS enum exports match `gqlSchemaBuilder.enumType` calls — same import path, same enum name |
| Codegen produces stale types | Run `bun codegen` after `generate:gqlSchema` — sequential, not parallel |
| Existing schema breaks from new enums | Additive change — new enums don't affect existing types/queries |

---

## 10. Verification Strategy

### 10.1 Per-File Verification

Each file created/modified undergoes the verification loop:

```bash
# Type check (safe to run concurrently)
bun tsgo

# Biome format/lint (safe to run concurrently)
bun biome:check

# ESLint via queue (file-scoped)
LINT_QUEUE_PORT=$(grep -oP 'LINT_QUEUE_PORT = \K\d+' scripts/lint-queue-config.ts)
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"verify-02","files":["backend/types/certificates/certificate.types.ts"]}'
```

### 10.2 Integration Verification

After all files are created:

```bash
# Full type check
bun tsgo

# Full format/lint check
bun biome:check

# Full repo lint
bun run lint

# GraphQL schema generation (verifies Pothos registration)
bun run generate:gqlSchema

# Codegen (generates types from schema)
bun codegen
```

### 10.3 Cross-Plan Verification

Verify downstream compatibility:

```bash
# Verify that @/backend/types resolves certificate types
# (run a quick import check via tsgo)
bun tsgo
```

If Plan 03 (repositories) files already exist, verify they compile against the new types.

---

## 11. Dependency Graph

```
Plan 01 (DB Schema & Enums) ──── COMPLETE (required)
  │
  ├── certificates table ────────────────► certificate.types.ts
  ├── certificate_templates table ───────► certificate-template.types.ts
  ├── template_elements table ───────────► template-element.types.ts
  ├── template_variables table ─────────► template-variable.types.ts
  ├── certificate_recipient_groups table ► certificate-recipient-group.types.ts
  ├── certificate_verifications table ──► certificate-verification.types.ts
  ├── certificate_categories table ─────► certificate-category.types.ts
  ├── certificate_learning_outcomes ────► certificate-outcome.types.ts (Feature 6)
  ├── certificate_progress_tracking ─────► certificate-outcome.types.ts (Feature 6)
  │
  ├── CertificateStatus enum ───────────► Pothos enum registration
  ├── TemplateStatus enum ──────────────► Pothos enum registration
  ├── TemplateElementType enum ─────────► Pothos enum registration
  ├── TemplateVariableType enum ────────► Pothos enum registration
  ├── CertificateOrientation enum ──────► Pothos enum registration
  └── VerificationStatus enum ──────────► Pothos enum registration
                                           │
Plan 02 (THIS) ────────────────────────────┘
  │
  ├── backend/types/certificates/*.ts
  ├── backend/types/certificates/index.ts
  ├── backend/types/index.ts (modified)
  ├── backend/enum/permissions/permission.enum.ts (modified)
  └── backend/graphql/pothos/shared/enum.pothos.ts (modified)
```
