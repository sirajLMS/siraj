# CGVS Certificate Generation Logic — Comprehensive Analysis

## Executive Summary

The CGVS (Certificate Generation and Verification System) project at `/home/ahmed/Projects/cgvs/` is a **partially implemented** certificate management platform. The schema and data model are thoroughly designed for certificate generation, but the actual **generation/rendering pipeline has NOT been implemented yet**. The database schema defines certificates, template elements, template variables, and recipient groups — but no GraphQL mutations/queries exist for certificate creation, and no rendering code (despite `puppeteer` and `html-to-image` being listed as dependencies) has been written.

This analysis documents the complete data model, the intended generation pipeline as inferred from the schema, and the gaps that exist in the implementation.

---

## 1. Generation Pipeline (Intended Data Flow)

Based on the schema design, the **intended** certificate generation pipeline is:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        TEMPLATE DESIGN PHASE                           │
│                                                                        │
│  TemplateCategory ──► Template ──► TemplateElements (positioned)      │
│                         │              │                               │
│                         └──► TemplateVariables (typed: TEXT/NUMBER/    │
│                              DATE/SELECT)                              │
│                                                                        │
│  Template backgroundImage (imageFileId → storage_file)                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      RECIPIENT ASSIGNMENT PHASE                        │
│                                                                        │
│  Template ──► TemplateRecipientGroup                                   │
│                  ├──► TemplateRecipientGroupItem (studentId)           │
│                  │       └──► RecipientGroupItemVariableValue          │
│                  │             (templateVariableId + value)           │
│                  └──► TemplateRecipientGroupItem (more students...)    │
│                                                                        │
│  Student: { name, email, phoneNumber, dateOfBirth, gender,            │
│             nationality }                                              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      CERTIFICATE GENERATION PHASE                      │
│                        (⚠ NOT IMPLEMENTED)                             │
│                                                                        │
│  For each (template, student) pair:                                    │
│    1. Resolve element sourceField → actual data                        │
│       - sourceType: "student"    → student.name, student.email, etc.   │
│       - sourceType: "variable"    → recipientGroupItemVariableValue     │
│       - sourceType: "certificate" → verificationCode, releaseDate      │
│    2. Apply variable values from recipient group item                  │
│    3. Render template (HTML→PDF via Puppeteer?)                        │
│    4. Generate unique verificationCode                                 │
│    5. Create Certificate record                                        │
│                                                                        │
│  Certificate: { id, templateId, studentId,                              │
│                 templateRecipientGroupId, releaseDate,                  │
│                 verificationCode (unique), createdAt, updatedAt }       │
│                                                                        │
│  Unique constraint: (templateId, studentId) — one cert per student     │
│                     per template                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

### Key Observation: Generation is NOT Implemented

Evidence:
- **No certificate mutations** in `server/graphql/mutation/index.ts` (only: auth, recipient, recipientGroup, storage, student, template, templateCategory, templateVariable)
- **No certificate queries** in `server/graphql/query/index.ts` (same set)
- **No certificate Pothos object** in `server/graphql/pothos/`
- **No certificate repository** in `server/db/repo/` (only: cache, recipient, recipientGroup, session, signedUrl, storage, student, template, templateCategory, templateVariable, user)
- **No certificate types** in generated GraphQL (`client/graphql/generated/gql/graphql.ts`)
- **No rendering code** — `puppeteer` only used in `tests/browser-md5.ts` for file hashing, not PDF generation
- **`html-to-image`** is in `package.json` but never imported in any source file
- **No template element CRUD** — `templateElements` table exists in schema but no GraphQL mutations/queries expose it
- **Preview tab** in UI is just `<h1>PreviewTab</h1>` — a placeholder
- **Editor tab** is listed in tab types but has no content rendered in `TemplateManagementPage.tsx`

---

## 2. Template Structure

### Template Table (`server/db/schema/templates.ts`, lines 47-73)

```typescript
export const templates = pgTable("template", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  imageFileId: bigint("image_file_id", { mode: "bigint" }),  // → storage_file.id (background image)
  categoryId: integer("category_id").notNull(),               // → template_category.id
  order: integer("order").notNull(),                          // display ordering
  preSuspensionCategoryId: integer("pre_suspension_category_id"), // tracks original category if suspended
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
}, table => [
  // GIN index for Full-Text Search on 'name'
  index("idx_templates_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
  // GiST index for faster LIKE/ILIKE on name
  index("idx_templates_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
]);
```

Key fields:
- `imageFileId` — references `storage_file.id` (bigint). The template's background/cover image. Resolved at runtime via `getStorageService().fileInfoByDbFileId(imageFileId)` to get a URL.
- `categoryId` — links to `templateCategories` (hierarchical categories)
- `order` — display ordering within a category
- `preSuspensionCategoryId` — if a template is "suspended" (moved to a suspension category), this stores the original category for potential restoration

### Template Type Definitions (`server/types/template.types.ts`)

```typescript
export type TemplatePothosDefintion = TemplateEntity & {
  category?: TemplateCategoryPothosDefintion;
  preSuspensionCategory?: TemplateCategoryPothosDefintion | null;
  imageUrl?: string | null;  // resolved at runtime from imageFileId
};

export type TemplateCreateInput = {
  name: string;
  description?: string | null;
  categoryId: number;
};

export type TemplateUpdateInput = {
  id: number;
  name: string;
  categoryId: number;
  description?: string | null;
  imagePath?: string | null;
};
```

### Template Configs (`server/db/schema/templates.ts`, lines 75-83)

```typescript
export const templatesConfigsKeyEnum = pgEnum("template_config_key", [
  "MAX_BACKGROUND_SIZE",
  "ALLOWED_FILE_TYPES",
]);

export const templatesConfigs = pgTable("templates_config", {
  key: templatesConfigsKeyEnum("key").primaryKey(),
  value: text("value").notNull(),
});
```

These are key-value configuration pairs for template constraints — e.g., max background image size in bytes, and allowed file types for upload.

### Template Pothos Object (`server/graphql/pothos/template.pothos.ts`)

The GraphQL Template object exposes:
- `id`, `name`, `description`, `order`, `createdAt`, `updatedAt`
- `imageUrl` — **resolved dynamically** from `imageFileId` via storage service
- `category` — loadable relation to TemplateCategory
- `preSuspensionCategory` — loadable relation (nullable)
- `variables` — loadable list of TemplateVariable (interface/union)
- `imageFile` — FileInfo object from storage service
- `recipientGroups` — loadable list of TemplateRecipientGroup

---

## 3. Template Categories System

### Schema (`server/db/schema/templates.ts`, lines 15-45)

```typescript
export const templatecategorySpecialTypeEnum = pgEnum("category_special_type", [
  "Main",       // Normal category
  "Suspension", // Templates moved here when "suspended"
]);

export const templateCategories = pgTable("TemplateCategory", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentCategoryId: integer("parent_category_id"),  // hierarchical parent
  order: integer("order").notNull(),
  specialType: templatecategorySpecialTypeEnum("special_type"),
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
}, table => [
  uniqueIndex("template_category_special_type_key").on(table.specialType),
  // Full-text search indexes on name
]);
```

Key design:
- **Hierarchical** — `parentCategoryId` creates a tree structure (parent → subcategories)
- **Special types** — `Main` for normal categories, `Suspension` for the category where suspended templates go. The unique index on `specialType` ensures only ONE suspension category exists.
- **Template suspension** — When a template is suspended, it's moved to the `Suspension` category and `preSuspensionCategoryId` records its original location. `unsuspendById` restores it.

### Type Definitions (`server/types/templateCategory.types.ts`)

```typescript
export type TemplateCategoryPothosDefintion = TemplateCategorySelectType & {
  templates?: TemplatePothosDefintion[];
  parentCategory?: TemplateCategoryPothosDefintion | null;
  subCategories?: TemplateCategoryPothosDefintion[];
};

export type TemplateCategoryWithParentTree = TemplateCategorySelectType & {
  parentTree: number[]; // [currentId, parentId, grandparentId, ...]
};
```

### Client UI — Category Tree

The template list page (`client/views/template/templateList/TemplateList.tsx`) uses a `SplitPane` layout:
- Left pane: `CategoryTreePane` — hierarchical category tree for navigation
- Right pane: `TemplateListContent` — templates filtered by selected category

---

## 4. Template Elements — Positioning System

### Schema (`server/db/schema/templateElements.ts`)

```typescript
export const elementTypeEnum = pgEnum("template_element_type", [
  "static_text",   // Fixed text content (e.g., "Certificate of Achievement")
  "data_text",     // Dynamic text from student/variable/certificate data
  "data_date",     // Dynamic date with format
  "image",         // Image element (logo, signature, seal)
  "qr_code",       // QR code (likely for verification code)
]);

export const templateElementSourceTypeEnum = pgEnum(
  "template_element_source_type",
  ["student", "variable", "certificate"]
);
```

### Base Element Table

```typescript
export const templateElements = pgTable("template_element", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  type: elementTypeEnum("type").notNull(),
  xCoordinate: real("x_coordinate").notNull(),  // absolute X position
  yCoordinate: real("y_coordinate").notNull(),   // absolute Y position
  fontSize: integer("font_size"),
  color: varchar("color", { length: 20 }),       // e.g., "#FF0000"
  alignment: varchar("alignment", { length: 20 }), // e.g., "center", "left", "right"
  fontFamily: varchar("font_family", { length: 100 }),
  languageConstraint: varchar("language_constraint", { length: 10 }), // e.g., "ar", "en"
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
});
```

**Positioning Model**: Absolute positioning using `xCoordinate` and `yCoordinate` (both `real`/float type). This suggests a canvas-like coordinate system where elements are placed at specific X/Y positions — likely on top of the template's background image.

### Element Type Sub-Tables (One-to-One)

Each element type has its own sub-table with type-specific fields, linked by `elementId`:

#### Static Text Element
```typescript
export const templateStaticTextElements = pgTable("template_static_text_element", {
  elementId: integer("element_id").primaryKey(),  // 1:1 with templateElements.id
  content: text("content").notNull(),              // the static text content
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

#### Data Text Element (Dynamic)
```typescript
export const templateDataTextElements = pgTable("template_data_text_element", {
  elementId: integer("element_id").primaryKey(),
  sourceType: templateElementSourceTypeEnum("source_type").notNull(),
  sourceField: varchar("source_field", { length: 100 }).notNull(),
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

The `sourceType` + `sourceField` mechanism is the **key data binding** for certificate generation:
- `sourceType: "student"` → `sourceField` is a field on the student table (e.g., `"name"`, `"email"`, `"nationality"`)
- `sourceType: "variable"` → `sourceField` is a template variable name (e.g., `"courseName"`, `"grade"`)
- `sourceType: "certificate"` → `sourceField` is a certificate field (e.g., `"verificationCode"`, `"releaseDate"`)

#### Data Date Element (Dynamic with date formatting)
```typescript
export const templateDataDateElements = pgTable("template_data_date_element", {
  elementId: integer("element_id").primaryKey(),
  sourceType: templateElementSourceTypeEnum("source_type").notNull(),
  sourceField: varchar("source_field", { length: 100 }).notNull(),
  dateFormat: varchar("date_format", { length: 50 }),  // e.g., "YYYY-MM-DD", "DD.MM.YYYY"
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

#### Image Element
```typescript
export const templateImageElements = pgTable("template_image_element", {
  elementId: integer("element_id").primaryKey(),
  imageUrl: varchar("image_url", { length: 500 }).notNull(),  // direct URL (not fileId)
  width: integer("width"),
  height: integer("height"),
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

Note: Image elements store a direct `imageUrl` varchar, unlike the template's `imageFileId` which references the storage system. This may indicate image elements can reference external URLs or stored paths.

#### QR Code Element
```typescript
export const templateQrCodeElements = pgTable("template_qr_code_element", {
  elementId: integer("element_id").primaryKey(),
  size: integer("size"),  // QR code pixel size
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

QR codes likely encode the `verificationCode` for certificate verification.

### Element Model Summary

```
TemplateElement (base)
├── type: static_text  → StaticTextElement { content }
├── type: data_text    → DataTextElement { sourceType, sourceField }
├── type: data_date    → DataDateElement { sourceType, sourceField, dateFormat }
├── type: image         → ImageElement { imageUrl, width, height }
└── type: qr_code       → QrCodeElement { size }
```

Each element has shared styling: `xCoordinate`, `yCoordinate`, `fontSize`, `color`, `alignment`, `fontFamily`, `languageConstraint`.

**⚠ Critical Gap**: Despite the schema being fully defined, there are **no GraphQL mutations or queries** for template elements. The `templateElements` table exists but is completely unexposed via the API. This means element management UI has not been built.

---

## 5. Variable System

### Template Variable Base Schema (`server/db/schema/templateVariables.ts`)

```typescript
export const templateVariableBases = pgTable("template_variable_base", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),  // unique per template
  description: text("description"),
  type: templateVariableTypeEnum("type").notNull(),   // TEXT | NUMBER | DATE | SELECT
  required: boolean("required").notNull().default(false),
  order: integer("order").notNull(),
  previewValue: varchar("preview_value", { length: 255 }),  // for preview rendering
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
}, table => [
  uniqueIndex("template_base_variable_template_id_name_key")
    .on(table.templateId, table.name),  // variable name unique per template
]);
```

### Variable Type Enum (`server/types/templateVariable.types.ts`)

```typescript
export enum TemplateVariableType {
  TEXT = "TEXT",
  NUMBER = "NUMBER",
  DATE = "DATE",
  SELECT = "SELECT",
}
```

### Type-Specific Sub-Tables (One-to-One, linked by `id`)

#### Text Variable
```typescript
export const templateTextVariables = pgTable("template_text_variable", {
  id: integer("id").primaryKey(),  // = templateVariableBases.id
  minLength: integer("min_length"),
  maxLength: integer("max_length"),
  pattern: varchar("pattern", { length: 255 }),  // regex pattern for validation
});
```

#### Number Variable
```typescript
export const templateNumberVariables = pgTable("template_number_variable", {
  id: integer("id").primaryKey(),
  minValue: decimal("min_value", { mode: "number" }),
  maxValue: decimal("max_value", { mode: "number" }),
  decimalPlaces: integer("decimal_places"),
});
```

#### Date Variable
```typescript
export const templateDateVariables = pgTable("template_date_variable", {
  id: integer("id").primaryKey(),
  minDate: timestamp("min_date", { precision: 3 }),
  maxDate: timestamp("max_date", { precision: 3 }),
  format: varchar("format", { length: 50 }),
});
```

#### Select Variable
```typescript
export const templateSelectVariables = pgTable("template_select_variable", {
  id: integer("id").primaryKey(),
  options: json("options"),         // JSON array of string options
  multiple: boolean("multiple"),    // allow multiple selection
});
```

### Variable Pothos Union (`server/graphql/pothos/templateVariable.pothos.ts`)

Variables are exposed as a **Pothos interface/union** — each variable type has its own GraphQL object type, and the union resolves to the correct type based on the `type` field:

```typescript
export type TemplateVariablePothosUnion =
  | TemplateTextVariablePothosDefinition
  | TemplateNumberVariablePothosDefinition
  | TemplateDateVariablePothosDefinition
  | TemplateSelectVariablePothosDefinition;
```

### Variable Resolution at Generation Time

The resolution chain works as follows:

```
1. Template defines variables (e.g., "courseName" TEXT, "grade" NUMBER)
2. Recipient Group has items (students)
3. Each item has RecipientGroupItemVariableValue entries:
   { templateRecipientGroupItemId, templateVariableId, value, valueIndexed }
4. At generation time:
   - Element with sourceType="variable", sourceField="courseName"
   → Look up recipientGroupItemVariableValue where templateVariableId
     matches the variable named "courseName"
   → Use the `value` field as the rendered text
5. Element with sourceType="student", sourceField="name"
   → Look up student.name from the student record
6. Element with sourceType="certificate", sourceField="verificationCode"
   → Use the certificate's verificationCode
```

### Variable Forms (Client UI)

Each variable type has a dedicated form (`client/views/template/manage/variables/forms/`):
- `TemplateTextVariableForm.tsx` — fields: name, description, minLength, maxLength, pattern, previewValue, required
- `TemplateNumberVariableForm.tsx` — fields: name, description, minValue, maxValue, decimalPlaces, previewValue, required
- `TemplateDateVariableForm.tsx` — fields: name, description, format, minDate, maxDate, previewValue (DatePicker), required
- `TemplateSelectVariableForm.tsx` — fields: name, description, options (string[]), multiple, previewValue, required

All forms include `previewValue` — a sample value used for preview rendering (when preview is implemented).

---

## 6. Recipient Assignment System

### Recipient Groups (`server/db/schema/templateRecipientGroups.ts`)

```typescript
export const templateRecipientGroups = pgTable("template_recipient_group", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  date: timestamp("date", { precision: 3 }),  // group date (e.g., course date)
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
});
```

Recipient groups are **template-scoped** — each group belongs to exactly one template. They represent a batch of students who will receive certificates for the same template (e.g., "Class of 2024 - Course A").

### Recipient Group Items (Students in a Group)

```typescript
export const templateRecipientGroupItems = pgTable("template_recipient_group_item", {
  id: serial("id").primaryKey(),
  recipientGroupId: integer("template_recipient_group_id").notNull(),
  studentId: integer("student_id").notNull(),
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
}, table => [
  uniqueIndex("trgi_student_group_unique")
    .on(table.studentId, table.recipientGroupId),  // student unique per group
]);
```

### Student Schema (`server/db/schema/students.ts`)

```typescript
export const students = pgTable("student", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phoneNumber: varchar("phone_number", { length: 255 }),
  dateOfBirth: timestamp("date_of_birth", { precision: 3 }),
  gender: genderEnum("gender"),               // MALE | FEMALE | OTHER
  nationality: countryCodeEnum("nationality"), // SA, PS, YE, etc.
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
}, table => [
  // GIN index for Full-Text Search on 'name'
  index("idx_students_name_fts").using("gin", sql`to_tsvector('simple', ${table.name})`),
  // GiST index for faster LIKE/ILIKE on name
  index("idx_students_name_trgm").using("gist", table.name.op("gist_trgm_ops")),
]);
```

### Per-Recipient Variable Values

```typescript
export const recipientGroupItemVariableValues = pgTable("recipient_group_item_variable_value", {
  id: serial("id").primaryKey(),
  templateRecipientGroupItemId: integer("template_recipient_group_item_id").notNull(),
  templateVariableId: integer("templateVariableId").notNull(),
  value: text("value"),                     // the actual value (text)
  valueIndexed: varchar("value_indexed", { length: 255 }),  // indexed version for search
  createdAt: timestamp(...).notNull(),
  updatedAt: timestamp(...).notNull(),
}, table => [
  uniqueIndex("rgiv_group_item_variable_unique")
    .on(table.templateRecipientGroupItemId, table.templateVariableId),
  index("rgiv_value_idx").on(table.valueIndexed),
]);
```

This table stores the **actual values** for each variable, per recipient. For example:
- Recipient Group Item (student #5 in group #3)
  - Variable "courseName" → value: "Advanced Mathematics"
  - Variable "grade" → value: "95.5"
  - Variable "completionDate" → value: "2024-06-15"

### Recipient Group GraphQL

The TemplateRecipientGroup Pothos object exposes:
- `id`, `name`, `description`, `date`
- `template` — loadable relation to Template
- `recipients` — loadable list of TemplateRecipient (group items)
- `studentCount` — computed field counting students in group

### Client UI for Recipients

The template management page has two recipient-related tabs:
1. **recipients** (`RecipientGroupTab`) — manage recipient groups (create, name, description, date)
2. **recipientsManagement** (`RecipientsManagementTab`) — manage students within groups, assign variable values

Batch operations are supported — the recipient documents include batch create/delete mutations.

---

## 7. Certificate Status Lifecycle

### Schema (`server/db/schema/certificates.ts`)

```typescript
export const certificates = pgTable("certificate", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").notNull(),
  studentId: integer("student_id").notNull(),
  templateRecipientGroupId: integer("template_recipient_group_id").notNull(),
  releaseDate: timestamp("release_date", { precision: 3 }).notNull(),
  verificationCode: varchar("verification_code", { length: 255 }).notNull().unique(),
  deletedAt: timestamp("deleted_at", { precision: 3 }),  // soft delete
  createdAt: timestamp("created_at", { precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { precision: 3 }).notNull(),
}, table => [
  uniqueIndex("unique_student_template_certificate")
    .on(table.templateId, table.studentId),  // one cert per student per template
]);
```

### Lifecycle Analysis

**CGVS has NO certificate status enum.** Unlike a typical certificate system with states like `PENDING`, `GENERATED`, `ISSUED`, `REVOKED`, `EXPIRED`:

- A certificate record simply **exists** or is **soft-deleted** (via `deletedAt`)
- There is no status field — no `PENDING`, no `DRAFT`, no `VERIFIED`
- The `releaseDate` is a required timestamp (likely the date the certificate was issued)
- The `verificationCode` is unique and generated at creation time (but no generation logic exists in the code)

### What the lifecycle WOULD be (inferred from schema):

```
[No certificate] ──generate──► [Certificate exists]
                                    │
                                    ├── releaseDate set ( issuance date )
                                    ├── verificationCode (unique, for verification)
                                    └── deletedAt (null, active)
                                          │
                                    softDelete
                                          │
                                          ▼
                                    [Certificate deleted]
                                    (deletedAt set, record retained)
```

### Drizzle Relations (`server/db/drizzleRelations.ts`, lines 40-53)

```typescript
certificates: {
  template: r.one.templates({
    from: r.certificates.templateId,
    to: r.templates.id,
  }),
  student: r.one.students({
    from: r.certificates.studentId,
    to: r.students.id,
  }),
  templateRecipientGroup: r.one.templateRecipientGroups({
    from: r.certificates.templateRecipientGroupId,
    to: r.templateRecipientGroups.id,
  }),
},
```

The certificate is linked to:
- The template used to generate it
- The student who receives it
- The recipient group through which the student was assigned

---

## 8. Rendering Approach

### Dependencies in `package.json`

```json
{
  "puppeteer": "24.26.0",
  "html-to-image": "1.11.13",
  "@google-cloud/storage": "^7.15.0",
  "@xyflow/react": "^12.4.2",
  "react-zoom-pan-pinch": "^3.7.0"
}
```

### Intended Rendering Pipeline (Inferred)

Based on the dependencies and schema design:

1. **Template Design**: Background image + positioned elements (absolute X/Y coordinates)
2. **HTML Construction**: Build an HTML representation of the template:
   - Background image as a positioned `<div>` or `<img>`
   - Each element positioned with CSS `position: absolute; left: {xCoordinate}px; top: {yCoordinate}px;`
   - Text elements rendered with specific `fontSize`, `color`, `fontFamily`, `alignment`
   - Image elements rendered as `<img>` with `width`/`height`
   - QR code elements rendered as QR code images
3. **PDF Generation**: Use **Puppeteer** to render the HTML to PDF:
   ```typescript
   // Likely intended approach (not implemented):
   const browser = await puppeteer.launch({ headless: true });
   const page = await browser.newPage();
   await page.setContent(htmlString);
   await page.pdf({ format: 'A4', printBackground: true });
   ```
4. **Image Generation**: Use **html-to-image** for preview/thumbnail generation (client-side):
   ```typescript
   // For client-side preview (not implemented):
   import { toPng, toJpeg } from 'html-to-image';
   ```

### What Actually Exists

- `puppeteer` is only used in `tests/browser-md5.ts` — for generating MD5 hashes in a browser context (for GCS signed URL compatibility), NOT for PDF rendering
- `html-to-image` is imported **nowhere** in source code
- `@xyflow/react` (a flow/graph editor library) and `react-zoom-pan-pinch` (zoom/pan library) are only used in `client/views/storage/browser/FilePreview.tsx` — for file preview, not template editing
- The **editor tab** (`value="editor"`) is listed in the tab bar but no component renders for it in `TemplateManagementPage.tsx`
- The **preview tab** renders `<h1>PreviewTab</h1>` — a bare placeholder

### Conclusion

The rendering pipeline was **planned but not implemented**. The dependencies were added to `package.json` in anticipation of building the generation feature, but no actual rendering code exists.

---

## 9. Image/Asset Handling

### Storage Architecture

CGVS uses **Google Cloud Storage** (`@google-cloud/storage`) for file storage.

### Storage Schema (`server/db/schema/storage.ts`)

```typescript
export const storageFiles = pgTable("storage_file", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  path: text("path").notNull().unique(),      // GCS path
  isProtected: boolean("is_protected").notNull().default(false),
});

export const fileUsages = pgTable("file_usage", {
  id: bigserial("id", { mode: "bigint" }).primaryKey(),
  filePath: varchar("file_path", { length: 1024 }).notNull(),
  usageType: varchar("usage_type", { length: 100 }).notNull(),
  referenceId: bigint("reference_id", { mode: "bigint" }).notNull(),
  referenceTable: varchar("reference_table", { length: 100 }).notNull(),
  createdAt: timestamp(...).notNull(),
});

export const signedUrls = pgTable("signed_url", {
  id: varchar("id", { length: 64 }).primaryKey(),  // UUID token
  filePath: varchar("file_path", { length: 1024 }).notNull(),
  contentType: varchar("content_type", { length: 255 }).notNull(),
  fileSize: bigint("file_size", { mode: "bigint" }).notNull(),
  contentMd5: varchar("content_md5", { length: 44 }).notNull(),  // base64 MD5
  expiresAt: timestamp("expires_at", { precision: 3 }).notNull(),
  createdAt: timestamp(...).notNull(),
  used: boolean("used").notNull().default(false),
});
```

### Upload Locations (`client/views/storage/core/storage.location.ts`)

```typescript
export const UPLOAD_LOCATIONS: Record<Graphql.UploadLocationPath, LocationInfo> = {
  TEMPLATE_COVERS: {
    key: "TEMPLATE_COVERS",
    label: "Template Covers",
    description: "Cover images for certificate templates",
    path: "public/templateCover",
    allowedContentTypes: ["JPEG", "PNG", "WEBP"],
    icon: "Image",
  },
};
```

Only one upload location is defined: `TEMPLATE_COVERS` — for template background/cover images. Allowed types: JPEG, PNG, WEBP.

### Template Background Image

- Stored via `imageFileId` (bigint) → `storageFiles.id`
- Resolved at runtime: `getStorageService().fileInfoByDbFileId(template.imageFileId)` returns a `{ url }` object
- The `imageUrl` field on the Template Pothos object resolves this automatically
- Placeholder URL defined in `client/utils/templateImagePlaceHolder.ts`:
  ```typescript
  export const TEMPLATE_IMAGE_PLACEHOLDER_URL =
    "/storage/img/A5dJHJxOJIAKwk9vVe2NXSTgpmB03iCIK15pVDGR.jpg";
  ```

### Image Elements vs Template Background

Two distinct image concepts:
1. **Template background** (`template.imageFileId`) — the certificate background image, stored via the storage system with `imageFileId`
2. **Image elements** (`templateImageElements.imageUrl`) — individual positioned images (logos, signatures, seals) stored as direct URL strings (max 500 chars), NOT through the storage system

---

## 10. Batch Generation

### Intended Batch Generation (Inferred from Schema)

The schema supports batch generation through the recipient group mechanism:

```
For a given template + recipient group:
  ┌── Item 1 (Student A) ── VariableValues {courseName, grade, date} ──► Certificate
  ├── Item 2 (Student B) ── VariableValues {courseName, grade, date} ──► Certificate
  ├── Item 3 (Student C) ── VariableValues {courseName, grade, date} ──► Certificate
  └── Item N (Student N) ── VariableValues {courseName, grade, date} ──► Certificate
```

The certificate table stores `templateRecipientGroupId`, which links each certificate back to the batch group it was generated from.

**⚠ Not Implemented**: No mutation exists to trigger batch generation. The `certificate` table has no repository, no service, and no GraphQL endpoint. Batch generation would need to:
1. Query all `templateRecipientGroupItems` for a given group
2. For each item, resolve variable values
3. Render the certificate (HTML→PDF)
4. Create a `certificate` record with a unique `verificationCode`
5. Respect the unique constraint on `(templateId, studentId)`

---

## 11. Preview Functionality

### Current State: NOT Implemented

The template management page (`client/views/template/manage/TemplateManagementPage.tsx`, lines 133-144) has a preview tab that renders only:

```tsx
<TabPanel value="preview">
  <Box sx={{ p: 2, width: "100%", height: "100%", borderColor: "red" }}>
    <h1>PreviewTab</h1>
  </Box>
</TabPanel>
```

### Intended Preview

The variable system has `previewValue` on each variable — a sample value to use during preview rendering. The intended preview flow:

```
Template + Elements + Variables (with previewValues)
         │
         ▼
    Render HTML/Canvas preview
    (using previewValue instead of actual recipient variable values)
         │
         ▼
    Display in preview tab
    (possibly using html-to-image for snapshot)
```

The `html-to-image` library was likely intended for this client-side preview rendering.

---

## 12. Output Format

### Intended Output (Inferred)

Based on dependencies and schema:
- **PDF** — primary format via Puppeteer (`puppeteer@24.26.0`)
- **Image (PNG/JPEG)** — possibly via `html-to-image` for previews or thumbnails

The certificate table does NOT store a file path or URL for the generated certificate — it only stores metadata (`templateId`, `studentId`, `releaseDate`, `verificationCode`). This suggests:
- Certificates might be generated on-demand (rendered each time they're viewed/verified)
- OR the generated PDF URL would be stored in a future field (not yet in the schema)
- OR the certificate is stored in the storage system and linked via `fileUsages` table

---

## 13. Verification System

### Verification Code

```typescript
verificationCode: varchar("verification_code", { length: 255 }).notNull().unique(),
```

- Unique per certificate
- No generation logic exists in the codebase (no UUID/random generation found)
- The QR code element type (`templateQrCodeElements`) likely encodes this verification code
- No verification endpoint or query exists — no way to look up a certificate by verification code

### Intended Verification Flow

```
1. Certificate generated → verificationCode created
2. QR code on certificate encodes verification URL or code
3. User scans QR code → navigates to verification page
4. Verification page queries certificate by verificationCode
5. System returns certificate details (student name, template, release date)
```

**⚠ Not Implemented**: No verification query, endpoint, or page exists.

---

## 14. Template Management UI Architecture

### Tab Structure (`client/views/template/manage/useTemplateManagementStore.ts`)

```typescript
export type TemplateManagementTabType =
  | "basic"                  // ✅ Implemented — BasicInfoTab
  | "variables"             // ✅ Implemented — TemplateVariableManagement
  | "editor"                // ❌ Not rendered — intended for visual template editor
  | "recipients"            // ✅ Implemented — RecipientGroupTab
  | "recipientsManagement"  // ✅ Implemented — RecipientsManagementTab
  | "preview";              // ❌ Placeholder — <h1>PreviewTab</h1>
```

### Component Architecture

```
TemplateManagementPage
├── TemplateManagementHeader (title slot in dashboard)
├── ManagementTabList (tab bar with 6 tabs)
└── TabContent (conditionally rendered)
    ├── basic → BasicInfoTab
    │   ├── Template name, description (TextField)
    │   ├── Category selector
    │   └── FilePickerDialog (for background image upload)
    ├── variables → TemplateVariableManagement
    │   ├── Variable list (sorted by order)
    │   ├── Create/Edit modal
    │   └── Type-specific forms:
    │       ├── TemplateTextVariableForm
    │       ├── TemplateNumberVariableForm
    │       ├── TemplateDateVariableForm
    │       └── TemplateSelectVariableForm
    ├── recipients → RecipientGroupTab
    │   ├── Group list (create, edit, delete)
    │   └── Group details (name, description, date)
    ├── recipientsManagement → RecipientsManagementTab
    │   ├── Group selector
    │   ├── Student assignment (add/remove students)
    │   └── Variable value editor (per student per variable)
    ├── editor → (not rendered)
    └── preview → <h1>PreviewTab</h1>
```

### State Management

Uses Zustand (`useTemplateManagementStore`) with:
- `activeTab` — persisted to sessionStorage
- `unsavedChanges` — tracks dirty state
- `loadedTabs` — tracks which tabs have been loaded
- `tabErrors` — per-tab error state

### Template List Page

Split-pane layout:
- Left: CategoryTreePane — hierarchical category tree
- Right: TemplateListContent — templates filtered by selected category

Features:
- Pagination
- Full-text search on template name (GIN index)
- Template suspend/unsuspend
- Category-based filtering
- Responsive (mobile drawer, desktop split-pane)

---

## 15. GraphQL API Surface

### Queries (8 total)
| Query | Description |
|-------|-------------|
| `template(id)` | Get single template by ID |
| `templates(pagination)` | Paginated list of all templates |
| `templatesByCategoryId(categoryId, pagination, filter, orderBy)` | Filtered templates by category |
| `suspendedTemplates` | List of suspended templates |
| `templatesConfigs` | Config key-value pairs (MAX_BACKGROUND_SIZE, ALLOWED_FILE_TYPES) |
| `templateCategories(...)` | Category tree queries |
| `templateVariables(...)` | Variable CRUD queries |
| `recipients`, `recipientGroups` | Recipient management queries |

### Mutations (template-focused)
| Mutation | Description |
|----------|-------------|
| `createTemplate(input)` | Create new template |
| `updateTemplate(input)` | Update template (name, category, description, imagePath) |
| `deleteTemplate(id)` | Soft delete template |
| `suspendTemplate(id)` | Move template to suspension category |
| `unsuspendTemplate(id)` | Restore template to original category |
| `createTemplateVariable`, `updateTemplateVariable`, `deleteTemplateVariable` | Variable CRUD |
| `createRecipientGroup`, `updateRecipientGroup`, `deleteRecipientGroup` | Group CRUD |
| `createRecipient`, `deleteRecipient`, `batchCreateRecipients`, `batchDeleteRecipients` | Recipient CRUD |

### Missing API Surface (Critical for Certificate Generation)
| Missing Query/Mutation | Purpose |
|----------------------|---------|
| `certificates` query | List/search certificates |
| `certificate(id)` query | Get single certificate |
| `certificateByVerificationCode(code)` query | Verification lookup |
| `createCertificate(input)` mutation | Generate single certificate |
| `batchGenerateCertificates(input)` mutation | Generate for entire recipient group |
| `revokeCertificate(id)` mutation | Revoke a certificate |
| Template element CRUD mutations | Create/update/delete template elements |
| Template element queries | List elements for a template |

---

## 16. Key Libraries & Dependencies

From `package.json`:

| Library | Version | Purpose |
|---------|---------|---------|
| `puppeteer` | 24.26.0 | Headless Chrome for PDF generation (only used in tests for MD5 hashing) |
| `html-to-image` | 1.11.13 | Client-side HTML→image conversion (unused in source) |
| `@google-cloud/storage` | ^7.15.0 | GCS file storage backend |
| `@xyflow/react` | ^12.4.2 | Flow/graph editor (only used in FilePreview) |
| `react-zoom-pan-pinch` | ^3.7.0 | Zoom/pan container (only used in FilePreview) |
| `@pothos/core` | 4.10.0 | GraphQL schema builder (same as siraj) |
| `drizzle-orm` | ^0.41.0 | PostgreSQL ORM (same as siraj, different version) |
| `@mui/material` | 7.3.4 | Material UI v7 (siraj uses v9) |
| `@apollo/client` | ^3.13.0 | GraphQL client (siraj uses v4) |
| `zustand` | ^5.0.2 | State management (same as siraj) |
| `next` | 15.5.4 | Next.js 15 (siraj uses Next.js 16) |

---

## 17. Summary: What CGVS Has vs What's Missing

### ✅ Implemented
1. **Template CRUD** — create, read, update, delete, suspend/unsuspend
2. **Template Categories** — hierarchical categories with special types
3. **Template Variables** — full CRUD for 4 variable types (TEXT, NUMBER, DATE, SELECT)
4. **Recipient Groups** — create groups, assign students, edit variable values per student
5. **Student Management** — student records with name, email, phone, DOB, gender, nationality
6. **Storage System** — GCS-backed file storage with signed URLs
7. **Template Background Image** — upload and display via FilePickerDialog
8. **Template Management UI** — basic info, variables, recipients, recipient management tabs

### ❌ Not Implemented (Critical for Certificate Generation)
1. **Certificate CRUD** — no mutations, no queries, no repository, no service
2. **Certificate Generation** — no rendering pipeline (PDF or image)
3. **Template Element CRUD** — schema exists but no API exposure
4. **Template Visual Editor** — "editor" tab has no component
5. **Certificate Preview** — "preview" tab is a placeholder
6. **Verification System** — no verification query or page
7. **Batch Generation** — no mutation to generate certificates for a recipient group
8. **Verification Code Generation** — no logic to create unique codes
9. **PDF/Image Output** — no rendering code despite puppeteer dependency
10. **Certificate Status Lifecycle** — no status enum, only soft delete

---

## 18. Recommendations for Siraj Implementation

Based on the CGVS analysis, here are design recommendations for implementing certificate generation in the siraj project:

### Data Model
1. **Reuse the template element model** — absolute X/Y positioning with type-specific sub-tables is a solid design
2. **Add a certificate status enum** — `DRAFT`, `GENERATED`, `ISSUED`, `REVOKED`, `EXPIRED` (CGVS only has soft delete)
3. **Store the generated file URL** — add a `fileUrl` or `fileId` field to the certificate table for the generated PDF/image
4. **Add verification query** — `certificateByVerificationCode(code)` for public verification

### Rendering Pipeline
1. **Use Puppeteer for server-side PDF generation** — construct HTML from template + elements + variable values, render to PDF
2. **Use client-side preview** — render template elements as absolutely-positioned React components over the background image (no need for html-to-image for preview — just render directly)
3. **Build the visual template editor** — use a canvas/drag-and-drop interface for placing elements (CGVS has `@xyflow/react` and `react-zoom-pan-pinch` as dependencies but never built this)

### Generation Flow
1. **Batch generation** — `generateCertificates(templateId, recipientGroupId)` mutation that iterates over recipient group items
2. **Per-student variable resolution** — resolve each element's `sourceField` against student data, variable values, or certificate metadata
3. **Verification code** — generate a UUID or hashed unique code per certificate
4. **Store output** — save generated PDF to storage system, link via `fileId`

### Siraj-Specific Adaptations
1. **Follow siraj's type pattern** — `CertificateSelectType`, `CertificateInsertType`, `CertificateReturnType`, `CertificateSubmitInput` in `backend/types/certificate.types.ts`
2. **Use siraj's i18n system** — all error messages via `shared/locale/` translation functions
3. **Use siraj's layer separation** — Repository (data access) → Service (business logic) → Pothos (GraphQL)
4. **MUI v9 compatible** — use `sx` prop for all styled components (CGVS uses MUI v7 with some direct style props)
5. **Apollo Client v4** — import hooks from `@apollo/client/react`, not `@apollo/client`
6. **Include `id` field** on all GraphQL object types for Apollo cache normalization
7. **No `useLazyQuery`** — use stateful `useQuery` exclusively
