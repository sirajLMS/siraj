# CGVS Database Schema Analysis

> **Source**: `/home/ahmed/Projects/cgvs/` (server/db/schema/, server/db/repo/, server/types/)
> **ORM**: Drizzle ORM (beta, pre-1.0) with `drizzle-orm/node-postgres` (pg Pool)
> **Database**: PostgreSQL
> **Migration tool**: drizzle-kit (`./server/drizzle/`)
> **Purpose**: Complete analysis of CGVS database schema, types, repositories, and relations for integration into Siraj

---

## Table of Contents

1. [Overview](#overview)
2. [Database Configuration](#database-configuration)
3. [Enum Definitions](#enum-definitions)
4. [Schema Tables (by domain)](#schema-tables-by-domain)
   - [4.1 Auth Domain](#41-auth-domain)
   - [4.2 Student Domain](#42-student-domain)
   - [4.3 Template Domain](#43-template-domain)
   - [4.4 Template Element Domain](#44-template-element-domain)
   - [4.5 Template Variable Domain](#45-template-variable-domain)
   - [4.6 Recipient Group Domain](#46-recipient-group-domain)
   - [4.7 Certificate Domain](#47-certificate-domain)
   - [4.8 Storage Domain](#48-storage-domain)
   - [4.9 Cache Domain](#49-cache-domain)
5. [Drizzle Relations](#drizzle-relations)
6. [Type System](#type-system)
7. [Repository Pattern](#repository-pattern)
8. [Query Utilities](#query-utilities)
9. [Migrations](#migrations)
10. [Siraj Integration Notes](#siraj-integration-notes)

---

## Overview

CGVS has **19 tables** across 6 domains (auth, students, templates, certificates, storage, cache). The schema uses PostgreSQL-specific features including GIN/GiST full-text search indices, `pg_trgm` extension for trigram search, and row-level locking via `SELECT FOR UPDATE SKIP LOCKED` for signed URL atomic claims.

### Key Characteristics
- **No foreign key constraints** on most tables (only `user_roles` has FKs). Relationships are managed at the application level via repositories.
- **Serial/BigSerial primary keys** — not UUIDs (unlike Siraj which may use different ID strategies)
- **Timestamp precision 3** (millisecond) on all timestamp columns
- **Unlogged cache table** for better write performance (no WAL)
- **GIN + GiST dual indexing** on name columns for both FTS and LIKE/ILIKE search
- **Enum strategy**: Uses `createPgEnumFromEnum()` utility to convert TypeScript enums to PG enums

---

## Database Configuration

### DrizzleDb Setup (`server/db/drizzleDb.ts`)

```typescript
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { relations } from "./drizzleRelations";

export const drizzleDbPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

export const db = drizzle(drizzleDbPool, { relations });
```

- Uses `node-postgres` Pool (NOT Neon HTTP client)
- Pool max connections: 10
- Relations defined separately in `drizzleRelations.ts`
- `DATABASE_URL` environment variable required

### Drizzle Config (`drizzle.config.ts`)

```typescript
export default defineConfig({
  out: "./server/drizzle",
  dialect: "postgresql",
  schema: "./server/db/schema",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Schema Index (`server/db/schema/index.ts`)

Exports from 7 files:
```typescript
export * from "./users";
export * from "./students";
export * from "./templates";
export * from "./templateVariables";
export * from "./templateRecipientGroups";
export * from "./templateElements";
export * from "./certificates";
export * from "./storage";
export * from "./cache";
```

---

## Enum Definitions

### TypeScript Enums (`lib/enum.ts`)

```typescript
enum Calendar { Gregorian, Hijri }           // 0, 1
enum OrderSortDirection { ASC, DESC }         // "ASC", "DESC"
enum Gender { MALE, FEMALE, OTHER }            // "MALE", "FEMALE", "OTHER"
enum CountryCode { SA, PS, YE, SY, EG, ... }   // ~200 country codes (2-letter ISO)
```

### PG Enums (defined in schema files)

| Enum Name | Values | Source File |
|-----------|--------|-------------|
| `gender` | MALE, FEMALE, OTHER | `enums.ts` (from `Gender` enum) |
| `country_code` | SA, PS, YE, ... (~200) | `enums.ts` (from `CountryCode` enum) |
| `template_element_type` | static_text, data_text, data_date, image, qr_code | `templateElements.ts` |
| `template_element_source_type` | student, variable, certificate | `templateElements.ts` |
| `category_special_type` | Main, Suspension | `templates.ts` |
| `template_config_key` | MAX_BACKGROUND_SIZE, ALLOWED_FILE_TYPES | `templates.ts` |
| `template_variable_type` | TEXT, NUMBER, DATE, SELECT | `templateVariables.ts` (from `TemplateVariableType` enum) |

### Enum Utility (`server/utils/db.utils.ts`)

```typescript
export function createPgEnumFromEnum<T extends Record<string, string>>(
  enumName: string,
  enumObject: T
) {
  return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}
```

This utility converts TypeScript string enums to Drizzle PG enums. Used for `gender`, `country_code`, and `template_variable_type`.

---

## Schema Tables by Domain

### 4.1 Auth Domain

#### `users` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | NOT NULL, UNIQUE |
| emailVerifiedAt | timestamp(3) | nullable |
| password | varchar(255) | NOT NULL |
| rememberToken | varchar(100) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

#### `roles` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK |
| name | text | NOT NULL, UNIQUE |

#### `user_roles` table (join table)
| Column | Type | Constraints |
|--------|------|-------------|
| userId | integer | NOT NULL, FK → users(id) ON DELETE CASCADE |
| roleId | integer | NOT NULL, FK → roles(id) ON DELETE CASCADE |
| **PK** | composite | (userId, roleId) |

> **Note**: This is the ONLY table with foreign key constraints in the entire schema.

#### `sessions` table
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar(255) | PK |
| userId | integer | nullable |
| ipAddress | varchar(45) | nullable |
| userAgent | text | nullable |
| payload | text | NOT NULL |
| lastActivity | integer | NOT NULL |

Indices:
- `sessions_user_id_index` on `userId`
- `sessions_last_activity_index` on `lastActivity`

> **Note**: DB-backed sessions (NOT stateless JWT). Session ID is a string PK (not auto-increment).

#### `passwordResetTokens` table
| Column | Type | Constraints |
|--------|------|-------------|
| email | varchar(255) | PK |
| token | varchar(255) | NOT NULL |
| createdAt | timestamp(3) | nullable |

---

### 4.2 Student Domain

#### `students` table (table name: `student`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| name | varchar(255) | NOT NULL |
| email | varchar(255) | nullable |
| phoneNumber | varchar(255) | nullable |
| dateOfBirth | timestamp(3) | nullable |
| gender | gender enum | nullable |
| nationality | country_code enum | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Indices:
- `idx_students_name_fts` — GIN index on `to_tsvector('simple', name)` for full-text search
- `idx_students_name_trgm` — GiST index on `name` using `gist_trgm_ops` for fast LIKE/ILIKE

> **Note**: Singular table name (`student` not `students`). No FK relationships defined at DB level.

---

### 4.3 Template Domain

#### `templateCategories` table (table name: `TemplateCategory`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| name | varchar(255) | NOT NULL |
| description | text | nullable |
| parentCategoryId | integer | nullable (self-reference, no FK) |
| order | integer | NOT NULL |
| specialType | category_special_type enum | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Indices:
- `template_category_special_type_key` — UNIQUE on `specialType` (only one Main, one Suspension)
- `idx_template_categories_name_fts` — GIN on name
- `idx_template_categories_name_trgm` — GiST on name

> **Self-referencing**: `parentCategoryId` creates a tree structure (categories with parent categories)
> **Special types**: `Main` (root of visible categories), `Suspension` (hidden, for suspended templates)
> **Table name**: Uses PascalCase `TemplateCategory` in DB (irregular)

#### `templates` table (table name: `template`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| name | varchar(255) | NOT NULL |
| description | text | nullable |
| imageFileId | bigint | nullable (FK → storage_files, no constraint) |
| categoryId | integer | NOT NULL (FK → templateCategories, no constraint) |
| order | integer | NOT NULL |
| preSuspensionCategoryId | integer | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Indices:
- `idx_templates_name_fts` — GIN on name
- `idx_templates_name_trgm` — GiST on name

> **Suspension mechanism**: When a template is suspended, `categoryId` is set to the Suspension category and `preSuspensionCategoryId` stores the original category. Unsuspension restores the original category.

#### `templatesConfigs` table (table name: `templates_config`)
| Column | Type | Constraints |
|--------|------|-------------|
| key | template_config_key enum | PK |
| value | text | NOT NULL |

> Key-value configuration table for template settings like `MAX_BACKGROUND_SIZE` and `ALLOWED_FILE_TYPES`.

---

### 4.4 Template Element Domain

#### `templateElements` table (table name: `template_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| templateId | integer | NOT NULL |
| type | template_element_type enum | NOT NULL |
| xCoordinate | real | NOT NULL |
| yCoordinate | real | NOT NULL |
| fontSize | integer | nullable |
| color | varchar(20) | nullable |
| alignment | varchar(20) | nullable |
| fontFamily | varchar(100) | nullable |
| languageConstraint | varchar(10) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

> **Absolute positioning**: Elements use X/Y coordinates (real type) for canvas-like placement on certificate templates
> **5 element types**: static_text, data_text, data_date, image, qr_code
> **languageConstraint**: Restricts element to a specific locale (e.g., "ar", "en")

#### Sub-element tables (polymorphic via `elementId` as PK)

Each extends the base `templateElements` record with type-specific fields:

##### `templateStaticTextElements` (`template_static_text_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| elementId | integer | PK (FK → template_elements, no constraint) |
| content | text | NOT NULL |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

##### `templateDataTextElements` (`template_data_text_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| elementId | integer | PK |
| sourceType | template_element_source_type enum | NOT NULL |
| sourceField | varchar(100) | NOT NULL |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

> **sourceType**: `student` (from student record), `variable` (from template variable), `certificate` (from certificate data like release_date)

##### `templateDataDateElements` (`template_data_date_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| elementId | integer | PK |
| sourceType | template_element_source_type enum | NOT NULL |
| sourceField | varchar(100) | NOT NULL |
| dateFormat | varchar(50) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

##### `templateImageElements` (`template_image_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| elementId | integer | PK |
| imageUrl | varchar(500) | NOT NULL |
| width | integer | nullable |
| height | integer | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

##### `templateQrCodeElements` (`template_qr_code_element`)
| Column | Type | Constraints |
|--------|------|-------------|
| elementId | integer | PK |
| size | integer | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

> **Polymorphic pattern**: Base `templateElements` holds common fields + type discriminator. Sub-tables hold type-specific fields using `elementId` as PK (one-to-one). This is a table-per-type inheritance pattern.

---

### 4.5 Template Variable Domain

#### `templateVariableBases` table (table name: `template_variable_base`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| templateId | integer | NOT NULL |
| name | varchar(255) | NOT NULL |
| description | text | nullable |
| type | template_variable_type enum | NOT NULL |
| required | boolean | NOT NULL, DEFAULT false |
| order | integer | NOT NULL |
| previewValue | varchar(255) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Index:
- `template_base_variable_template_id_name_key` — UNIQUE on (templateId, name)

> Variables are per-template custom fields that can be assigned values per recipient. 4 types: TEXT, NUMBER, DATE, SELECT.

#### Sub-variable tables (same polymorphic pattern as elements)

##### `templateTextVariables` (`template_text_variable`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK (FK → template_variable_base, no constraint) |
| minLength | integer | nullable |
| maxLength | integer | nullable |
| pattern | varchar(255) | nullable |

##### `templateNumberVariables` (`template_number_variable`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK |
| minValue | decimal | nullable |
| maxValue | decimal | nullable |
| decimalPlaces | integer | nullable |

##### `templateDateVariables` (`template_date_variable`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK |
| minDate | timestamp(3) | nullable |
| maxDate | timestamp(3) | nullable |
| format | varchar(50) | nullable |

##### `templateSelectVariables` (`template_select_variable`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | integer | PK |
| options | json | nullable |
| multiple | boolean | nullable |

> **Note**: Sub-variable tables have NO `createdAt`/`updatedAt` columns (unlike base table). They rely on the base record's timestamps.

---

### 4.6 Recipient Group Domain

#### `templateRecipientGroups` table (table name: `template_recipient_group`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| templateId | integer | NOT NULL |
| name | varchar(255) | NOT NULL |
| description | text | nullable |
| date | timestamp(3) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

> A recipient group represents a batch/cohort of students who will receive certificates for a specific template. Has an optional `date` field (e.g., course completion date).

#### `templateRecipientGroupItems` table (table name: `template_recipient_group_item`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| recipientGroupId | integer | NOT NULL |
| studentId | integer | NOT NULL |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Index:
- `trgi_student_group_unique` — UNIQUE on (studentId, recipientGroupId)

> Join table linking students to recipient groups. Unique constraint prevents duplicate assignments.

#### `recipientGroupItemVariableValues` table (table name: `recipient_group_item_variable_value`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| templateRecipientGroupItemId | integer | NOT NULL |
| templateVariableId | integer | NOT NULL |
| value | text | nullable |
| valueIndexed | varchar(255) | nullable |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Indices:
- `rgiv_group_item_variable_unique` — UNIQUE on (templateRecipientGroupItemId, templateVariableId)
- `rgiv_value_idx` — on `valueIndexed`

> **Per-recipient variable values**: Each recipient (student in a group) can have custom values for template variables. `valueIndexed` is used for searching/filtering (short version of `value`).
> **Naming inconsistency**: `templateVariableId` is camelCase while other columns are snake_case.

---

### 4.7 Certificate Domain

#### `certificates` table (table name: `certificate`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | serial | PK |
| templateId | integer | NOT NULL |
| studentId | integer | NOT NULL |
| templateRecipientGroupId | integer | NOT NULL |
| releaseDate | timestamp(3) | NOT NULL |
| verificationCode | varchar(255) | NOT NULL, UNIQUE |
| deletedAt | timestamp(3) | nullable (soft delete) |
| createdAt | timestamp(3) | NOT NULL |
| updatedAt | timestamp(3) | NOT NULL |

Index:
- `unique_student_template_certificate` — UNIQUE on (templateId, studentId)

> **Critical finding**: Certificate table exists in schema but has NO repository, NO GraphQL operations, NO service layer. It's completely unimplemented.
> **Verification code**: `verificationCode` column is designed for certificate verification but no generation logic exists.
> **Soft delete**: `deletedAt` for soft deletion (no hard delete operation).
> **One certificate per student per template**: Unique constraint prevents duplicates.
> **No status field**: No draft/issued/revoked/expired status lifecycle.

---

### 4.8 Storage Domain

#### `storageFiles` table (table name: `storage_file`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigserial | PK |
| path | text | NOT NULL, UNIQUE |
| isProtected | boolean | NOT NULL, DEFAULT false |

> Minimal file registry. Path is unique. `bigserial` ID because there could be millions of files.

#### `fileUsages` table (table name: `file_usage`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigserial | PK |
| filePath | varchar(1024) | NOT NULL |
| usageType | varchar(100) | NOT NULL |
| referenceId | bigint | NOT NULL |
| referenceTable | varchar(100) | NOT NULL |
| createdAt | timestamp(3) | NOT NULL |

> **Polymorphic usage tracking**: Any file can be used by any entity (template cover, certificate image, etc.). `referenceId` + `referenceTable` form a polymorphic FK. Prevents deletion of files that are in use.

#### `storageDirectories` table (table name: `storage_directory`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | bigserial | PK |
| path | varchar(1024) | NOT NULL, UNIQUE |
| allowUploads | boolean | NOT NULL, DEFAULT true |
| allowDelete | boolean | NOT NULL, DEFAULT true |
| allowMove | boolean | NOT NULL, DEFAULT true |
| allowCreateSubDirs | boolean | NOT NULL, DEFAULT true |
| allowDeleteFiles | boolean | NOT NULL, DEFAULT true |
| allowMoveFiles | boolean | NOT NULL, DEFAULT true |
| isProtected | boolean | NOT NULL, DEFAULT false |
| protectChildren | boolean | NOT NULL, DEFAULT false |

> **Directory permissions**: 6 boolean flags controlling operations on directories. `protectChildren` cascades protection to child items.

#### `signedUrls` table (table name: `signed_url`)
| Column | Type | Constraints |
|--------|------|-------------|
| id | varchar(64) | PK (UUID token) |
| filePath | varchar(1024) | NOT NULL |
| contentType | varchar(255) | NOT NULL |
| fileSize | bigint | NOT NULL |
| contentMd5 | varchar(44) | NOT NULL (base64-encoded MD5) |
| expiresAt | timestamp(3) | NOT NULL |
| createdAt | timestamp(3) | NOT NULL |
| used | boolean | NOT NULL, DEFAULT false |

Indices:
- `signed_url_expires_at_idx` on `expiresAt`
- `signed_url_used_expires_idx` on (used, expiresAt)

> **Atomic claim pattern**: Uses `SELECT FOR UPDATE SKIP LOCKED` to atomically claim a signed URL (prevents race conditions on concurrent downloads). See `SignedUrlRepository.claimSignedUrl()`.
> **One-time use**: `used` flag ensures each signed URL can only be used once.

---

### 4.9 Cache Domain

#### `cache` table
| Column | Type | Constraints |
|--------|------|-------------|
| key | text | PK |
| value | text | NOT NULL |
| expiresAt | timestamp(with time zone) | NOT NULL |

Index:
- `cache_expires_at_idx` on `expiresAt`

> **UNLOGGED table** (no WAL) for better write performance. Crash-unsafe but acceptable for cache. Used for rate limiting and general caching.

---

## Drizzle Relations

Defined in `server/db/drizzleRelations.ts` using the **new `defineRelations` API** (Drizzle ORM beta):

```typescript
export const relations = defineRelations(schema, r => ({
  users: {
    sessions: r.many.sessions({ from: r.users.id, to: r.sessions.userId }),
    roles: r.many.roles(),
    userRoles: r.many.userRoles({ from: r.users.id, to: r.userRoles.userId }),
    manySelf: r.many.users({ from: r.users.id, to: r.users.id }),
  },
  roles: {
    users: r.many.users({
      from: r.roles.id.through(r.userRoles.roleId),
      to: r.users.id.through(r.userRoles.userId),
    }),
    userRoles: r.many.userRoles({ from: r.roles.id, to: r.userRoles.roleId }),
  },
  userRoles: {
    role: r.one.roles({}),
    user: r.one.users({}),
  },
  sessions: {
    user: r.one.users({ from: r.sessions.userId, to: r.users.id }),
  },
  certificates: {
    template: r.one.templates({ from: r.certificates.templateId, to: r.templates.id }),
    student: r.one.students({ from: r.certificates.studentId, to: r.students.id }),
    templateRecipientGroup: r.one.templateRecipientGroups({
      from: r.certificates.templateRecipientGroupId,
      to: r.templateRecipientGroups.id,
    }),
  },
  students: {
    recipientGroupItems: r.many.templateRecipientGroupItems({
      from: r.students.id,
      to: r.templateRecipientGroupItems.studentId,
    }),
    certificates: r.many.certificates({
      from: r.students.id,
      to: r.certificates.studentId,
    }),
  },
  templates: {
    category: r.one.templateCategories({ from: r.templates.categoryId, to: r.templateCategories.id }),
    preSuspensionCategory: r.one.templateCategories({
      from: r.templates.preSuspensionCategoryId,
      to: r.templateCategories.id,
    }),
    certificates: r.many.certificates({ from: r.templates.id, to: r.certificates.templateId }),
    recipientGroups: r.many.templateRecipientGroups({ from: r.templates.id, to: r.templateRecipientGroups.templateId }),
    templateVariables: r.many.templateVariableBases({ from: r.templates.id, to: r.templateVariableBases.templateId }),
    elements: r.many.templateElements({ from: r.templates.id, to: r.templateElements.templateId }),
  },
  templateCategories: {
    parentCategory: r.one.templateCategories({
      from: r.templateCategories.parentCategoryId,
      to: r.templateCategories.id,
    }),
    subCategories: r.many.templateCategories({
      from: r.templateCategories.id,
      to: r.templateCategories.parentCategoryId,
    }),
    templates: r.many.templates({ from: r.templateCategories.id, to: r.templates.categoryId }),
    preSuspensionTemplates: r.many.templates({
      from: r.templateCategories.id,
      to: r.templates.preSuspensionCategoryId,
    }),
  },
  templateVariableBases: {
    template: r.one.templates({
      from: r.templateVariableBases.templateId,
      to: r.templates.id,
    }),
  },
  // NOTE: templateRecipientGroups relations are COMMENTED OUT
  // templateRecipientGroups: { ... }
}));
```

### Relations Map

```
users ──→ sessions (1:N)
users ──→ roles (M:N through userRoles)
users ──→ userRoles (1:N)
roles ──→ users (M:N through userRoles)
roles ──→ userRoles (1:N)
sessions ──→ user (N:1)
certificates ──→ template (N:1)
certificates ──→ student (N:1)
certificates ──→ templateRecipientGroup (N:1)
students ──→ recipientGroupItems (1:N)
students ──→ certificates (1:N)
templates ──→ category (N:1)
templates ──→ preSuspensionCategory (N:1, self-ref through categories)
templates ──→ certificates (1:N)
templates ──→ recipientGroups (1:N)
templates ──→ templateVariables (1:N)
templates ──→ elements (1:N)
templateCategories ──→ parentCategory (self-ref, N:1)
templateCategories ──→ subCategories (self-ref, 1:N)
templateCategories ──→ templates (1:N)
templateCategories ──→ preSuspensionTemplates (1:N)
templateVariableBases ──→ template (N:1)
```

> **Missing relations**: `templateRecipientGroups` relations are commented out. `templateElements` sub-tables, `templateVariables` sub-tables, `recipientGroupItemVariableValues`, `storageFiles`, `fileUsages`, `storageDirectories`, `signedUrls`, and `cache` have NO relations defined.

---

## Type System

All types are in `server/types/` following a consistent pattern:

### Type Naming Convention

| Pattern | Usage |
|---------|-------|
| `{Entity}Entity` | `typeof table.$inferSelect` — database row type |
| `{Entity}EntityInput` | `typeof table.$inferInsert` — insert input type |
| `{Entity}Dto` | Data transfer object (may differ from entity) |
| `{Entity}CreateInput` | Service-layer create input |
| `{Entity}UpdateInput` | Service-layer update input |
| `{Entity}PothosDefintion` | Entity + relations for GraphQL |
| `{Entity}WithFiltersResponse` | Paginated response with data + pageInfo |
| `{Entity}FilterArgs` | Filter arguments for queries |
| `{Entity}OrderByClause` | Ordering clause type |
| `{Entity}OrderByColumn` | Enum of sortable columns |

### Type Files

#### `student.types.ts`
- `StudentEntity` — db row type
- `StudentEntityInput` — insert type
- `StudentDto` — DTO with typed fields (Email, PhoneNumber branded types)
- `StudentCreateInput` — create input with branded types (Email, PhoneNumber)
- `PartialStudentUpdateInput` — partial update (all fields optional except id)
- `StudentsWithFiltersResponse` — { data: StudentDto[], pageInfo }
- `StudentFilterArgs` — ~30+ filter fields per column (name, email, phone, gender, nationality, dates)
- `StudentsOrderByClause` — { column: StudentsOrderByColumn, order?: OrderSortDirection }
- `StudentsOrderByColumn` enum — ID, NAME, EMAIL, DATE_OF_BIRTH, GENDER, CREATED_AT, UPDATED_AT

> Uses branded types: `Email`, `PhoneNumber` from `@/server/lib`

#### `template.types.ts`
- `TemplateEntity` / `TemplateEntityInput`
- `TemplatePothosDefintion` — extends Entity with `category?`, `preSuspensionCategory?`, `imageUrl?`
- `TemplateCreateInput` — { name, description?, categoryId }
- `TemplateUpdateInput` — { id, name, categoryId, description?, imagePath? }
- `TemplatesConfigsKey` / `TemplatesConfigSelectType` / `TemplatesCongigInsertInput`
- `TemplatesWithFiltersResponse` — { data: TemplatePothosDefintion[], pageInfo }
- `TemplateFilterArgs` — { name? }
- `TemplatesOrderByClause` / `TemplatesOrderByColumn`

#### `templateCategory.types.ts`
- `TemplateCategorySelectType` / `TemplateCategoryInsertInput`
- `TemplateCategoryPothosDefintion` — extends with `templates?`, `parentCategory?`, `subCategories?`
- `TemplateCategoryCreateInput` — { name, description?, parentCategoryId? }
- `TemplateCategoryUpdateInput` — { id, name, description?, parentCategoryId? }
- `TemplateCategoryWithParentTree` — extends with `parentTree: number[]`
- `TemplateSpecialCategoryType` — "Main" | "Suspension"

#### `templateVariable.types.ts`
- `TemplateVariableType` enum — TEXT, NUMBER, DATE, SELECT
- `TemplateVariablePothosDefinition` — base + type + template?
- Type-specific Pothos definitions: `TemplateTextVariablePothosDefinition`, `TemplateNumberVariablePothosDefinition`, `TemplateDateVariablePothosDefinition`, `TemplateSelectVariablePothosDefinition`
- `TemplateVariablePothosUnion` — union of all variable types
- Create/Update inputs for each variable type (Text, Number, Date, Select)

#### `recipient.types.ts`
- `RecipientEntity` / `RecipientEntityInput`
- `RecipientCreateInput` — { recipientGroupId, studentId }
- `RecipientCreateListInput` — { recipientGroupId, studentIds: number[] }

#### `recipientGroup.types.ts`
- `RecipientGroupEntity` / `RecipientGroupEntityInput`
- `RecipientGroupCreateInput` — { templateId, name, description?, date? }
- `RecipientGroupUpdateInput` — { id, name, description?, date? }

#### `storage.types.ts`
- Extensive type system: `FileEntity`, `DirectoryEntity`, `FileUsageEntity`, `DirectoryPermissions`, `FileUsageInfo`, `StorageObject`, `BucketDirectory`, `BucketFile`, `FileInfo`, `DirectoryInfo`, `StorageObjectList`
- Enums: `FileTypes` (IMAGE, VIDEO, AUDIO, DOCUMENT, ARCHIVE, OTHER), `FileSortField` (NAME, SIZE, TYPE, CREATED, MODIFIED), `FileContentType` (14 content types), `UploadLocationPath`
- Input types: `FolderCreateInput`, `DirectoryPermissionsUpdateInput`, `StorageItemProtectionUpdateInput`, `StorageItemsMoveInput`, `StorageItemsCopyInput`, `StorageItemsDeleteInput`, `FileUsageCheckInput`, `FileUsageRegisterInput`, `FileRenameInput`, `FilesListSearchInput`, `UploadSignedUrlGenerateInput`
- Result types: `FileOperationResult`, `FileUsageResult`, `BulkOperationResult`, `FileUploadResult`, `StorageStats`
- `BlobMetadata` — for GCP bucket metadata

#### `pagination.types.ts`
- `PageInfo` — { count, currentPage, firstItem?, hasMorePages, lastItem?, lastPage, perPage, total }
- `PaginationArgs` class — configurable pagination with defaults (10 per page, max 5000)

---

## Repository Pattern

All repositories follow a consistent namespace pattern:

```typescript
export namespace {EntityName}Repository {
  export const findById = async (id: number): Promise<...> => { ... };
  export const create = async (input: ...): Promise<...> => { ... };
  export const update = async (input: ...): Promise<...> => { ... };
  export const deleteById = async (id: number): Promise<...> => { ... };
  // ... additional methods
}
```

### Repository Files (`server/db/repo/`)

| File | Namespace | Key Methods |
|------|-----------|-------------|
| `student.repository.ts` | `StudentRepository` | findById, create, createList, loadByIds, existsById, allExistsByIds, countAllStudents, deleteById, partiallyUpdate, fetchWithFilters, searchStudentsRecipientInGroup, searchStudentsNotInRecipientGroup |
| `template.repository.ts` | `TemplateRepository` | findById, findByIdOrThrow, totalCount, findAll, loadByIds, findByCategoryId, suspendedTemplates, loadForTemplateCategories, findAllPaginated, findMaxOrderInCategory, create, internalCreateWithImageFileId, update, deleteById, suspendById, unsuspendById, allConfigs, existsById, fetchByCategoryIdWithFilters |
| `templateCategory.repository.ts` | `TemplateCategoryRepository` | (see file) |
| `templateVariable.repository.ts` | `TemplateVariableRepository` | (29KB file, extensive CRUD for variable types) |
| `recipient.repository.ts` | `RecipientRepository` | existsById, existsByGroupIdAndStudentId, findById, create, createList, deleteById, deleteSetByIds, findAllByGroupId, searchRecipientsInGroup, findByStudentId, loadForGroups, countInGroup |
| `recipientGroup.repository.ts` | `RecipientGroupRepository` | findById, existsById, create, createList, update, findAllByTemplateId, findByIds, deleteById, loadForTemplates, loadByIds |
| `storage.repository.ts` | `StorageDbRepository` | fileById, fileByPath, filesByIds, filesByPaths, createFile, updateFile, deleteFile, directoryByPath, directoriesByParentPath, directoriesByPaths, createDirectory, updateDirectory, deleteDirectory, getFileUsages, isFileInUse, registerFileUsage, unregisterFileUsage, checkFileUsage, updateDirectoryPermissions, setProtection |
| `signedUrl.repository.ts` | `SignedUrlRepository` | createSignedUrl, getSignedUrlById, claimSignedUrl (SELECT FOR UPDATE SKIP LOCKED), deleteExpired |
| `user.repository.ts` | `UserRepository` | (auth) |
| `session.repository.ts` | `SessionRepository` | (auth, DB-backed sessions) |
| `cache.repository.ts` | `CacheDbRepository` | get, set, incr, del, ttl, deleteExpired, ping |

### Key Repository Patterns

1. **No transactions** (except `SignedUrlRepository.claimSignedUrl` which uses `db.transaction`)
2. **Validation before operation** — each method validates inputs, checks existence, and throws Error with descriptive messages
3. **`existsById` helpers** — used by other repositories for cross-entity validation
4. **`loadByIds` / `loadForX`** — batch loading methods for DataLoader patterns
5. **`fetchWithFilters`** — complex query building with filter utils, order utils, and pagination
6. **No `tx` parameter** — all queries use the global `db` instance directly (NO transaction propagation)
7. **Error handling** — try/catch blocks that log and rethrow with generic messages

### Repository Index (`server/db/repo/index.ts`)

```typescript
export { TemplateRepository } from "./template.repository";
export { TemplateCategoryRepository } from "./templateCategory.repository";
export { TemplateVariableRepository } from "./templateVariable.repository";
export { RecipientGroupRepository } from "./recipientGroup.repository";
export { RecipientRepository } from "./recipient.repository";
export { StudentRepository } from "./student.repository";
export { UserRepository } from "./user.repository";
export { SessionRepository } from "./session.repository";
export { StorageDbRepository } from "./storage.repository";
export { SignedUrlRepository } from "./signedUrl.repository";
export { CacheDbRepository } from "./cache.repository";
```

> **No CertificateRepository** — there is no repository for the `certificates` table. This is one of the most critical missing pieces.

---

## Query Utilities

### `queryWithPagination` (`server/db/query.extentions.ts`)

```typescript
export function queryWithPagination<T extends PgSelect>(
  qb: T, args?: PaginationArgs | null
) {
  if (!args) return qb;
  return qb.limit(args.perPage).offset(args.offset);
}
```

### `fullTextSearch` (`server/db/query.extentions.ts`)

Creates PostgreSQL full-text search conditions using `to_tsvector` and `to_tsquery`:
- Sanitizes input (removes special FTS characters)
- Supports partial word matching with prefix operator (`:*`)
- Combines words with AND logic (` & `)
- Configurable text search config (`'simple'`, `'english'`, `'arabic'`)

### Filter Utils

`StudentFilterUtils` and `TemplateFilterUtils` provide `applyFilters` and `applyOrdering` methods that modify a query builder. They use the `StudentFilterArgs` / `TemplateFilterArgs` types with extensive filter operators (equals, notEquals, startsWith, endsWith, contains, isEmpty, isNotEmpty, from/to, before/after, onOrBefore, onOrAfter, etc.).

---

## Migrations

### Migration Files (`server/drizzle/`)

Two migration files:

1. **`0000_brave_miek.sql`** — Initial custom SQL migration
   - Creates `pg_trgm` extension
   - Creates all 7 PG enum types
   - Creates all 19 tables
   - Creates all indices (GIN, GiST, btree, unique)
   - Creates FK constraints for `user_roles` only
   - Adds FK constraints: `user_roles.user_id → users(id)`, `user_roles.role_id → roles(id)`

2. **`0001_goofy_shooting_star.sql`** — Second migration (12.7KB, not read in detail)

### Migration Meta

Located at `server/drizzle/meta/` — Drizzle Kit metadata for tracking migration state.

### Key Migration Notes

- `pg_trgm` extension required for GiST indices on name columns
- No `pg_extension` setup for GIN (built into PostgreSQL)
- All timestamps use precision 3 (millisecond)
- `cache` table uses `timestamp with time zone` (other tables don't specify timezone)

---

## Siraj Integration Notes

### Key Differences: CGVS vs Siraj Database

| Aspect | CGVS | Siraj |
|--------|------|-------|
| **ORM version** | Drizzle ORM (beta, pre-1.0) | Drizzle ORM 1.0.0-rc4 |
| **DB driver** | `drizzle-orm/node-postgres` (Pool) | Check Siraj's config |
| **Relations API** | New `defineRelations()` | Check Siraj's approach |
| **Primary keys** | `serial` / `bigserial` (auto-increment integers) | Check Siraj's strategy |
| **Foreign keys** | Only on `user_roles` | Siraj may have more FKs |
| **Migrations** | `drizzle-kit` in `./server/drizzle/` | `backend/db/migrations/` (check) |
| **Schema location** | `server/db/schema/` | `backend/db/schema/` |
| **Types location** | `server/types/` | `backend/types/` |
| **Repo location** | `server/db/repo/` | `backend/db/repo/` |
| **Naming** | Mix of snake_case tables and camelCase | Check Siraj conventions |
| **Timestamps** | precision 3 (millisecond) | Check Siraj convention |
| **Table naming** | Singular (`student`, `template`, `certificate`) | Check Siraj convention |
| **Inconsistent names** | `TemplateCategory` (PascalCase), `passwordResetTokens` (camelCase in DB) | Siraj likely more consistent |
| **Column naming** | Mostly snake_case, some camelCase (`userId`, `templateVariableId`) | Siraj likely more consistent |
| **Transactions** | Only in `claimSignedUrl`, no `tx` propagation | Siraj requires `tx` propagation in tests |
| **Soft delete** | `deletedAt` on certificates only | Siraj may have different approach |
| **Encryption** | None | AES-256-GCM column-level |
| **Full-text search** | GIN + GiST with `pg_trgm` | Check Siraj's search approach |
| **DB-backed sessions** | Yes (`sessions` table) | Siraj uses stateless JWT |
| **Cache table** | UNLOGGED cache table for rate limiting | Siraj may use different caching |

### What to Adopt

1. **Schema structure** — template → elements → variables → recipient groups → recipients → certificates hierarchy is well-designed
2. **Polymorphic sub-tables** — table-per-type for elements (5 types) and variables (4 types) using `elementId`/`id` as PK
3. **Storage system** — file registry + usage tracking + signed URLs is a solid pattern
4. **Full-text search** — GIN + GiST dual indexing on name columns for both FTS and LIKE
5. **Signed URL atomic claim** — `SELECT FOR UPDATE SKIP LOCKED` pattern is excellent
6. **Directory permissions** — granular boolean flags for directory operations

### What to Improve for Siraj

1. **Add foreign key constraints** — CGVS has almost none (only `user_roles`). Siraj should define proper FKs.
2. **Add certificate status lifecycle** — CGVS has no status (draft/issued/revoked/expired). Siraj needs this.
3. **Add verification logic** — `verificationCode` column exists but no generation/query code. Siraj must implement.
4. **Add `tx` parameter to repositories** — CGVS doesn't propagate transactions. Siraj requires this for testing with `runInRollback`.
5. **Consistent naming** — CGVS has mixed snake_case/camelCase/PascalCase. Siraj should standardize.
6. **Add CertificateRepository** — completely missing in CGVS. Must be created from scratch.
7. **Add certificate file storage** — CGVS schema has no column for generated PDF file path. Siraj needs this.
8. **Consider UUID IDs** — CGVS uses serial/bigserial integers. Siraj may prefer UUIDs for security (non-guessable certificate IDs).
9. **Add column-level encryption** — CGVS has none. Siraj has AES-256-GCM. Consider encrypting student PII (email, phone, DOB).
10. **Define all relations** — CGVS has `templateRecipientGroups` relations commented out. Siraj should define ALL relations.

### Schema Statistics

| Metric | Count |
|--------|-------|
| Total tables | 19 |
| PG enums | 7 |
| FK constraints | 2 (only user_roles) |
| Unique indices | 7 |
| GIN indices | 3 (students, templates, templateCategories name) |
| GiST indices | 3 (students, templates, templateCategories name with trgm) |
| Btree indices | ~10 |
| Repositories | 11 |
| Type files | 13 |
| Migration files | 2 |
