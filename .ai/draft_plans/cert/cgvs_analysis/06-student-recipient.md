# Student & Recipient System Analysis (CGVS)

## 1. Student Model

### Database Schema (`server/db/schema/students.ts`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | `serial` PK | No | Auto-incrementing primary key |
| `name` | `varchar(255)` | No | Full Arabic name (3+ words) |
| `email` | `varchar(255)` | Yes | Optional, validated server-side |
| `phoneNumber` | `varchar(255)` | Yes | Optional, stored as string |
| `dateOfBirth` | `timestamp` | Yes | Optional |
| `gender` | `genderEnum` | Yes | `Male` or `Female` |
| `nationality` | `countryCodeEnum` | Yes | ISO country code (excludes `IL`) |
| `createdAt` | `timestamp` | No | Default `now()` |
| `updatedAt` | `timestamp` | No | Default `now()`, updated on change |

### Database Indexes
- **GIN index** on `name` using `to_tsvector('simple', name)` — full-text search
- **GiST index** on `name` using `pg_trgm` — trigram-based LIKE/ILIKE similarity search

### Entity vs DTO
- `StudentEntity`: raw DB row type (`typeof students.$inferSelect`)
- `StudentDto`: mapped type where `phoneNumber` → `PhoneNumber` value object, `nationality` → `CountryCode` enum, `gender` → `Gender` enum
- Mapping occurs in `server/utils/student.utilts.ts` via `entityToDto()`

---

## 2. Recipient vs Student — Relationship

**"Recipient" is NOT the same as "Student".** They are distinct concepts:

- A **Student** is a standalone entity — a person who exists in the system independently.
- A **Recipient** is a join-table record (`templateRecipientGroupItem`) that links a Student to a Recipient Group for a specific template.

### Relationship Chain
```
Template → TemplateRecipientGroup → TemplateRecipientGroupItem (Recipient) → Student
```

### `templateRecipientGroupItems` Table (the "Recipient" table)
| Field | Type | Notes |
|-------|------|-------|
| `id` | `serial` PK | |
| `recipientGroupId` | FK → `templateRecipientGroups.id` | Which group this recipient belongs to |
| `studentId` | FK → `students.id` | Which student is the recipient |
| `createdAt` | timestamp | |
| `updatedAt` | timestamp | |

- **Unique index** on `(studentId, recipientGroupId)` — a student cannot be added to the same group twice.
- `RecipientEntity = typeof templateRecipientGroupItems.$inferSelect`
- `RecipientCreateInput`: `{ recipientGroupId: number, studentId: number }`
- `RecipientCreateListInput`: `{ recipientGroupId: number, studentIds: number[] }` — batch add

### Key Insight
A single Student can be a recipient in multiple groups across multiple templates. The Student entity itself has no reference to templates or groups — they are independent. Recipients are the join between Students and Groups.

---

## 3. Recipient Groups

### Database Schema (`server/db/schema/templateRecipientGroups.ts`)

| Field | Type | Nullable | Notes |
|-------|------|----------|-------|
| `id` | `serial` PK | No | |
| `templateId` | FK → `templates.id` | No | Groups are per-template |
| `name` | `varchar(255)` | No | 3–255 chars validated |
| `description` | `text` | Yes | Optional group description |
| `date` | `timestamp` | Yes | Optional event/issue date |
| `createdAt` | timestamp | No | |
| `updatedAt` | timestamp | No | |

### Purpose
Recipient Groups organize students into cohorts for a specific template. Each template can have multiple groups (e.g., "Group 1", "Group 2"). When generating certificates, the system processes all recipients in a group, resolving template variables for each student.

### How Created
- Via `createTemplateRecipientGroup` GraphQL mutation
- Requires: `templateId`, `name` (3–255 chars), optional `description` and `date`
- Server-side validation in `server/utils/recipientGroup.utils.ts`: `validateName()` checks length 3–255
- Can also be batch-created via `RecipientGroupRepository.createList()` (used in seeds)

### Delete Constraints
- A group **cannot be deleted** if it has students in it (`studentCount > 0`)
- The UI disables the delete button when `studentCount > 0`
- Tooltip shows "cannot delete group with students" message

---

## 4. Template-Recipient Binding

### Binding Flow
1. **Template** → has many **RecipientGroups** (via `templateId` FK)
2. **RecipientGroup** → has many **RecipientItems** (via `recipientGroupId` FK)
3. **RecipientItem** → references one **Student** (via `studentId` FK)

### How Recipients Are Assigned
- **Batch add**: `createRecipients` mutation with `{ recipientGroupId, studentIds: number[] }` — adds multiple students to a group at once
- **Single add**: `createRecipient` mutation with `{ recipientGroupId, studentId }`
- **Remove**: `deleteRecipient` (single) or `deleteRecipients` (batch by IDs)
- The client UI uses two-table approach:
  - "Add" tab: shows students NOT in the group → select → add to group
  - "Manage" tab: shows students IN the group → select → remove from group

### Apollo Cache Updates for Binding
When recipients are added/removed, the client:
1. Updates `studentCount` on the group in the `templateRecipientGroupsByTemplateId` cache (increment/decrement)
2. Evicts `studentsNotInRecipientGroup` and `recipientsByGroupIdFiltered` cached queries so they refetch

---

## 5. Student Table UI

### Component Architecture
```
StudentsPage (app router)
  └── StudentTable (@/client/views/student/StudentTable.tsx)
        └── Table (custom @/client/components/Table/Table/Table)
              └── TableProvider (context for columns, data, pagination, sorting, filtering)
```

### Custom Table Component
Uses a custom-built `Table` component (not MUI DataGrid), provided by `TableProvider` context. The table supports:
- Column resizing (widths persisted to localStorage)
- Server-side pagination, sorting, and filtering
- Row selection (single or multi)
- Inline cell editing
- Custom footer content (action buttons)

### Student Columns (`column.ts`)
| Column ID | Label (Arabic) | Type | Editable | Sortable | Filterable |
|-----------|----------------|------|----------|----------|------------|
| `name` | الاسم | text | Yes | Yes | Yes |
| `email` | البريد الإلكتروني | text | Yes | Yes | Yes |
| `dateOfBirth` | تاريخ الميلاد | date | Yes | Yes | Yes |
| `gender` | الجنس | select | Yes | Yes | Yes |
| `nationality` | الجنسية | country | Yes | Yes | Yes |
| `phoneNumber` | رقم الهاتف | phone | Yes | Yes | Yes |
| `createdAt` | تاريخ الإنشاء | date | No | Yes | Yes |
| `updatedAt` | تاريخ التحديث | date | No | Yes | Yes |

### Field Components
Each column type renders a custom field component:
- **TextFieldComponent**: Standard text input with blur validation
- **DateFieldComponent**: HTML5 date picker (`type="date"`) styled with info color
- **GenderFieldComponent**: MUI Select dropdown with clearable value, styled with warning color
- **CountryFieldComponent**: MUI Autocomplete with country flags (from `flagcdn.com`), Arabic country names, styled with success color
- **PhoneFieldComponent**: `MuiTelInput` with Arabic locale, `EG` default country, `IL` excluded, preferred countries configured

### Inline Creation — `CreateStudentRow.tsx`
A collapsible inline form at the top of the table for creating new students:
- Fields: name, email, dateOfBirth, gender, nationality, phoneNumber
- Field-level validation with error messages
- Debounced name search (1500ms) that checks for existing students with the same name
- `Ctrl+Enter` keyboard shortcut to submit
- Success/error notifications via Toolpad `useNotifications`

### Search
- Not a global search bar — filtering is per-column via the table's filter system
- The `CreateStudentRow` has a debounced name search for duplicate detection
- Name column uses full-text search (`to_tsvector`) and trigram similarity for filtering

### Bulk Actions
- Row selection is supported via checkboxes
- Footer shows selected count with a "clear all" button and confirmation dialog
- No bulk edit/delete in the student table itself (only single-cell inline edits)

---

## 6. Recipient Selection UI

### Architecture
The recipient management is a tab within the Template Management page:

```
RecipientsManagementTab (template.manage.recipient/)
  ├── RecipientSubTabList ("manage" / "add" sub-tabs)
  ├── RecipientGroupSelector (Autocomplete dropdown to pick group)
  └── TabContext
        ├── "manage" tab → StudentsInGroupTable (remove students from group)
        └── "add" tab → StudentsNotInGroupTable (add students to group)
```

### How Users Pick Recipients
1. **Select a Group**: `RecipientGroupSelector` — MUI Autocomplete dropdown showing all groups for the template, each with a student count `Chip`
2. **Switch sub-tab**: "manage" shows students already in group, "add" shows students not in group
3. **Select students**: Checkbox row selection in either table
4. **Confirm action**: Footer button with confirmation dialog:
   - "Add" tab: `RecipientTableFooterEnd` with `mode="add"` → adds selected students to the group
   - "Manage" tab: `RecipientTableFooterEnd` with `mode="remove"` → removes selected recipients from the group
5. **Footer also has**: "Go to Students Page" link (`/admin/students`) for managing the student roster

### Recipient Table Columns (`columns.ts` in recipient/)
| Column ID | Label (Arabic) | Type | Editable | Notes |
|-----------|----------------|------|----------|-------|
| `name` | الاسم | text | No | From joined student data |
| `nationality` | الجنسية | country | No | |
| `dateOfBirth` | تاريخ الميلاد | date | No | |
| `gender` | الجنس | select | No | Options: ذكر/أنثى |
| `email` | البريد الإلكتروني | text | No | |
| `createdAt` | تاريخ الإضافة | date | No | When added to group (NOT student createdAt) |

- Columns are **not editable** (recipient tables are for selection only)
- No `phoneNumber` column (unlike student table)
- Sorting maps to `StudentsOrderByColumn` GraphQL enum
- Filtering reuses the same `StudentFilterArgs` GraphQL input as the student table

### Data Mapping in `StudentsInGroupTable`
The table maps recipient records to expose student fields at the top level:
```typescript
data={recipients.map(r => ({
  ...(r.student || {}),    // spread student fields (name, email, etc.)
  id: r.id,                // row ID = recipient ID (for selection/mutations)
  recipientId: r.id,
  studentId: r.studentId,
  recipientGroupId: r.recipientGroupId,
}))}
```

### GraphQL Queries Used
- `studentsNotInRecipientGroup` — paginated/filtered students NOT in the selected group
- `recipientsByGroupIdFiltered` — paginated/filtered recipients IN the group (with joined student data)

---

## 7. Recipient Group UI

### Architecture
```
RecipientGroupTab (template.manage.recipientGroup/)
  ├── RecipientGroupList → RecipientGroupItem (per group)
  ├── CreateGroupDialog
  ├── GroupInfoDialog
  ├── GroupSettingsDialog
  ├── DeleteConfirmationDialog
  └── EmptyGroupsState (when no groups exist)
```

### RecipientGroupItem
Each group is rendered as a `Paper` card with:
- **Group icon** (GroupIcon)
- **Editable group name** — uses `EditableTypography` component (double-click to edit, inline save)
- **Student count badge** — `Chip` showing `studentCount`
- **Action buttons**:
  - Info (ℹ️) → opens `GroupInfoDialog` showing all group metadata
  - Settings (⚙️) → opens `GroupSettingsDialog` for editing name/description/date
  - Manage → (TODO: navigate to recipient management)
  - Delete (🗑️) → opens `DeleteConfirmationDialog`; **disabled when group has students**

### CreateGroupDialog
- Fields: name (required), description (optional multiline), date (optional DatePicker)
- Calls `createTemplateRecipientGroup` mutation
- On success: closes dialog, Apollo cache appends new group to the list

### GroupSettingsDialog
- Same fields as create dialog, pre-populated with existing values
- Only submits if values have actually changed (dirty check)
- Calls `updateTemplateRecipientGroup` mutation

### GroupInfoDialog
- Read-only display of: name, description, date, studentCount, createdAt, updatedAt
- Uses `date-fns` `format()` for date display

### Dialog State Management
- `useRecipientGroupDialogStore` (Zustand): manages `createDialogOpen`, `infoDialogOpen`, `settingsDialogOpen`, `deleteDialogOpen`, `selectedGroupId`
- `useRecipientGroupDialogs` hook: extracts stable references from the store

### Recipient Group Operations
- `useRecipientGroupOperations` hook wraps Apollo mutations with:
  - Success/error notifications (Toolpad `useNotifications`)
  - Auto-closing dialogs on success
  - GraphQL error message extraction
- `useRecipientGroupApolloMutations` hook manages Apollo cache:
  - Create: appends new group to `templateRecipientGroupsByTemplateId` cache
  - Update: replaces group in cache by matching ID
  - Delete: filters group out of cache by ID

### Store — `useRecipientStore` (Zustand)
Manages recipient management state:
- `selectedGroup`: currently selected group object
- `selectedGroupId`: persisted to `localStorage` (key: `recipient-selected-group-id`)
- `activeSubTab`: "manage" or "add" — persisted to `localStorage`
- `studentsNotInGroupQueryParams`: pagination/sort/filter params for "add" table
- `recipientsByGroupIdFilteredQuery`: pagination/sort/filter params for "manage" table
- `filtersNotInGroup` / `filtersInGroup`: UI filter states (separate per tab)
- `selectedStudentIdsNotInGroup` / `selectedRecipientIdsInGroup`: row selections (not persisted)
- `useRecipientStoreInitializer`: restores `selectedGroup` from persisted `selectedGroupId` via GraphQL query

---

## 8. Variable Resolution

### Template Variables Schema (`server/db/schema/templateVariables.ts`)

### `templateVariableBases` Table
| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `templateId` | FK → templates | |
| `name` | varchar(255) | Variable name (Arabic) |
| `description` | text | Optional |
| `type` | `templateVariableTypeEnum` | `text`, `number`, `date`, `select` |
| `required` | boolean | Default false |
| `order` | integer | Display/processing order |
| `previewValue` | varchar(255) | Default preview value |
| `createdAt`, `updatedAt` | timestamp | |

### Variable Type Sub-Tables
- **Text** (`templateVariableTexts`): `baseId`, `minLength`, `maxLength`, `pattern`
- **Number** (`templateVariableNumbers`): `baseId`, `minValue`, `maxValue`, `decimalPlaces`
- **Date** (`templateVariableDates`): `baseId`, `minDate`, `maxDate`, `format`
- **Select** (`templateVariableSelects`): `baseId`, `multiple` (boolean)
  - Sub-table `templateVariableSelectOptions`: `selectId`, `value`, `order`

### Per-Recipient Variable Values
`recipientGroupItemVariableValues` table:
| Field | Type | Notes |
|-------|------|-------|
| `id` | serial PK | |
| `templateRecipientGroupItemId` | FK → recipient items | Which recipient |
| `templateVariableId` | FK → variable bases | Which variable |
| `value` | varchar(255) | The resolved value |
| `valueIndexed` | varchar(255) | Indexed copy for searching |
| `createdAt`, `updatedAt` | timestamp | |

- **Unique index** on `(templateRecipientGroupItemId, templateVariableId)` — one value per recipient per variable
- This is where per-recipient variable values are stored, allowing each student in a group to have different values for the same template variables (e.g., different GPA, different specialization)

### Variable Resolution Flow
1. Template defines variables (e.g., "Student Name", "Issue Date", "Reference Number")
2. Each variable has preview values for template preview
3. When students are added to a recipient group, per-recipient variable values can be set
4. During certificate generation, the system looks up each recipient's variable values
5. If no per-recipient value exists, the preview value may be used as fallback

---

## 9. Student CRUD

### GraphQL Mutations (`server/graphql/mutation/student.mutation.ts`)

| Mutation | Input | Returns | Notes |
|----------|-------|---------|-------|
| `createStudent` | `StudentCreateInput` | `StudentDto` | Single student create |
| `partiallyUpdateStudent` | `StudentUpdateInput` (partial fields) | `StudentDto` | Partial update by ID |
| `deleteStudent` | `id: number` | `StudentDto` | Delete by ID |

### Repository Methods (`server/db/repo/student.repository.ts`)
- `create(data: StudentCreateInput): Promise<StudentEntity>`
- `createList(data: StudentCreateInput[]): Promise<StudentEntity[]>` — batch create (used by seeds, not exposed via GraphQL)
- `partialUpdate(id, data: Partial<StudentUpdateInput>): Promise<StudentEntity>`
- `deleteById(id): Promise<StudentEntity>`
- `findById(id): Promise<StudentEntity | null>`
- `findAll(orderBy, paginationArgs, filterArgs): Promise<{ data, pageInfo }>` — paginated search
- `searchStudentsRecipientInGroup(recipientGroupId, args): Promise<{ data, pageInfo }>`
- `searchStudentsNotInRecipientGroup(recipientGroupId, args): Promise<{ data, pageInfo }>`

### Client-Side CRUD (`useStudentOperations.tsx`)
- `createStudent`: calls `createStudent` Apollo mutation, shows success/error notification
- `updateStudent`: calls `partiallyUpdateStudent` Apollo mutation
- `deleteStudent`: calls `deleteStudent` Apollo mutation with confirmation dialog
- `handleUpdateCell`: cell-level inline editing — validates the new value, then calls `partiallyUpdateStudent` with only the changed field

### Apollo Cache (`useStudentApolloMutations.ts`)
- Create: appends student to `students` query cache + refetches
- Update: updates the specific student in cache by ID
- Delete: removes from cache and evicts related queries

---

## 10. Validation

### Client-Side Validation (`validators.ts`)

| Field | Validation Rule | Error Message (Arabic) |
|-------|----------------|----------------------|
| `name` | ≥3 words, each ≥3 chars, Unicode letters/dashes/apostrophes only (`/^[\p{L}\p{M}'-]+$/u`), 3–255 chars total | "يجب أن يحتوي الاسم على ثلاث أسماء على الأقل" / "يجب أن يحتوي كل جزء من الاسم على 3 أحرف على الأقل" |
| `email` | `validator.isEmail()` format (optional) | "صيغة البريد الإلكتروني غير صحيحة" |
| `gender` | Must be `Male` or `Female` | "قيمة الجنس غير صحيحة" |
| `nationality` | Must match valid country code (excludes `IL`) | "رمز البلد غير صحيح" |
| `dateOfBirth` | Valid date, not in the future | "لا يمكن أن يكون التاريخ في المستقبل" |
| `phoneNumber` | `matchIsValidTel()` from `mui-tel-input` (excludes `IL`) | "صيغة رقم الهاتف غير صحيحة" |

### Server-Side Validation (`server/utils/student.utilts.ts`)
- `validateStudentName(name)`: checks 3–255 chars, each word ≥3 chars, Unicode letter pattern
- `validateEmail(email)`: uses `validator.isEmail()` via `Email` value object
- `validateDateOfBirth(date)`: checks valid date and not in future
- `validatePhoneNumber(phone)`: validates via `PhoneNumber` value object
- `validateGender(gender)`: checks against `Gender` enum
- `validateNationality(country)`: checks against `CountryCode` enum
- `entityToDto(entity)`: maps raw DB entity to DTO with typed value objects
- `createStudentValidate(input)`: runs all validations, returns `{ success, errors }` result

### Recipient Group Validation (`server/utils/recipientGroup.utils.ts`)
- `validateName(name)`: 3–255 chars required

---

## 11. Seed Data

### Seed Script (`server/db/scripts/drizzleSeed.ts`)

The seed script creates:

| Entity | Count | Details |
|--------|-------|---------|
| Admin user | 1 | `admin@cgvs.com` with password `cgvs@123`, admin role |
| Template categories | 10+ | 5 top-level + 2 subcategories each + special categories (main, suspension) |
| Templates | 5 | One per top-level category, with image file and variables |
| Template variables | 5 per template | 3 common + 2 category-specific |
| Students | 1000 | Randomized Arabic names, optional email/phone/DOB/gender/nationality |
| Recipient groups | 2 per template | Named "مجموعة {template name} {1 or 2}" |
| Recipient items | 10–50 per group | Random students assigned to each group |

### Student Generation (`generators.ts`)
- **Names**: Composed from arrays of 20 first names, 15 middle names, 15 last names → `{first} {middle} {last}`
- **Email**: 70% chance — randomized format `{firstName}{4digits}.{lastName}{3digits}{3digits}@{domain}` (gmail/hotmail/outlook/yahoo)
- **Phone**: 60% chance — Saudi format `+9665{1digit}{7digits}`
- **Date of Birth**: 80% chance — random date between 1980 and 2004
- **Gender**: 90% chance — random `Male`/`Female` (10% null)
- **Nationality**: 75% chance — random `CountryCode` (25% null)

### Template Variable Creat selectively (`templateVariableCreators.ts`)
Each template gets 3 common variables:
1. **Student Name** (text, required, 3–100 chars)
2. **Issue Date** (date, required, format `Y-m-d`)
3. **Reference Number** (text, required, exactly 8 chars matching `^[A-Z0-9]{8}$`)

Plus 2 category-specific variables:
- **Academic**: Major (text), GPA (number 0–5, 2 decimals)
- **Professional**: Field (select: IT/Business/HR/Marketing/Project Management), Training Duration (number 1–1000 hours)
- **Attendance**: Event Name (text 5–200), Location (text 3–100)
- **Appreciation**: Reason (text 10–500), Level (text)
- **Volunteer**: Volunteer Type (text 5–200), Hours (number 1–1000)

### Template Categories (`constants.ts`)
5 top-level categories, each with 2 subcategories:
1. الشهادات الأكاديمية (Academic) — Bachelor's, Master's
2. الشهادات المهنية (Professional) — Technical Training, Management
3. شهادات الحضور (Attendance) — Conferences, Workshops
4. شهادات التقدير (Appreciation) — Excellence, Merit
5. الشهادات التطوعية (Volunteer) — Volunteer Work, Community Service

---

## 12. Filters & Sorting

### Student Filtering System

#### Filter Operations (`server/types/student.types.ts`)

**Text operations** (applied to `name`, `email`, `phoneNumber`):
- `contains`, `notContains`, `equals`, `notEquals`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty`

**Date operations** (applied to `dateOfBirth`, `createdAt`, `updatedAt`):
- `is`, `isNot`, `isBefore`, `isAfter`, `isOnOrBefore`, `isOnOrAfter`, `between`, `isEmpty`, `isNotEmpty`

**Exact match** (applied to `gender`, `nationality`):
- Direct enum value match

#### Filter Application (`server/utils/student.filterUtils.ts`)
The `studentFilter` function builds SQL conditions:
- **Text filters**: maps to SQL `ILIKE` with wildcards (`%value%`, `value%`, etc.)
- **Date filters**: maps to Drizzle `gt`, `lt`, `gte`, `lte`, `eq`, `between`
- **Gender**: maps to `eq` against enum value
- **Nationality**: maps to `eq` against country code
- **Name** specifically uses PostgreSQL full-text search (`to_tsvector`) for contains operations AND trigram similarity (`%`) for fuzzy matching
- Multiple filters are combined with AND logic

#### Client-Side Filter Mapping (`hook/utils/filter.ts`)
UI `FilterClause` objects are mapped to GraphQL `StudentFilterArgs`:
- `mapTextFilter(columnId, operation, value)` → `{ [column]: { [operation]: value } }`
- `mapDateFilter(columnId, operation, value)` → `{ [column]: { [operation]: value.toISOString() } }`

### Sorting

#### GraphQL Sorting
- Uses `StudentsOrderByClause[]` — array of `{ column: StudentsOrderByColumn, order: OrderSortDirection }`
- Sort columns: `ID`, `NAME`, `EMAIL`, `DATE_OF_BIRTH`, `GENDER`, `CREATED_AT`, `UPDATED_AT`
- Sort direction: `ASC` or `DESC`
- Multiple sort columns supported (multi-sort)

#### Client-Side Sort
- `mapColumnIdToGraphQLColumn()` maps lowercase UI column IDs to uppercase GraphQL enum values
- Sort state persisted in Zustand store
- Table's `onSort` callback converts UI sort to GraphQL format

### Pagination
- Cursor-based via `PaginationArgs`: `{ page: number, first: number }`
- Default: 100 rows per page, page 1
- `pageInfo` response includes: `count`, `currentPage`, `firstItem`, `hasMorePages`, `lastItem`, `lastPage`, `perPage`, `total`
- Row options: `ROWS_PER_PAGE_OPTIONS` constant (likely `[25, 50, 100, 200]` or similar)

---

## Summary: Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
                         SERVER (Backend)                                │
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  GraphQL (Pothos)                                                    │
│  ├── Queries                                                        │
│  │   ├── student(id), students(filter, sort, page)                   │
│  │   ├── studentsInRecipientGroup(groupId, filter, sort, page)       │
│  │   ├── studentsNotInRecipientGroup(groupId, filter, sort, page)   │
│  │   ├── recipient(id), recipientsByGroupId(groupId)                  │
│  │   ├── recipientsByStudentId(studentId)                             │
│  │   ├── recipientsByGroupIdFiltered(groupId, filter, sort, page)     │
│  │   ├── templateRecipientGroupById(id)                               │
│  │   └── templateRecipientGroupsByTemplateId(templateId)              │
│  │                                                                   │
│  ├── Mutations                                                       │
│  │   ├── createStudent, partiallyUpdateStudent, deleteStudent        │
│  │   ├── createRecipient, createRecipients (batch)                   │
│  │   ├── deleteRecipient, deleteRecipients (batch)                   │
│  │   └── createTemplateRecipientGroup, update, delete                 │
│  │                                                                   │
│  ├── Pothos Objects (with DataLoader)                                 │
│  │   ├── StudentObject: loadableObjectRef (batch by IDs)             │
│  │   ├── TemplateRecipientObject: loadable student + recipientGroup  │
│  │   └── TemplateRecipientGroupObject: loadable template, recipients │
│  │     + studentCount (computed via countInGroup)                     │
│  │                                                                   │
│  Repositories                                                        │
│  ├── StudentRepository: CRUD + search + searchInGroup/NotInGroup     │
│  ├── RecipientRepository: CRUD + searchRecipientsInGroup (+ student) │
│  └── RecipientGroupRepository: CRUD + findAllByTemplateId            │
│                                                                     │
│  Database (PostgreSQL via Drizzle ORM)                               │
│  ├── students (FTS + trigram indexes on name)                       │
│  ├── templateRecipientGroups (per-template grouping)                 │
│  ├── templateRecipientGroupItems (join: student ↔ group)             │
│  ├── recipientGroupItemVariableValues (per-recipient variable vals)  │
│  ├── templateVariableBases + typed sub-tables (text/number/date/select)│
│  └── templateVariableSelectOptions                                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
                         CLIENT (Frontend)                              │
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  /admin/students → StudentsPage → StudentTable                       │
│  ├── Custom Table component (columns, inline edit, filters, sort)     │
│  ├── CreateStudentRow (inline creation form with validation)         │
│  ├── 8 columns: name, email, DOB, gender, nationality, phone, dates   │
│  ├── Zustand store (persisted to sessionStorage)                     │
│  └── Apollo mutations with cache updates                             │
│                                                                     │
│  Template Manage > Recipient Group Tab                                │
│  ├── RecipientGroupList → RecipientGroupItem × N                      │
│  ├── Create/Settings/Info/Delete dialogs                             │
│  ├── Inline name editing (EditableTypography)                        │
│  ├── Delete disabled when studentCount > 0                           │
│  └── Zustand dialog store                                            │
│                                                                     │
│  Template Manage > Recipients Tab                                     │
│  ├── RecipientGroupSelector (Autocomplete with student count chips)  │
│  ├── Sub-tabs: "manage" (in group) / "add" (not in group)            │
│  ├── StudentsInGroupTable: select + remove from group                │
│  ├── StudentsNotInGroupTable: select + add to group                  │
│  ├── Both tables use same columns (6 cols, non-editable)             │
│  ├── Separate filter/pagination/sort state per tab                   │
│  ├── Footer: selection count, clear all, action button with confirm   │
│  └── Zustand store (selected group persisted to localStorage)        │
│                                                                     │
│  Input Components                                                    │
│  ├── CountrySelect/CountryField: Autocomplete with flags             │
│  ├── GenderSelector/GenderField: ButtonGroup or Select               │
│  ├── DateFieldComponent: HTML5 date input                            │
│  ├── PhoneFieldComponent: MuiTelInput (Arabic, IL excluded)          │
│  └── TextFieldComponent: Standard text with validation               │
│                                                                     │
│  i18n: Arabic locale files for student, recipient, recipientGroup    │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Patterns

1. **Student-Group Separation**: Students are global entities; recipient groups are per-template; the join (recipient item) connects them.
2. **Two-Table Pattern**: Recipient management uses two parallel tables (students-in-group / students-not-in-group) with server-side filtering, pagination, and sorting for both.
3. **Zustand Stores**: Each major UI section has its own Zustand store managing query params, filters, selections, and persisted state.
4. **Apollo Cache Optimistic Updates**: Mutations manually update cache (increment/decrement studentCount, append/remove groups) to avoid full refetches.
5. **DataLoader Batching**: Pothos objects use `loadableObjectRef` / `loadableListRef` for N+1 query prevention when resolving nested student/recipient/group fields.
6. **Custom Table**: Built in-house (not MUI DataGrid) with column resizing, per-column filtering, server-side pagination, and inline editing — highly tailored for Arabic RTL.
7. **Per-Recipient Variable Values**: The `recipientGroupItemVariableValues` table allows each student in a group to have unique values for template variables, enabling personalized certificates.
