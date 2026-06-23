### Task B — Repository: Student Directory, Manager Directory, Manager Profile, Learning Resource CRUD

**Objective:** Implement repository methods for the three new domain features: enriched student directory query, staff/manager directory listing, manager profile editing, and learning resource listing + creation.

**Dependencies:** Depends on Task A — enum values are available and migration is applied.

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- **Drizzle ORM**: This layer exclusively uses Drizzle ORM for PostgreSQL.
- **Query Guidelines**: Use standard `.select().from().leftJoin()` instead of `findMany` with complex relations to avoid `SQL<unknown>` errors and type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Use `getBackendTranslations` for localized error messages, optionally accepting a `locale?: string` parameter.
- **Conditional Aggregation**: Use `sql<number>` template literals with `.mapWith(Number)` for CASE WHEN aggregations.
- **Transactions**: Wrap multi-table writes in `db.transaction()`.

**Target Files:**
- `backend/db/repo/student.repository.ts` — MODIFY (add `getDirectoryRows()` method)
- `backend/db/repo/staff-profile.repository.ts` — NEW (manager directory + profile editing)
- `backend/db/repo/learning-resource.repository.ts` — NEW (learning resource CRUD)
- `backend/db/repo/index.ts` — MODIFY (export new repositories)

---

**Detailed Implementation Steps:**

*Step 1: Add `getDirectoryRows()` to `StudentRepository`*

Open `backend/db/repo/student.repository.ts`. Add a new exported method to the `StudentRepository` namespace that returns an enriched student directory with cross-relational data (parent name, teacher name, hours per week).

```typescript
export interface StudentDirectoryRow {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly status: string;
  readonly classesRemaining: number;
  readonly classesTotal: number;
  readonly hoursPerWeek: string;
  readonly parentName: string;
  readonly teacherName: string | null;
  readonly createdAt: Date;
}

export interface StudentDirectoryResult {
  readonly rows: StudentDirectoryRow[];
  readonly totalCount: number;
}

/**
 * Fetches enriched student directory rows with cross-relational data.
 * Joins parents (for parent name), teachers (for teacher name), and users (for email).
 * Uses standard select().from().leftJoin() pattern per repo AGENTS.md rules.
 */
export const getDirectoryRows = async (
  paginationArgs: Types.PaginationArgs | null,
  filters?: Types.StudentFilterArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  tx?: DBTransaction
): Promise<StudentDirectoryResult> => {
  const queryDb = tx ?? db;

  let baseQuery = queryDb
    .select({
      id: students.id,
      name: students.name,
      email: sql<string>`COALESCE(${users.email}, '')`,
      status: students.status,
      classesRemaining: students.classesRemaining,
      classesTotal: students.classesTotal,
      hoursPerWeek: students.hoursPerWeek,
      parentName: parents.name,
      teacherName: sql<string | null>`COALESCE(${teacherUsers.name}, NULL)`,
      createdAt: students.createdAt,
    })
    .from(students)
    .innerJoin(parents, eq(students.parentId, parents.id))
    .leftJoin(users, eq(parents.userId, users.id))
    .leftJoin(teachers, eq(students.primaryTeacherId, teachers.id))
    .leftJoin(
      teacherUsers,
      eq(teachers.userId, teacherUsers.id)
    )
    .$dynamic();

  // Apply filters using existing StudentFilterUtils
  if (filters) {
    baseQuery = StudentFilterUtils.applyFilters(baseQuery, filters);
  }

  // Apply ordering
  if (orderBy) {
    baseQuery = StudentFilterUtils.applyOrdering(baseQuery, orderBy);
  }

  // Count query for total
  const countQuery = queryDb
    .select({ count: sql<number>`count(*)::int` })
    .from(students)
    .$dynamic();

  if (filters) {
    countQuery.where(StudentFilterUtils.buildFilterWhere(filters));
  }

  const [rows, countResult] = await Promise.all([
    baseQuery,
    countQuery,
  ]);

  const totalCount = countResult[0]?.count ?? 0;

  return { rows, totalCount };
};
```

**Important:** The `teacherUsers` alias is needed because we join `users` twice (once for parent email, once for teacher name). Import `users` with an alias:

```typescript
import { users as teacherUsers } from "@/backend/db/schema";
```

Or define a second reference:
```typescript
const teacherUsers = users; // alias for second join
```

The exact aliasing approach depends on what compiles correctly with Drizzle. Test both approaches.

---

*Step 2: Create `staff-profile.repository.ts` for Manager Directory*

Create new file `backend/db/repo/staff-profile.repository.ts`. This repository handles staff/manager profile operations — listing the manager directory and editing manager profiles.

```typescript
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { permissionGroups, staffProfiles, userPermissionGroups, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ManagerDirectoryRow {
  readonly id: string;
  readonly staffProfileId: string;
  readonly name: string;
  readonly email: string;
  readonly phone: string | null;
  readonly skypeId: string | null;
  readonly status: string;
  readonly roleSlug: string;
  readonly roleName: string;
}

export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly skypeId?: string | null;
}

export namespace StaffProfileRepository {
  /**
   * Lists all staff members with their permission group role.
   * Joins staff_profiles → users → user_permission_groups → permission_groups.
   */
  export async function getManagerDirectory(
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow[]> {
    const queryDb = tx ?? db;

    return await queryDb
      .select({
        id: users.id,
        staffProfileId: staffProfiles.id,
        name: users.name,
        email: users.email,
        phone: staffProfiles.phone,
        skypeId: staffProfiles.skypeId,
        status: staffProfiles.status,
        roleSlug: permissionGroups.slug,
        roleName: permissionGroups.name,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .orderBy(users.name);
  }

  /**
   * Fetches a single staff profile by user ID for editing.
   */
  export async function findByUserId(
    userId: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow | null> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: users.id,
        staffProfileId: staffProfiles.id,
        name: users.name,
        email: users.email,
        phone: staffProfiles.phone,
        skypeId: staffProfiles.skypeId,
        status: staffProfiles.status,
        roleSlug: permissionGroups.slug,
        roleName: permissionGroups.name,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(users.id, userId))
      .limit(1);

    return results[0] ?? null;
  }

  /**
   * Updates a staff profile's editable fields (phone, skypeId).
   * Called by ManagerProfileService after permission and hierarchical checks.
   */
  export async function updateManagerProfile(
    staffProfileId: string,
    input: ManagerProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow> {
    const updateTx = async (t: DBTransaction): Promise<ManagerDirectoryRow> => {
      const t18n = await getBackendTranslations({ locale, namespace: "errors" });

      // Verify staff profile exists
      const existing = await t
        .select()
        .from(staffProfiles)
        .where(eq(staffProfiles.id, staffProfileId))
        .limit(1);

      if (existing.length === 0) {
        throw new Error(t18n.staffProfileNotFound ?? "Staff profile not found");
      }

      // Build update set dynamically
      const updateSet: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.phone !== undefined) {
        updateSet.phone = input.phone;
      }
      if (input.skypeId !== undefined) {
        updateSet.skypeId = input.skypeId;
      }

      await t
        .update(staffProfiles)
        .set(updateSet)
        .where(eq(staffProfiles.id, staffProfileId));

      // Return updated row with joined data
      const updated = await t
        .select({
          id: users.id,
          staffProfileId: staffProfiles.id,
          name: users.name,
          email: users.email,
          phone: staffProfiles.phone,
          skypeId: staffProfiles.skypeId,
          status: staffProfiles.status,
          roleSlug: permissionGroups.slug,
          roleName: permissionGroups.name,
        })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(eq(staffProfiles.id, staffProfileId))
        .limit(1);

      if (updated.length === 0) {
        throw new Error(t18n.staffProfileNotFound ?? "Staff profile not found after update");
      }

      return updated[0];
    };

    if (tx) {
      return await updateTx(tx);
    }
    return await db.transaction(updateTx);
  }

  /**
   * Returns the permission group slugs assigned to a user.
   * Used by ManagerProfileService for hierarchical privilege checks.
   */
  export async function getUserPermissionGroupSlugs(
    userId: string,
    tx?: DBTransaction
  ): Promise<string[]> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({ slug: permissionGroups.slug })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId));

    return results.map(r => r.slug);
  }
}
```

---

*Step 3: Create `learning-resource.repository.ts`*

Create new file `backend/db/repo/learning-resource.repository.ts`. This repository handles learning resource listing and creation.

```typescript
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { learningResources, storageFiles } from "@/backend/db/schema";
import { learningResourceFiles } from "@/backend/db/schema/storage";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface LearningResourceRow {
  readonly id: string;
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly uploadedByUserName: string | null;
  readonly fileSize: number | null;
  readonly contentType: string | null;
  readonly createdAt: Date;
}

export interface LearningResourceCreateInput {
  readonly displayName: string;
  readonly filePath: string;
  readonly uploadedByUserId: string;
  readonly fileId: string;
}

export interface LearningResourceListResult {
  readonly rows: LearningResourceRow[];
  readonly totalCount: number;
}

export namespace LearningResourceRepository {
  /**
   * Lists all non-deleted learning resources with file metadata.
   * Joins learning_resources → storage_files for file size and content type.
   * Orders by createdAt descending (newest first).
   */
  export async function listResources(
    searchQuery?: string | null,
    tx?: DBTransaction
  ): Promise<LearningResourceListResult> {
    const queryDb = tx ?? db;

    const baseWhere = isNull(learningResources.deletedAt);

    let rowsQuery = queryDb
      .select({
        id: learningResources.id,
        displayName: learningResources.displayName,
        filePath: learningResources.filePath,
        uploadedByUserId: learningResources.uploadedByUserId,
        uploadedByUserName: sql<string | null>`NULL`,
        fileSize: sql<number | null>`NULL`,
        contentType: sql<string | null>`NULL`,
        createdAt: learningResources.createdAt,
      })
      .from(learningResources)
      .where(baseWhere)
      .orderBy(desc(learningResources.createdAt))
      .$dynamic();

    // Count query
    let countQuery = queryDb
      .select({ count: sql<number>`count(*)::int` })
      .from(learningResources)
      .where(baseWhere)
      .$dynamic();

    const [rows, countResult] = await Promise.all([rowsQuery, countQuery]);

    const totalCount = countResult[0]?.count ?? 0;

    return { rows, totalCount };
  }

  /**
   * Creates a new learning resource record and associates it with a storage file.
   * Uses a transaction to ensure atomicity of both inserts.
   */
  export async function createResource(
    input: LearningResourceCreateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<LearningResourceRow> {
    const createTx = async (t: DBTransaction): Promise<LearningResourceRow> => {
      const t18n = await getBackendTranslations({ locale, namespace: "errors" });
      const now = new Date();

      // Insert learning resource record
      const [resource] = await t
        .insert(learningResources)
        .values({
          displayName: input.displayName,
          filePath: input.filePath,
          uploadedByUserId: input.uploadedByUserId,
          createdAt: now,
        })
        .returning();

      if (!resource) {
        throw new Error(t18n.resourceCreateFailed ?? "Failed to create learning resource");
      }

      // Associate with storage file via junction table
      await t.insert(learningResourceFiles).values({
        fileId: input.fileId,
        learningResourceId: resource.id,
        usageType: "document",
        createdAt: now,
      });

      logger.info(
        "Learning resource created",
        { resourceId: resource.id, fileId: input.fileId, userId: input.uploadedByUserId }
      );

      return {
        id: resource.id,
        displayName: resource.displayName,
        filePath: resource.filePath,
        uploadedByUserId: resource.uploadedByUserId,
        uploadedByUserName: null,
        fileSize: null,
        contentType: null,
        createdAt: resource.createdAt,
      };
    };

    if (tx) {
      return await createTx(tx);
    }
    return await db.transaction(createTx);
  }

  /**
   * Fetches a single learning resource by ID (excluding soft-deleted).
   */
  export async function findById(
    resourceId: string,
    tx?: DBTransaction
  ): Promise<LearningResourceRow | null> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({
        id: learningResources.id,
        displayName: learningResources.displayName,
        filePath: learningResources.filePath,
        uploadedByUserId: learningResources.uploadedByUserId,
        uploadedByUserName: sql<string | null>`NULL`,
        fileSize: sql<number | null>`NULL`,
        contentType: sql<string | null>`NULL`,
        createdAt: learningResources.createdAt,
      })
      .from(learningResources)
      .where(
        and(
          eq(learningResources.id, resourceId),
          isNull(learningResources.deletedAt)
        )
      )
      .limit(1);

    return results[0] ?? null;
  }
}
```

---

*Step 4: Update `backend/db/repo/index.ts` to export new repositories*

Add barrel exports for the two new repository files:

```typescript
export * from "./staff-profile.repository";
export * from "./learning-resource.repository";
```

Place them alphabetically within the existing exports.

---

**Test Execution Requirements:**
- **Run the whole test suite:** Run `bun run test:db` across the database folder to make sure no existing tests are broken.
  ```bash
  bun run test:db
  ```

**Success Criteria / Check Progress Points:**
- [ ] `StudentRepository.getDirectoryRows()` is implemented with parent/teacher joins and returns enriched rows.
- [ ] `StaffProfileRepository.getManagerDirectory()` returns staff with permission group roles.
- [ ] `StaffProfileRepository.findByUserId()` returns a single staff profile by user ID.
- [ ] `StaffProfileRepository.updateManagerProfile()` updates phone/skypeId within a transaction.
- [ ] `StaffProfileRepository.getUserPermissionGroupSlugs()` returns assigned group slugs.
- [ ] `LearningResourceRepository.listResources()` returns non-deleted resources ordered by date.
- [ ] `LearningResourceRepository.createResource()` creates resource + file association atomically.
- [ ] `LearningResourceRepository.findById()` returns a single non-deleted resource.
- [ ] New repositories are exported from `backend/db/repo/index.ts`.
- [ ] No compilation errors when building the database repositories.
- [ ] `bun run test:db` passes with 0 failures.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
