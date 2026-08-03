# CGVS GraphQL API & Resolvers Analysis

## 1. Pothos Builder Setup

### Schema Builder Configuration

File: `server/graphql/gqlSchemaBuilder.ts`

The CGVS schema builder uses **8 Pothos plugins**, configured in this order:

```typescript
export const gqlSchemaBuilder = new SchemaBuilder<PothosTypes>({
  plugins: [
    DrizzlePlugin,      // Drizzle ORM integration
    AddGraphQL,          // Schema extension
    ErrorsPlugin,        // Structured error handling
    ScopeAuthPlugin,     // Field-level auth scopes
    WithInputPlugin,     // Input type helpers
    SimpleObjectsPlugin, // Simple object types
    DataloaderPlugin,    // DataLoader batching
    TracingPlugin,       // Resolver tracing
  ],
  drizzle: {
    client: () => db,
    getTableConfig,
    relations,
  },
  scopeAuth: {
    authScopes: ctx => ({
      loggedIn: !!ctx.user,
      admin: !!ctx.roles.includes("admin"),
      role: (role: string) => ctx.roles.includes(role),
    }),
  },
  errors: {
    defaultTypes: [],
    onResolvedError: error => logger.error("Handled error:", error),
  },
  tracing: {
    default: config => isRootField(config),
    wrap: (resolver, options, config) =>
      wrapResolver(resolver, (error, duration) => {
        logger.log(`Executed resolver ${config.parentType}.${config.name} in ${duration}ms`);
      }),
  },
});
```

### PothosTypes Interface

```typescript
export interface PothosTypes {
  DrizzleRelations: DrizzleRelations;
  Context: BaseContext;
  AuthScopes: {
    loggedIn: boolean;
    admin: boolean;
    role: string;       // function: (role) => ctx.roles.includes(role)
  };
  AuthContexts: AuthContexts;
  Scalars: {
    DateTime: { Input: Date; Output: Date | string };
    Date: { Input: Date; Output: Date };
    PhoneNumber: { Input: PhoneNumber; Output: PhoneNumber };
    Email: { Input: Email; Output: Email };
  };
}
```

### Plugins Summary

| Plugin | Purpose |
|--------|---------|
| `DrizzlePlugin` | Connects Drizzle ORM tables/relations to Pothos |
| `AddGraphQL` | Allows schema extension patterns |
| `ErrorsPlugin` | Structured error handling with `onResolvedError` callback |
| `ScopeAuthPlugin` | Field-level auth scopes (`loggedIn`, `admin`, `role`) |
| `WithInputPlugin` | Simplified input type creation |
| `SimpleObjectsPlugin` | Create object types without Drizzle backing |
| `DataloaderPlugin` | DataLoader batching for N+1 prevention |
| `TracingPlugin` | Resolver execution time logging |

### Schema Assembly

File: `server/graphql/gqlSchema.ts`

```typescript
// Imports side-effect: registers all query/mutation fields
import "./query";
import "./mutation";

// Register custom scalars
gqlSchemaBuilder.addScalarType("Date", DateResolver, {});
gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
gqlSchemaBuilder.addScalarType("PhoneNumber", PhoneNumberScalar);
gqlSchemaBuilder.addScalarType("Email", EmailScalar);

gqlSchemaBuilder.mutationType({});
gqlSchemaBuilder.queryType({});

export const graphQLSchema = gqlSchemaBuilder.toSchema();
```

### SDL Generation

File: `server/graphql/generateGqlSchema.ts`

Uses `printSchema(graphQLSchema)` to write SDL to `client/graphql/generated/schema.graphql`, then spawns `bun run graphql-codegen` for TypeScript type generation.

---

## 2. Context Structure

### BaseContext

File: `server/graphql/gqlContext.ts`

```typescript
export type BaseContext = {
  user?: {
    id: number;
  };
  roles: string[];
  refreshToken?: string;
  sessionId?: string;
  cookies?: ResponseCookies;
};

export type AuthContexts = {
  loggedIn: BaseContext & { user: object };
  role: BaseContext & { user: object };
};
```

**Key fields:**
- `user`: Only `{ id: number }` — minimal user reference (not a full user object)
- `roles`: String array of role names (e.g., `["admin"]`)
- `refreshToken`: JWT refresh token from cookie
- `sessionId`: Session UUID from cookie
- `cookies`: Next.js `ResponseCookies` for setting/deleting HTTP-only cookies

### Context Factory

File: `server/graphql/gqlContextFactory.ts`

`createGraphQLContext()` is the context factory used by Apollo Server:

1. Extracts access token from `Authorization` header
2. Extracts refresh token from `cgvs_refresh_token` cookie or `x-refresh-token` header
3. Extracts session ID from `cgvs_session_id` cookie
4. Verifies the access token via `verifyToken()` — if valid, extracts `userId`
5. Calls `createContext({ userId })` which loads the user and roles from DB
6. Returns the assembled context

```typescript
export async function createGraphQLContext(): Promise<BaseContext & {...}> {
  const headersList = await headers();
  const cookieStore = await cookies();

  const authHeader = headersList.get("authorization");
  const accessToken = extractTokenFromHeader(authHeader);
  const refreshToken = cookieStore.get("cgvs_refresh_token")?.value || headersList.get("x-refresh-token") || undefined;
  const sessionId = cookieStore.get("cgvs_session_id")?.value || undefined;

  let userId: number | null = null;
  if (accessToken) {
    const payload = await verifyToken(accessToken);
    if (payload && payload.type === "access") userId = payload.userId;
  }

  const baseContext = await createContext({ userId });
  return { ...baseContext, refreshToken, sessionId, cookies: cookieStore };
}
```

### createContext (internal)

```typescript
export async function createContext({ userId }: { userId?: number | null }): Promise<BaseContext> {
  if (!userId) return { roles: [] };

  const user = await db.query.users.findFirst({
    columns: { id: true },
    with: { roles: true },
    where: { id: userId },
  });

  return {
    user: user ?? undefined,
    roles: user?.roles.map(role => role.name) ?? [],
  };
}
```

---

## 3. Complete Query Map

### Summary Table

| Query | Args | Return Type | Auth Required | Resolver Source |
|-------|------|-------------|---------------|-----------------|
| **Auth** | | | | |
| `me` | — | `User` (nullable) | ✅ `loggedIn` | `UserRepository.findById(ctx.user.id)` |
| `user(id)` | `id: Int!` | `User` (nullable) | ✅ `loggedIn` | `UserRepository.findById(args.id)` |
| `users` | — | `[User!]` | ❌ None | `UserRepository.findAll()` |
| **Student** | | | | |
| `student(id)` | `id: Int!` | `Student` (nullable) | ❌ None | `StudentRepository.findById()` |
| `students` | `paginationArgs`, `orderBy`, `filterArgs` | `StudentsWithFiltersResponse!` | ❌ None | `StudentRepository.fetchWithFilters()` |
| `studentsInRecipientGroup` | `recipientGroupId: Int!`, `paginationArgs`, `orderBy`, `filterArgs` | `StudentsWithFiltersResponse!` | ❌ None | `StudentRepository.searchStudentsRecipientInGroup()` |
| `studentsNotInRecipientGroup` | `recipientGroupId: Int!`, `paginationArgs`, `orderBy`, `filterArgs` | `StudentsWithFiltersResponse!` | ❌ None | `StudentRepository.searchStudentsNotInRecipientGroup()` |
| **Recipient** | | | | |
| `recipient(id)` | `id: Int!` | `TemplateRecipient` (nullable) | ❌ None | `RecipientRepository.findById()` |
| `recipientsByGroupId` | `recipientGroupId: Int!` | `[TemplateRecipient!]!` | ❌ None | `RecipientRepository.findAllByGroupId()` |
| `recipientsByStudentId` | `studentId: Int!` | `[TemplateRecipient!]!` | ❌ None | `RecipientRepository.findByStudentId()` |
| `recipientsByGroupIdFiltered` | `recipientGroupId: Int!`, `paginationArgs`, `orderBy`, `filterArgs` | `RecipientsWithFiltersResponse!` | ❌ None | `RecipientRepository.searchRecipientsInGroup()` |
| **Recipient Group** | | | | |
| `templateRecipientGroupById(id)` | `id: Int!` | `TemplateRecipientGroup` | ❌ None | `RecipientGroupRepository.findById()` |
| `templateRecipientGroupsByTemplateId` | `templateId: Int!` | `[TemplateRecipientGroup!]` | ❌ None | `RecipientGroupRepository.findAllByTemplateId()` |
| **Template** | | | | |
| `template(id)` | `id: Int!` | `Template` (nullable) | ❌ None | `TemplateRepository.findById()` |
| `templates` | `pagination: PaginationArgs` | `PaginatedTemplatesResponse` | ❌ None | `TemplateRepository.findAllPaginated()` |
| `templatesByCategoryId` | `categoryId: Int`, `paginationArgs`, `filterArgs`, `orderBy` | `TemplatesWithFiltersResponse` | ❌ None | `TemplateRepository.fetchByCategoryIdWithFilters()` |
| `suspendedTemplates` | — | `[Template!]` | ❌ None | `TemplateRepository.suspendedTemplates()` |
| `templatesConfigs` | — | `TemplatesConfigs` | ❌ None | `TemplateRepository.allConfigs()` |
| **Template Category** | | | | |
| `templateCategory(id)` | `id: Int!` | `TemplateCategory` (nullable) | ❌ None | `TemplateCategoryRepository.findById()` |
| `templateCategories` | — | `[TemplateCategory!]!` | ❌ None | `TemplateCategoryRepository.findAll()` |
| `mainTemplateCategory` | — | `TemplateCategory!` | ❌ None | `TemplateCategoryRepository.findTemplatesMainCategory()` |
| `suspensionTemplateCategory` | — | `TemplateCategory!` | ❌ None | `TemplateCategoryRepository.findTemplatesSuspensionCategory()` |
| `categoryChildren` | `parentCategoryId: Int` | `[TemplateCategory!]!` | ❌ None | `TemplateCategoryRepository.findCategoryChildren()` |
| `searchTemplateCategories` | `searchTerm: String!`, `limit: Int`, `includeParentTree: Boolean` | `[TemplateCategoryWithParentTree!]!` | ❌ None | `TemplateCategoryRepository.searchByName()` |
| **Template Variable** | | | | |
| `templateVariable(id)` | `id: Int!` | `TemplateVariable` | ❌ None | `TempVarRepo.findById()` |
| `templateVariablesByTemplateId` | `templateId: Int!` | `[TemplateVariable!]` | ❌ None | `TempVarRepo.findByTemplateId()` |
| **Storage** | | | | |
| `listFiles` | `input: FilesListInput!` | `StorageObjectList` | ❌ None | `storageService.listFiles()` |
| `fileInfo` | `path: String!` | `FileInfo` (nullable) | ❌ None | `storageService.fileInfoByPath()` |
| `folderInfo` | `path: String!` | `DirectoryInfo` | ❌ None | `storageService.directoryInfoByPath()` |
| `searchFiles` | `searchTerm: String!`, `fileType: String`, `folder: String`, `limit: Int = 50` | `StorageObjectList` | ❌ None | `storageService.listFiles()` |
| `storageStats` | `path: String` | `StorageStats` | ❌ None | `storageService.storageStatistics()` |
| `directoryChildren` | `path: String` | `[DirectoryInfo!]` | ❌ None | `storageService.fetchDirectoryChildren()` |
| `fileUsage` | `input: FileUsageCheckInput!` | `FileUsageResult` | ❌ None | `StorageDbRepository.checkFileUsage()` |

**Total: 31 queries**

### Notable Auth Gaps

Only 3 queries require auth (`me`, `user`, `users`). All other 28 queries (students, templates, recipients, storage) are **publicly accessible** — no auth scopes defined.

---

## 4. Complete Mutation Map

| Mutation | Args | Return Type | Auth Required | Resolver Source |
|---------|------|-------------|---------------|-----------------|
| **Auth** | | | | |
| `login` | `input: LoginInput!` | `LoginResponse` | ❌ None | inline auth logic |
| `refreshToken` | — | `RefreshTokenResponse` | ❌ None | inline token rotation |
| `logout` | — | `Boolean` | ✅ `loggedIn` | `SessionRepository.deleteByUserId()` |
| **Student** | | | | |
| `createStudent` | `input: StudentCreateInput!` | `Student` (nullable) | ❌ None | `StudentRepository.create()` |
| `partiallyUpdateStudent` | `input: PartialStudentUpdateInput!` | `Student` | ❌ None | `StudentRepository.partiallyUpdate()` |
| `deleteStudent` | `id: Int!` | `Student` | ❌ None | `StudentRepository.deleteById()` |
| **Recipient** | | | | |
| `createRecipient` | `input: TemplateRecipientCreateInput!` | `TemplateRecipient!` | ❌ None | `RecipientRepository.create()` |
| `createRecipients` | `input: TemplateRecipientCreateListInput!` | `[TemplateRecipient!]!` | ❌ None | `RecipientRepository.createList()` |
| `deleteRecipient` | `id: Int!` | `TemplateRecipient!` | ❌ None | `RecipientRepository.deleteById()` |
| `deleteRecipients` | `ids: [Int!]!` | `[TemplateRecipient!]!` | ❌ None | `RecipientRepository.deleteSetByIds()` |
| **Recipient Group** | | | | |
| `createTemplateRecipientGroup` | `input: TemplateRecipientGroupCreateInput!` | `TemplateRecipientGroup` | ❌ None | `Repo.create()` |
| `updateTemplateRecipientGroup` | `input: TemplateRecipientGroupUpdateInput!` | `TemplateRecipientGroup` | ❌ None | `Repo.update()` |
| `deleteTemplateRecipientGroup` | `id: Int!` | `TemplateRecipientGroup` | ❌ None | `Repo.deleteById()` |
| **Template** | | | | |
| `createTemplate` | `input: TemplateCreateInput!` | `Template` | ❌ None | `TemplateRepository.create()` |
| `updateTemplate` | `input: TemplateUpdateInput!` | `Template` (nullable) | ❌ None | `TemplateRepository.update()` |
| `deleteTemplate` | `id: Int!` | `Template` (nullable) | ❌ None | `TemplateRepository.deleteById()` |
| `suspendTemplate` | `id: Int!` | `Template` (nullable) | ❌ None | `TemplateRepository.suspendById()` |
| `unsuspendTemplate` | `id: Int!` | `Template` (nullable) | ❌ None | `TemplateRepository.unsuspendById()` |
| **Template Category** | | | | |
| `createTemplateCategory` | `input: TemplateCategoryCreateInput!` | `TemplateCategory!` | ❌ None | `TemplateCategoryRepository.create()` |
| `updateTemplateCategory` | `input: TemplateCategoryUpdateInput!` | `TemplateCategory!` | ❌ None | `TemplateCategoryRepository.update()` |
| `deleteTemplateCategory` | `id: Int!` | `TemplateCategory!` | ❌ None | `TemplateCategoryRepository.deleteById()` |
| **Template Variable** | | | | |
| `createTemplateTextVariable` | `input: TemplateTextVariableCreateInput!` | `TemplateTextVariable` | ❌ None | `TmvRepo.createTextVar()` |
| `createTemplateNumberVariable` | `input: TemplateNumberVariableCreateInput!` | `TemplateNumberVariable` | ❌ None | `TmvRepo.createNumberVar()` |
| `createTemplateDateVariable` | `input: TemplateDateVariableCreateInput!` | `TemplateDateVariable` | ❌ None | `TmvRepo.createDateVar()` |
| `createTemplateSelectVariable` | `input: TemplateSelectVariableCreateInput!` | `TemplateSelectVariable` | ❌ None | `TmvRepo.createSelectVar()` |
| `updateTemplateTextVariable` | `input: TemplateTextVariableUpdateInput!` | `TemplateTextVariable` | ❌ None | `TmvRepo.updateTextVar()` |
| `updateTemplateNumberVariable` | `input: TemplateNumberVariableUpdateInput!` | `TemplateNumberVariable` | ❌ None | `TmvRepo.updateNumberVar()` |
| `updateTemplateDateVariable` | `input: TemplateDateVariableUpdateInput!` | `TemplateDateVariable` | ❌ None | `TmvRepo.updateDateVar()` |
| `updateTemplateSelectVariable` | `input: TemplateSelectVariableUpdateInput!` | `TemplateSelectVariable` | ❌ None | `TmvRepo.updateSelectVar()` |
| `deleteTemplateVariable` | `id: Int!` | `TemplateVariable` | ❌ None | `TmvRepo.deleteVarById()` |
| **Storage** | | | | |
| `renameFile` | `input: FileRenameInput!` | `FileOperationResult` | ❌ None | `storageService.renameFile()` |
| `deleteFile` | `path: String!` | `FileOperationResult` | ❌ None | `storageService.deleteFile()` |
| `generateUploadSignedUrl` | `input: UploadSignedUrlGenerateInput!` | `String` | ❌ None | `storageService.generateUploadSignedUrl()` |
| `createFolder` | `input: FolderCreateInput!` | `FileOperationResult` | ❌ None | `storageService.createFolder()` |
| `moveStorageItems` | `input: StorageItemsMoveInput!` | `BulkOperationResult` | ❌ None | `storageService.moveItems()` |
| `copyStorageItems` | `input: StorageItemsCopyInput!` | `BulkOperationResult` | ❌ None | `storageService.copyItems()` |
| `deleteStorageItems` | `input: StorageItemsDeleteInput!` | `BulkOperationResult` | ❌ None | `storageService.deleteItems()` |
| `updateDirectoryPermissions` | `input: DirectoryPermissionsUpdateInput!` | `FileOperationResult` | ❌ None | `StorageDbRepository.updateDirectoryPermissions()` |
| `setStorageItemProtection` | `input: StorageItemProtectionUpdateInput!` | `FileOperationResult` | ❌ None | `StorageDbRepository.setProtection()` |

**Total: 39 mutations**

### Auth Gaps in Mutations

Only `logout` requires auth. **All 38 other mutations (create/update/delete for students, templates, recipients, storage) are publicly accessible** — no auth scopes defined. This is a significant security concern.

---

## 5. Object Types

### Domain Objects

| Object Type | Interface | Loader Pattern | Key Fields |
|-------------|-----------|----------------|------------|
| `User` | — | `loadableObject` (batch by ID) | id, name, email, emailVerifiedAt, createdAt, updatedAt |
| `Student` | — | `loadableObjectRef` (batch by ID) | id, name, email, phoneNumber, gender, dateOfBirth, nationality, createdAt, updatedAt |
| `Template` | — | `loadableObjectRef` (batch by ID) | id, name, description, order, imageUrl, createdAt, updatedAt |
| `TemplateCategory` | — | `loadableObject` (batch by ID) | id, name, description, order, specialType, createdAt, updatedAt |
| `TemplateRecipient` | — | `objectRef` (no loader) | id, recipientGroupId, studentId, createdAt, updatedAt |
| `TemplateRecipientGroup` | — | `objectRef` (no loader) | id, name, description, date, createdAt, updatedAt |

### Storage Objects

| Object Type | Interface | Key Fields |
|-------------|-----------|------------|
| `FileInfo` | `StorageObject` | path, name, size, contentType, md5Hash, url, fileType, isPublic, isInUse, usages |
| `DirectoryInfo` | `StorageObject` | path, name, permissions, protectChildren, fileCount, folderCount, totalSize |
| `StorageObjectList` | — | items (interface list), totalCount, hasMore, offset, limit |
| `DirectoryPermissions` | — | allowUploads/delete/move/createSubDirs/deleteFiles/moveFiles |
| `FileUsageInfo` | — | id, filePath, usageType, referenceId, referenceTable, createdAt |
| `FileUsageResult` | — | isInUse, usages, canDelete, deleteBlockReason |
| `FileOperationResult` | — | success, message, data (StorageObject) |
| `BulkOperationResult` | — | success, message, successCount, failureCount, failures, successfulItems |
| `BulkOperationFailure` | — | path, error |
| `StorageStats` | — | totalFiles, totalSize (String!), fileTypeBreakdown, directoryCount |
| `FileTypeBreakdown` | — | type, count, size (String!) |

### Template Variable Objects (Polymorphic Interface)

| Object Type | Interface | Extra Fields |
|-------------|-----------|--------------|
| `TemplateTextVariable` | `TemplateVariable` | minLength, maxLength, pattern |
| `TemplateNumberVariable` | `TemplateVariable` | minValue, maxValue, decimalPlaces |
| `TemplateDateVariable` | `TemplateVariable` | minDate, maxDate, format |
| `TemplateSelectVariable` | `TemplateVariable` | options, multiple |

### Pagination Wrapper Objects

| Object Type | Key Fields |
|-------------|------------|
| `PageInfo` | count, currentPage, firstItem, lastItem, hasMorePages, lastPage, perPage, total |
| `PaginatedTemplatesResponse` | data: [Template!], pageInfo: PageInfo |
| `StudentsWithFiltersResponse` | data: [Student!]!, pageInfo: PageInfo! |
| `RecipientsWithFiltersResponse` | data: [TemplateRecipient!], pageInfo: PageInfo! |
| `TemplatesWithFiltersResponse` | data: [Template!]!, pageInfo: PageInfo! |

### Config Objects

| Object Type | Key Fields |
|-------------|------------|
| `TemplatesConfig` | key: TemplatesConfigsKey, value: String |
| `TemplatesConfigs` | configs: [TemplatesConfig!] |
| `TemplateCategoryWithParentTree` | id, name, description, order, specialType, parentTree: [Int!]! |

### Auth Objects

| Object Type | Key Fields |
|-------------|------------|
| `LoginResponse` | token: String, user: User |
| `RefreshTokenResponse` | token: String, user: User |

### Interfaces

| Interface | Implementations | Common Fields |
|-----------|-----------------|---------------|
| `StorageObject` | `FileInfo`, `DirectoryInfo` | path, name, isProtected |
| `TemplateVariable` | `TemplateTextVariable`, `TemplateNumberVariable`, `TemplateDateVariable`, `TemplateSelectVariable` | id, name, description, order, required, type, previewValue, createdAt, updatedAt |

---

## 6. Enums

| Enum Name | Values | Source |
|-----------|--------|--------|
| `OrderSortDirection` | `ASC`, `DESC` | `@/lib/enum` |
| `Gender` | `FEMALE`, `MALE`, `OTHER` | `@/lib/enum` |
| `CountryCode` | 247 ISO country codes (AD, AE, ... ZW) | `@/lib/enum` |
| `FileType` | `ARCHIVE`, `AUDIO`, `DOCUMENT`, `IMAGE`, `OTHER`, `VIDEO` | `Types.FileTypes` |
| `FileSortField` | `CREATED`, `MODIFIED`, `NAME`, `SIZE`, `TYPE` | `Types.FileSortField` |
| `ContentType` | `DOC`, `DOCX`, `GIF`, `JPEG`, `MP3`, `MP4`, `PDF`, `PNG`, `RAR`, `TXT`, `WAV`, `WEBP`, `XLS`, `XLSX`, `ZIP` | `Types.FileContentType` |
| `UploadLocationPath` | `TEMPLATE_COVERS` | `Types.UploadLocationPath` |
| `StudentsOrderByColumn` | `ID`, `NAME`, `EMAIL`, `GENDER`, `DATE_OF_BIRTH`, `CREATED_AT`, `UPDATED_AT` | `Types.StudentsOrderByColumn` |
| `TemplatesOrderByColumn` | `NAME`, `ORDER`, `CREATED_AT`, `UPDATED_AT` | `Types.TemplatesOrderByColumn` |
| `TemplateVariableType` | `TEXT`, `NUMBER`, `DATE`, `SELECT` | `templateVariableTypeEnum` (DB enum) |
| `TemplatesConfigsKey` | `ALLOWED_FILE_TYPES`, `MAX_BACKGROUND_SIZE` | `Types.TemplatesConfigsKeyValues` |

### Enum Registration Pattern

CGVS uses `Object.values()` to extract enum values:

```typescript
export const GenderPothosObject = gqlSchemaBuilder.enumType("Gender", {
  values: Object.values(Gender),
});
```

---

## 7. Custom Scalars

### Email Scalar

File: `server/graphql/scalars/emailScalar.ts`

Backed by the `Email` class (`server/lib/email.ts`) which uses the `validator` library's `isEmail()` for validation:

```typescript
export class Email {
  public readonly value: string;
  constructor(value?: string) {
    if (!value || !validator.isEmail(value)) {
      throw new Error(`Invalid email address: ${value}`);
    }
    this.value = value;
  }
}
```

The scalar wraps it:

```typescript
export const EmailScalar = new GraphQLScalarType({
  name: "Email",
  description: "A type representing a validated email address",
  serialize(value: unknown): string | null | undefined {
    if (value instanceof Email) return value.value;
    throw new TypeError(`Cannot serialize value as Email: ${value}`);
  },
  parseValue(value: unknown): Email {
    if (typeof value === "string") {
      try { return new Email(value); }
      catch (err) { throw new TypeError(`Invalid email address: ${value}: ${(err as Error).message}`); }
    }
    throw new TypeError(`Expected string for Email, got: ${typeof value}`);
  },
  parseLiteral(ast): Email { /* similar, checks Kind.STRING */ },
});
```

### PhoneNumber Scalar

File: `server/graphql/scalars/phoneNumberScalar.ts`

Backed by the `PhoneNumber` class (`server/lib/phoneNumber.ts`) which wraps `google-libphonenumber`:

```typescript
export class PhoneNumber {
  public readonly number: string;     // E164 format
  public readonly googlePhoneNumber: GooglePhoneNumber;
  constructor(numberOrGooglePhoneNumber: string | GooglePhoneNumber) { ... }
  public static readonly util = PhoneNumberUtil.getInstance();
}
```

The scalar adds additional validation using `PhoneNumber.util.isValidNumber()`:

```typescript
export const PhoneNumberScalar = new GraphQLScalarType({
  name: "PhoneNumber",
  description: "A type representing a validated phone number",
  serialize(value: unknown): string {
    if (value instanceof PhoneNumber) return value.number;
    throw new TypeError(`Cannot serialize value as PhoneNumber: ${value}`);
  },
  parseValue(value: unknown): PhoneNumber {
    if (typeof value === "string") {
      const phone = new PhoneNumber(value);
      if (PhoneNumber.util.isValidNumber(phone.googlePhoneNumber)) return phone;
      throw new TypeError("Invalid phone number");
    }
    throw new TypeError(`Expected string for PhoneNumber, got: ${typeof value}`);
  },
  parseLiteral(ast): PhoneNumber { /* same pattern */ },
});
```

### Date / DateTime Scalars

Registered from the `graphql-scalars` package:
```typescript
gqlSchemaBuilder.addScalarType("Date", DateResolver, {});
gqlSchemaBuilder.addScalarType("DateTime", DateTimeResolver, {});
```

---

## 8. Auth/Scope Rules

### Scope Auth Configuration

```typescript
scopeAuth: {
  authScopes: ctx => ({
    loggedIn: !!ctx.user,
    admin: !!ctx.roles.includes("admin"),
    role: (role: string) => ctx.roles.includes(role),
  }),
},
```

Three auth scopes are defined:
- `loggedIn: boolean` — checks `ctx.user` exists
- `admin: boolean` — checks `ctx.roles` includes "admin"
- `role: (role: string) => boolean` — checks `ctx.roles` includes specific role

### Where Auth Scopes Are Applied

**Only 3 fields across the entire schema use `authScopes`:**

1. `me` query — `authScopes: { loggedIn: true }`
2. `user(id)` query — `authScopes: { loggedIn: true }`
3. `logout` mutation — `authScopes: { loggedIn: true }`

**Everything else is public.** None of the `admin` or `role` scopes are used anywhere in the schema. The `admin` and `role` scope functions are defined in the builder but never applied to any field.

### Login Flow

The `login` mutation:
1. Receives `LoginInput` `{ email: Email!, password: String! }`
2. Looks up user by email via `UserRepository.findByEmail()`
3. Verifies password with `comparePassword()`
4. Generates access token and refresh token via JWT
5. Creates a session in DB via `SessionRepository.create()`
6. Sets `cgvs_session_id` and `cgvs_refresh_token` as httpOnly cookies (7-day maxAge)
7. Returns `{ token: accessToken, user }`

### Refresh Token Flow

The `refreshToken` mutation:
1. Reads `sessionId` from `cgvs_session_id` cookie and `refreshToken` from `cgvs_refresh_token` cookie (both via context)
2. Tries session-based validation first: `SessionRepository.validate(sessionId)`
3. Falls back to JWT validation: `verifyToken(refreshToken)` with `type === "refresh"`
4. Generates new access + refresh tokens (token rotation)
5. Updates session activity timestamp
6. Rotates both cookies
7. Returns `{ token: newAccessToken, user }`

### Logout Flow

The `logout` mutation (requires `loggedIn`):
1. Deletes all sessions for user: `SessionRepository.deleteByUserId(ctx.user.id)`
2. Clears both cookies via `ctx.cookies.delete()`
3. Returns `true`

---

## 9. DataLoader Usage

The DataLoader plugin is heavily used for batch fetching. CGVS uses three patterns:

### Pattern 1: `loadableObject` — Class-based DataLoader Object

Used for `User`:

```typescript
export const UserPothosObject = gqlSchemaBuilder.loadableObject<
  UserPothosDefintion | Error,
  number,
  [],
  typeof UserPothosObjectRef
>(UserPothosObjectRef, {
  load: async (ids: number[]) => UserRepository.loadByIds(ids),
  sort: user => user.id,
  fields: t => ({ ... }),
});
```

Also used for `TemplateCategory`.

### Pattern 2: `loadableObjectRef` — Ref-based DataLoader Object

Used for `Student` and `Template`:

```typescript
export const StudentPothosObject = gqlSchemaBuilder
  .loadableObjectRef<Types.StudentDto, number>("Student", {
    load: async (ids: number[]) => StudentRepository.loadByIds(ids),
    sort: s => s.id,
  })
  .implement({
    fields: t => ({ ... }),
  });
```

### Pattern 3: `t.loadable()` / `t.loadableList()` — Field-level DataLoaders

Used for relationships between objects:

```typescript
// Template → category (single)
category: t.loadable({
  type: TemplateCategoryPothosObject,
  load: (ids: number[], ctx) => TemplateCategoryPothosObject.getDataloader(ctx).loadMany(ids),
  resolve: template => template.categoryId,
}),

// Template → variables (list)
variables: t.loadableList({
  type: TemplateVariablePothosInterface,
  load: (ids: number[]) => TemplateVariableRepository.loadForTemplates(ids),
  resolve: template => template.id,
}),

// TemplateRecipient → student (single)
student: t.loadable({
  type: StudentPothosObject,
  load: (ids: number[]) => StudentRepository.loadByIds(ids),
  resolve: recipient => recipient.studentId,
}),

// TemplateRecipientGroup → recipients (list)
recipients: t.loadableList({
  type: TemplateRecipientPothosObject,
  load: (ids: number[]) => RecipientRepository.loadForGroups(ids),
  resolve: group => group.id,
}),
```

### DataLoader Dependency Graph

```
User (loadableObject)
  └─ used in LoginResponse.user (via t.loadable)

Student (loadableObjectRef)
  ├─ TemplateRecipient.student (via t.loadable)
  └─ Student.recipientRecords (direct field, NOT loadable)

Template (loadableObjectRef)
  ├─ TemplateCategory.templates (via loadableList)
  ├─ TemplateVariable.template (via t.loadable)
  └─ RecipientGroup.template (via t.loadable)

TemplateCategory (loadableObject)
  ├─ Template.category (via t.loadable)
  ├─ Template.preSuspensionCategory (via t.loadable)
  ├─ TemplateCategory.parentCategory (via t.loadable)
  └─ TemplateCategory.subCategories (via loadableList)
```

**Repository `loadByIds` methods**: UserRepository, StudentRepository, TemplateRepository, TemplateCategoryRepository, RecipientGroupRepository, RecipientRepository all implement `loadByIds(ids: number[])` for DataLoader batching.

---

## 10. Pagination

### Pagination Input

File: `server/graphql/pothos/pagination.objects.ts`

```typescript
export const PaginationArgsDefault = {
  first: 10,
  maxCount: 100,
};

export const PaginationArgsObject = gqlSchemaBuilder
  .inputRef<PaginationArgs>("PaginationArgs")
  .implement({
    fields: t => ({
      first: t.int({ defaultValue: 10 }),
      skip: t.int(),
      last: t.int(),
      page: t.int(),
      maxCount: t.int({ defaultValue: 100 }),
    }),
  });
```

**This is offset-based pagination**, NOT cursor-based. The `first`/`skip`/`page` fields support both offset (`first` + `skip`) and page-number (`page` + `first`) pagination. The `maxCount` limits the maximum results.

### PageInfo Response

```typescript
export const PageInfoObject = PageInfoRef.implement({
  fields: t => ({
    count: t.exposeInt("count", { nullable: false }),         // items on current page
    currentPage: t.exposeInt("currentPage", { nullable: false }),
    firstItem: t.exposeInt("firstItem", { nullable: true }),
    lastItem: t.exposeInt("lastItem", { nullable: true }),
    hasMorePages: t.exposeBoolean("hasMorePages", { nullable: false }),
    lastPage: t.exposeInt("lastPage", { nullable: false }),    // total pages
    perPage: t.exposeInt("perPage", { nullable: false }),
    total: t.exposeInt("total", { nullable: false }),         // total items
  }),
});
```

All pagination responses follow the same pattern:
```typescript
{
  data: [...items],
  pageInfo: { count, currentPage, firstItem, lastItem, hasMorePages, lastPage, perPage, total }
}
```

### Pagination Usage

| Query/Mutation | Pagination Input | Pagination Response |
|----------------|-----------------|---------------------|
| `students` | `paginationArgs: PaginationArgs` | `StudentsWithFiltersResponse` |
| `studentsInRecipientGroup` | `paginationArgs: PaginationArgs` | `StudentsWithFiltersResponse` |
| `studentsNotInRecipientGroup` | `paginationArgs: PaginationArgs` | `StudentsWithFiltersResponse` |
| `recipientsByGroupIdFiltered` | `paginationArgs: PaginationArgs` | `RecipientsWithFiltersResponse` |
| `templates` | `pagination: PaginationArgs` | `PaginatedTemplatesResponse` |
| `templatesByCategoryId` | `paginationArgs: PaginationArgs` | `TemplatesWithFiltersResponse` |

### Storage Pagination (Different Pattern)

Storage uses a simpler offset/limit pattern:
```typescript
type StorageObjectList {
  items: [StorageObject!]
  totalCount: Int!
  hasMore: Boolean!
  offset: Int!
  limit: Int!
}
```

---

## 11. Certificate-Specific API

### What's Present

CGVS does **not** have explicit certificate generation, certificate listing, or certificate verification queries/mutations. The certificate system is built around **templates** and **recipient groups**:

| Concept | CGVS Equivalent | Notes |
|---------|----------------|-------|
| Certificate Template | `Template` + `TemplateCategory` | Templates define the certificate design |
| Certificate Variables | `TemplateVariable` (TEXT/NUMBER/DATE/SELECT) | Typed variables for template customization |
| Certificate Recipients | `TemplateRecipient` + `TemplateRecipientGroup` | Groups of students organized by template |
| Certificate Categories | `TemplateCategory` (hierarchical) | Categories with parent-child tree |
| Template Suspension | `suspendTemplate` / `unsuspendTemplate` | Soft-disable templates |
| Template Config | `templatesConfigs` | Configurable settings (ALLOWED_FILE_TYPES, MAX_BACKGROUND_SIZE) |

### Certificate Workflow (Inferred)

1. **Create Template Category** → `createTemplateCategory` (hierarchical via `parentCategoryId`)
2. **Create Template** → `createTemplate` with `name`, `description`, `categoryId`
3. **Define Variables** → `createTemplateTextVariable`, `createTemplateNumberVariable`, `createTemplateDateVariable`, `createTemplateSelectVariable`
4. **Upload Template Image** → `generateUploadSignedUrl` for template cover image
5. **Create Recipient Group** → `createTemplateRecipientGroup` with `templateId`, `name`, `date`
6. **Assign Recipients** → `createRecipient` (single) or `createRecipients` (batch with `studentIds`)
7. **Query Students** → `studentsInRecipientGroup` / `studentsNotInRecipientGroup` for group management
8. **Suspend/Unsuspend** → `suspendTemplate` / `unsuspendTemplate`

### What's Missing (No certificate generation/listing/verification)

- No `generateCertificate` mutation
- No `certificates` query for listing generated certificates
- No `verifyCertificate` query for public verification
- No `Certificate` object type
- No certificate issuance/delivery tracking
- No PDF generation endpoint

The API covers template management and recipient organization but stops short of certificate generation/issuance.

---

## 12. Error Handling

### Pothos Errors Plugin

Configured in the builder:
```typescript
errors: {
  defaultTypes: [],
  onResolvedError: error => logger.error("Handled error:", error),
},
```

The `ErrorsPlugin` is registered but `defaultTypes` is empty. The `onResolvedError` callback logs resolved errors.

### GraphQLError Throwing Pattern

CGVS throws `GraphQLError` directly in resolvers with `extensions.code`:

```typescript
// Invalid credentials
throw new GraphQLError("Invalid email or password", {
  extensions: { code: "INVALID_CREDENTIALS" },
});

// No auth session
throw new GraphQLError("No authentication session found", {
  extensions: { code: "UNAUTHENTICATED" },
});

// Invalid token
throw new GraphQLError("Invalid session or refresh token", {
  extensions: { code: "INVALID_TOKEN" },
});
```

### Error Codes Used

| Code | Where Used | Context |
|------|-----------|---------|
| `INVALID_CREDENTIALS` | `login` mutation | Wrong email/password |
| `UNAUTHENTICATED` | `refreshToken` mutation | No session/refresh token |
| `INVALID_TOKEN` | `refreshToken` mutation | Invalid session or refresh token |
| `RATE_LIMIT_EXCEEDED` | GraphQL endpoint (HTTP layer) | Rate limiting (in HTTP response, not GraphQL layer) |

### Apollo Server Error Configuration

```typescript
const server = new ApolloServer({
  schema: graphQLSchema,
  hideSchemaDetailsFromClientErrors: isProduction,
  includeStacktraceInErrorResponses: !isProduction,
  csrfPrevention: {
    requestHeaders: ["x-apollo-operation-name", "apollo-require-preflight", "x-csrf-token"],
  },
  introspection: !isProduction,
  persistedQueries: { cache: cache, ttl: null },
});
```

### No i18n for Errors

CGVS error messages are **hardcoded English strings**. There is no localization/translation system for error messages. This contrasts with siraj's approach where errors must use `ctx.t("namespace")`.

---

## 13. GraphQL Endpoint & Client

### Server Endpoint

File: `app/api/graphql/route.ts`

- Uses `@apollo/server` with `@as-integrations/next` integration
- Custom `withRateLimit` wrapper for both POST and GET handlers
- Rate limiting returns HTTP 429 with `RATE_LIMIT_EXCEEDED` extension code
- CORS handled via OPTIONS handler
- HEAD handler for health checks
- Production: landing page disabled, stack traces hidden
- Development: Apollo Sandbox landing page, stack traces shown
- CSRF prevention enabled with multiple header checks
- Persisted queries with custom `ApolloCacheAdapter`

### Client Service

File: `client/graphql/service/index.tsx`

Thin wrapper utilities for Apollo hooks:
```typescript
export function useLazyQueryWrapper<T, V>(lazyQueryResult) { ... }
export function useMutationWrapper<T, V>(mutationResult) { ... }
```

### Client Documents

File: `client/graphql/sharedDocuments/auth.documents.ts`

Uses `TypedDocumentNode` with codegen-generated types:
```typescript
export const meQueryDocumetn: TypedDocumentNode<Graphql.MeQuery> = gql`
  query me { me { id name email emailVerifiedAt createdAt updatedAt } }
`;
export const loginMutationDocument: TypedDocumentNode<Graphql.LoginMutation, Graphql.MutationLoginArgs> = gql`
  mutation login($input: LoginInput!) { login(input: $input) { token user { id name email } } }
`;
```

Only auth documents exist in `sharedDocuments/`. Other domain documents are not present (likely frontend pages use inline queries or a different pattern).

### Client Utils

File: `client/graphql/utils.ts`

Uses `@apollo/client/react` imports for hooks. Notably **uses `useLazyQuery`** which siraj prohibits.

---

## 14. Comparison: CGVS vs Siraj Pothos Patterns

### Builder Configuration

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Plugins | 8 plugins (no Directives) | 9 plugins (adds **DirectivesPlugin** for `@constraint`) |
| Auth scopes | 3 scopes: `loggedIn`, `admin`, `role` | 5 scopes: `loggedIn`, `permission`, `superAdmin`, `notImpersonating`, `notSimulatingGroup` |
| Auth scope eval | **Synchronous** | **Async** (queries `PermissionsService.getUserContext`) |
| Custom scalars | `DateTime`, `Date`, `Email`, `PhoneNumber` | `DateTime`, `Date`, `Email`, `PhoneNumber`, **`JSON`, `StringMap`, `LocalizedString`** |
| Directives | None | `@constraint` directive for input validation |
| HMR | Not handled | `SchemaBuilder.allowPluginReRegistration = true` + HMR edge imports |
| Unauthorized error | Default Pothos behavior | Custom `unauthorizedError` returning `UNAUTHENTICATED` vs `FORBIDDEN` |

### Context

| Aspect | CGVS | Siraj |
|--------|------|-------|
| User in context | `{ id: number }` — minimal | Full user object with permissions |
| Roles | `string[]` of role names | `AppPermission[]` — typed permission keys |
| Locale | ❌ Not in context | ✅ `ctx.locale` — locale propagation |
| Translation | ❌ Not available | ✅ `ctx.t("namespace")` — bound translation function |
| Impersonation | ❌ Not supported | ✅ `ctx.isImpersonating`, `ctx.actorUserId` |
| Session | DB-backed sessions (`sessionId` in cookie) | (Different auth architecture) |

### Auth Coverage

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Auth-protected queries | 3 of 31 (`me`, `user`, `users`) | Likely most/all queries |
| Auth-protected mutations | 1 of 39 (`logout`) | Likely most/all mutations |
| Permission system | Simple role strings, mostly unused | Full `AppPermission` enum, per-field permission checks |
| Scope usage | Only `loggedIn` used | `loggedIn`, `permission`, `superAdmin`, `notImpersonating`, `notSimulatingGroup` |

### Type Definitions

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Type source | `server/types/` with entity interfaces | `backend/types/` with `SelectType`, `InsertType`, `ReturnType`, `SubmitInput` |
| Local types in Pothos | ✅ Some (e.g., `RecipientsWithFiltersPothosObject` inline type) | ❌ Prohibited — must use `backend/types/` |
| Input args casting | `args.input as unknown as Types.StudentCreateInput` | Direct typed usage from canonical types |

### Enum Registration

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Pattern | `gqlSchemaBuilder.enumType("Name", { values: Object.values(Enum) })` — string-based | `gqlSchemaBuilder.enumType(MyEnum, { name: "MyEnum" })` — enum-object form |
| Location | Spread across `enum.pothos.ts` and domain files | Centralized in `shared/enum.pothos.ts` |
| Source | Mix of `@/lib/enum`, `Types.*`, DB enum | `backend/enum/` — real TypeScript enums |

### Error Handling

| Aspect | CGVS | Siraj |
|--------|------|-------|
| i18n for errors | ❌ Hardcoded English strings | ✅ `ctx.t("errors")` — localized error messages |
| Error codes | `INVALID_CREDENTIALS`, `UNAUTHENTICATED`, `INVALID_TOKEN` | Likely `UNAUTHENTICATED`, `FORBIDDEN` + domain-specific |
| Constraint validation | ❌ None | ✅ `@constraint` directive with Apollo validation plugin |

### DataLoader

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Pattern | `loadableObject`, `loadableObjectRef`, `t.loadable`, `t.loadableList` | Same Pothos DataLoader plugin |
| Repository support | `loadByIds(ids: number[])` returning arrays | `findBy{Key}Ids(ids: string[])` returning `Map<string, T \| null>` |
| Sort | `sort: item => item.id` | Likely similar |

### Pagination

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Type | Offset-based (`first`, `skip`, `page`, `maxCount`) | Similar `PageInfo` pattern in `shared/pagination.objects.ts` |
| PageInfo | Full metadata (total, lastPage, currentPage, hasMorePages, etc.) | Check `shared/pagination.objects.ts` for comparison |
| Filter system | Rich `StudentFilterArgs` with 30+ operand types (equals, notEquals, startsWith, endsWith, isEmpty, date ranges) | TBD |

### GraphQL Endpoint

| Aspect | CGVS | Siraj |
|--------|------|-------|
| Server | Apollo Server 4 + `@as-integrations/next` | Same stack |
| Rate limiting | Custom `withRateLimit` wrapper in route handler | TBD |
| CSΡF prevention | Enabled with 3 custom headers | TBD |
| Persisted queries | Enabled with custom `ApolloCacheAdapter` | TBD |
| Client hook imports | `@apollo/client/react` — uses `useLazyQuery` | `@apollo/client/react` — **`useLazyQuery` prohibited**, use stateful `useQuery` |

---

## Key Takeaways for Siraj Certification Feature

1. **Template + TemplateVariable architecture**: CGVS's polymorphic `TemplateVariable` interface (TEXT/NUMBER/DATE/SELECT) is a clean pattern for certificate template variables. Siraj should implement similar typed variables.

2. **Recipient Groups**: The `TemplateRecipientGroup` → `TemplateRecipient` → `Student` hierarchy is the core organizing structure for certificate issuance batches.

3. **Missing certificate generation**: CGVS stops at template+recipient management. Siraj needs to add: `generateCertificate` mutation, `certificates` query, `verifyCertificate` query, and a `Certificate` object type.

4. **Auth gaps**: CGVS has minimal auth coverage. Siraj must apply proper `permission` scopes from the start, using siraj's `AppPermission` enum system.

5. **i18n essential**: All error messages in siraj must use `ctx.t("errors")` — CGVS's hardcoded strings violate siraj's i18n requirements.

6. **Canonical types**: Siraj must define types in `backend/types/` and import them into Pothos files — no local type definitions (CGVS's inline types like `RecipientsWithFiltersPothosObject` would be prohibited).

7. **Enum pattern**: Siraj must use the enum-object form (`gqlSchemaBuilder.enumType(MyEnum, { name: "MyEnum" })`) from `backend/enum/`, not the `Object.values()` string form CGVS uses.

8. **Template suspension**: The `suspendTemplate`/`unsuspendTemplate` pattern is useful for certificate template lifecycle management.

9. **Template category hierarchy**: The hierarchical `TemplateCategory` with `parentCategory`/`subCategories` (self-referencing via DataLoader) and `TemplateCategoryWithParentTree` for search results is a solid pattern for organizing certificate types.

10. **Storage integration**: Template image upload via signed URL (`generateUploadSignedUrl`) + `FileInfo`/`DirectoryInfo` GraphQL types — siraj already has storage infrastructure that can be leveraged.
