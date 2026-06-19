    # Permission Management — Implementation Plan

    ---

    ## Section 0: Story Metadata & Context

    - **Plan file:** `.ai/plan/permission_management.md`
    - **UX Design prompt:** `.ai/plan/permission_management_ux.md`
    - **Permission catalog:** `backend/db/seeds/permission-catalog.ts`
    - **DB schema:** `backend/db/schema/permissions.ts`
    - **Shared enums:** `shared/lib/enum.ts` (`AppPermission`, `SystemPermissionGroupSlug`)
    - **Existing service:** `backend/services/auth/permissions.service.ts`
    - **Existing seeder:** `backend/db/seeds/seed-permissions.ts`
      - SuperAdmin browses all permissions grouped by category.
    - **Story scope:**
      - SuperAdmin creates, edits, deletes custom permission groups.
      - SuperAdmin assigns/revokes permission groups from users.
      - System groups (`isSystem = true`) are immutable and read-only.
    - **Required permissions:**
      - `permission_groups.manage` → `AppPermission.PERMISSION_GROUPS_MANAGE`
      - `permission_groups.assign` → `AppPermission.PERMISSION_GROUPS_ASSIGN`
    - **Status:** Planning — awaiting UX design before Task G.

    ---

    ## Section 1: Core Principles & Strict Rules

    ### 1.1 Service Layer Architecture
    - [ ] NO monolithic services — `PermissionManagementService` is separate from read-only
  `PermissionsService`.
    - [ ] Business logic, validation, permission checks → services only, NOT repositories or
  resolvers.
    - [ ] Read/Write separation enforced.

    ### 1.2 Type Safety
    - [ ] BANNED: `any`, `as any`, `as unknown as`. Use Drizzle inferred types.
    - [ ] No route param casts — use `typeof params?.id === "string" ? params.id : ""`

    ### 1.3 Zero Incomplete Implementation Policy

    | Prohibited | Required | Verification |
    |---|---|---|
    | `// TODO`, `// FIXME` | Fully working implementation | `rg -i "TODO\|FIXME" backend frontend` |
    | `throw new Error("Not implemented")` | Complete method | Code review |
    | Mock data left in production path | Real `useQuery` with Apollo hooks | Code review |

    ### 1.4 System Group Protection
    - [ ] Groups where `isSystem = true` cannot be deleted or have slug/name changed.
    - [ ] UI renders system groups read-only with a "System" badge.
    - [ ] Custom group deletion requires a confirmation dialog. Cascades via FK.

    ### 1.5 i18n Compliance
    - [ ] Backend errors: `getBackendTranslations({ locale, namespace })`.
    - [ ] Frontend: `useTranslations("dashboard.permissions")` from `next-intl`.
    - [ ] Keys in `shared/messages/en.ts` AND `shared/messages/ar/` — NOT `frontend/locales/`.

    ---

    ## Section 2: RBAC Permissions (Canonical)

    | Permission Key | Enum | UI Gate | Backend Guard | GraphQL Ops |
    |---|---|---|---|---|
    | `permission_groups.manage` | `AppPermission.PERMISSION_GROUPS_MANAGE` | Full page +
  create/edit/delete groups | `requireManageAccess()` | `createPermissionGroup`,
  `updatePermissionGroup`, `deletePermissionGroup` |
    | `permission_groups.assign` | `AppPermission.PERMISSION_GROUPS_ASSIGN` | Assign group to user |
  `requireAssignAccess()` | `assignPermissionGroupToUser`, `revokePermissionGroupFromUser` |

    > **SuperAdmin bypass:** `isSuperAdmin = true` bypasses all permission checks — consistent with
  `PermissionsService.getUserContext()`.

    ---

    ## Section 3: Data Model & State Diagram

    ### 3.1 Existing Tables (No New Migrations Required)

    All four tables are already defined in `backend/db/schema/permissions.ts`:


  permissions
  id          UUID PK
  key         AppPermission (unique)
  resource    varchar(100)
  action      varchar(100)
  description text
  category    varchar(100)
  isSystem    boolean DEFAULT true

  permissionGroups
  id                UUID PK
  name              varchar(255) UNIQUE
  slug              varchar(100) UNIQUE
  description       text nullable
  isSystem          boolean DEFAULT false
  createdByUserId   UUID FK → users.id (set null on delete)
  createdAt         timestamp
  updatedAt         timestamp
  groupPermissions  (join — PK: groupId + permissionId)
  groupId       UUID FK → permissionGroups.id (cascade delete)
  permissionId  UUID FK → permissions.id (cascade delete)

  userPermissionGroups  (join — PK: userId + groupId)
  userId            UUID FK → users.id (cascade delete)
  groupId           UUID FK → permissionGroups.id (cascade delete)
  assignedAt        timestamp
  assignedByUserId  UUID FK → users.id (set null on delete)


    ### 3.2 Permission Group State Diagram

    ```mermaid
    stateDiagram-v2
      [*] --> CustomGroup : SuperAdmin creates group
      CustomGroup --> CustomGroup : Edit name/description/permissions
      CustomGroup --> Assigned : Assign to user(s)
      Assigned --> CustomGroup : Revoke from all users
      CustomGroup --> [*] : Delete (cascade)
      SystemGroup --> SystemGroup : Read-only (immutable)

  ### 3.3 Permission Hierarchy
    PERMISSION_CATALOG (seeded, read-only)
        ↓ selected subset assigned to
    PermissionGroup (custom or system)
        ↓ assigned via userPermissionGroups
    User
        ↓ checked at runtime
    PermissionsService.getUserContext(userId)
  ──────
  ## Section 4: Security Threat Remediation

  ### Threat 1: Unauthorized Group Mutation

  Risk: Non-SuperAdmin modifies permission groups.
  Fix:  requireManageAccess()  called before every mutation resolver.
    async function requireManageAccess(actorUserId: string, locale?: string): Promise<void> {
      const context = await PermissionsService.getUserContext(actorUserId);
      if (!context.isSuperAdmin && !(context.permissions as string[]).includes(AppPermission.
  PERMISSION_GROUPS_MANAGE)) {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        throw new Error(t("unauthorized"));
      }
    }

  ### Threat 2: System Group Deletion
  Risk: Deleting  teacher_default  breaks all teacher users.
  Fix:  deleteGroup()  checks  isSystem  before any delete.

    if (group.isSystem) throw new Error(t("permission_groups.cannotDeleteSystem"));

  ### Threat 3: Self-Demotion via Group Removal

  Risk: SuperAdmin loses access by revoking their own group.
  Fix:  revokeGroupFromUser()  blocks ops on SuperAdmin targets.

    if (targetUser.isSuperAdmin) throw new Error(t("permission_groups.cannotModifySuperAdmin"));

  ### Threat 4: IDOR on Group Assignment
  Risk: Unauthorized cross-user group manipulation.
  Fix: All assignment ops verify  actorUserId  has  permission_groups.assign .  actorUserId  always
  from  ctx.userId .
  ──────
  ## Section 5: Prerequisites Verification (BLOCKING)
  [ ]  bun run generate:gqlSchema && bun codegen  — confirm  PermissionGroupsManage  and
  PermissionGroupsAssign  in generated types.
  [ ] DB tables exist:  permissionGroups ,  groupPermissions ,  userPermissionGroups  in
  backend/db/schema/permissions.ts  ✓.
  [ ] Seed creates 5 system groups:  super_admin ,  academy_admin ,  teacher_default ,
  parent_default ,  staff_default .
  [ ] Enum values confirmed in  shared/lib/enum.ts  lines 457–458 ✓.
  [ ]  bun tsgo  — zero TypeScript errors before starting.
  [ ]  bun test  — zero failing tests before starting.
  ──────
  ## Section 6: Granular Task Breakdown
  ──────
  ### Task A — Repository: Permission Management Data Access

  Objective: Create  backend/db/repo/permission-management.repository.ts  — sole data-access layer
  for all CRUD ops and user assignment.

  Rules (from  backend/db/repo/AGENTS.md ):

  •  db.select().from().leftJoin()  only — NO relational  findMany  (avoids  SQL<unknown> ).
  • All multi-table writes in  db.transaction() .
  • Accept  locale?: string , use  getBackendTranslations  for errors. No  any .

  Target Files:

  •  backend/db/repo/permission-management.repository.ts  (new)
  •  backend/db/repo/index.ts  (add export)
  •  backend/types/  (add new entity types)

  Step 1: Entity types to add in  backend/types/

    export type PermissionRow = typeof import("@/backend/db/schema").permissions.$inferSelect;
    export type PermissionGroupEntity = typeof import("@/backend/db/schema").permissionGroups.
  $inferSelect;
    export type GroupPermissionRow = typeof import("@/backend/db/schema").groupPermissions.
  $inferSelect;
    export type UserPermissionGroupRow = typeof import("@/backend/db/schema").userPermissionGroups.
  $inferSelect;
    export type PermissionGroupWithPermissionsEntity = PermissionGroupEntity & { permissionIds:
  string[] };

  Step 2: File header

    // backend/db/repo/permission-management.repository.ts
    import { and, eq } from "drizzle-orm";
    import { db } from "@/backend/db/drizzleDb";
    import {
      groupPermissions,
      permissionGroups,
      permissions,
      userPermissionGroups,
    } from "@/backend/db/schema";
    import { getBackendTranslations } from "@/backend/lib/intl";
    import type {
      PermissionGroupEntity,
      PermissionGroupWithPermissionsEntity,
      PermissionRow,
    } from "@/backend/types";

  Step 3:  listAllPermissions()

    export namespace PermissionManagementRepository {
      export async function listAllPermissions(): Promise<PermissionRow[]> {
        return await db
          .select({
            id: permissions.id,
            key: permissions.key,
            resource: permissions.resource,
            action: permissions.action,
            description: permissions.description,
            category: permissions.category,
            isSystem: permissions.isSystem,
          })
          .from(permissions)
          .orderBy(permissions.category, permissions.resource, permissions.action);
      }

  Step 4:  listAllGroups()  — left join aggregation
      export async function listAllGroups(): Promise<PermissionGroupWithPermissionsEntity[]> {
        const rows = await db
          .select({
            groupId: permissionGroups.id,
            groupName: permissionGroups.name,
            groupSlug: permissionGroups.slug,
            groupDescription: permissionGroups.description,
            groupIsSystem: permissionGroups.isSystem,
            groupCreatedByUserId: permissionGroups.createdByUserId,
            groupCreatedAt: permissionGroups.createdAt,
            groupUpdatedAt: permissionGroups.updatedAt,
            permissionId: groupPermissions.permissionId,
          })
          .from(permissionGroups)
          .leftJoin(groupPermissions, eq(groupPermissions.groupId, permissionGroups.id))
          .orderBy(permissionGroups.name);

        const groupMap = new Map<string, PermissionGroupWithPermissionsEntity>();
        for (const row of rows) {
          const existing = groupMap.get(row.groupId);
          if (!existing) {
            groupMap.set(row.groupId, {
              id: row.groupId,
              name: row.groupName,
              slug: row.groupSlug,
              description: row.groupDescription,
              isSystem: row.groupIsSystem,
              createdByUserId: row.groupCreatedByUserId,
              createdAt: row.groupCreatedAt,
              updatedAt: row.groupUpdatedAt,
              permissionIds: row.permissionId ? [row.permissionId] : [],
            });
          } else if (row.permissionId) {
            existing.permissionIds.push(row.permissionId);
          }
        }
        return [...groupMap.values()];
      }

  Step 5:  getGroupById()
      export async function getGroupById(
        groupId: string,
        locale?: string
      ): Promise<PermissionGroupWithPermissionsEntity> {
        const all = await listAllGroups();
        const found = all.find(g => g.id === groupId);
        if (!found) {
          const t = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(t("notFound"));
        }
        return found;
      }

  Step 6:  createGroup()  — atomic transaction

      export async function createGroup(
        input: {
          name: string;
          slug: string;
          description?: string;
          permissionIds: string[];
          createdByUserId: string;
        },
        locale?: string
      ): Promise<PermissionGroupEntity> {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const now = new Date();

        return await db.transaction(async tx => {
          const existing = await tx
            .select({ id: permissionGroups.id })
            .from(permissionGroups)
            .where(eq(permissionGroups.name, input.name))
            .limit(1);
          if (existing.length > 0) throw new Error(t("permission_groups.nameAlreadyExists"));

          const [inserted] = await tx
            .insert(permissionGroups)
            .values({
              name: input.name,
              slug: input.slug,
              description: input.description ?? null,
              isSystem: false,
              createdByUserId: input.createdByUserId,
              createdAt: now,
              updatedAt: now,
            })
            .returning();

          if (input.permissionIds.length > 0) {
            await tx.insert(groupPermissions).values(
              input.permissionIds.map(permissionId => ({ groupId: inserted.id, permissionId }))
            );
          }

          return inserted;
        });
      }

  Step 7:  updateGroup()  — atomic permission replacement
      export async function updateGroup(
        input: {
          groupId: string;
          name?: string;
          description?: string;
          permissionIds?: string[];
          updatedByUserId: string;
        },
        locale?: string
      ): Promise<PermissionGroupEntity> {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const now = new Date();

        return await db.transaction(async tx => {
          const [existing] = await tx
            .select()
            .from(permissionGroups)
            .where(eq(permissionGroups.id, input.groupId))
            .limit(1);
          if (!existing) throw new Error(t("notFound"));
          if (existing.isSystem) throw new Error(t("permission_groups.cannotEditSystem"));

          type U = Partial<typeof permissionGroups.$inferInsert>;
          const vals: U = { updatedAt: now };
          if (input.name !== undefined) vals.name = input.name;
          if (input.description !== undefined) vals.description = input.description;

          const [updated] = await tx
            .update(permissionGroups)
            .set(vals)
            .where(eq(permissionGroups.id, input.groupId))
            .returning();

          if (input.permissionIds !== undefined) {
            await tx.delete(groupPermissions).where(eq(groupPermissions.groupId, input.groupId));
            if (input.permissionIds.length > 0) {
              await tx.insert(groupPermissions).values(
                input.permissionIds.map(permissionId => ({ groupId: input.groupId, permissionId }))
              );
            }
          }

          return updated;
        });
      }

  Step 8:  deleteGroup()
      export async function deleteGroup(groupId: string, locale?: string): Promise<void> {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const [group] = await db
          .select({ isSystem: permissionGroups.isSystem })
          .from(permissionGroups)
          .where(eq(permissionGroups.id, groupId))
          .limit(1);
        if (!group) throw new Error(t("notFound"));
        if (group.isSystem) throw new Error(t("permission_groups.cannotDeleteSystem"));
        // FK cascade handles groupPermissions + userPermissionGroups
        await db.delete(permissionGroups).where(eq(permissionGroups.id, groupId));
      }

  Step 9: User assignment methods
      export async function assignGroupToUser(
        input: { userId: string; groupId: string; assignedByUserId: string },
        locale?: string
      ): Promise<void> {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const [group] = await db
          .select({ id: permissionGroups.id })
          .from(permissionGroups)
          .where(eq(permissionGroups.id, input.groupId))
          .limit(1);
        if (!group) throw new Error(t("notFound"));
        await db
          .insert(userPermissionGroups)
          .values({
            userId: input.userId,
            groupId: input.groupId,
            assignedAt: new Date(),
            assignedByUserId: input.assignedByUserId,
          })
          .onConflictDoNothing(); // idempotent
      }

      export async function revokeGroupFromUser(
        input: { userId: string; groupId: string },
        locale?: string
      ): Promise<void> {
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const existing = await db
          .select()
          .from(userPermissionGroups)
          .where(
            and(
              eq(userPermissionGroups.userId, input.userId),
              eq(userPermissionGroups.groupId, input.groupId)
            )
          )
          .limit(1);
        if (existing.length === 0) throw new Error(t("notFound"));
        await db.delete(userPermissionGroups).where(
          and(
            eq(userPermissionGroups.userId, input.userId),
            eq(userPermissionGroups.groupId, input.groupId)
          )
        );
      }

      export async function listGroupsForUser(userId: string): Promise<string[]> {
        const rows = await db
          .select({ groupId: userPermissionGroups.groupId })
          .from(userPermissionGroups)
          .where(eq(userPermissionGroups.userId, userId));
        return rows.map(r => r.groupId);
      }
    }

  Step 10: Export

    // backend/db/repo/index.ts — add:
    export { PermissionManagementRepository } from "./permission-management.repository";

  Tests:  backend/db/test/repo/permission-management.repository.test.ts

  •  listAllPermissions()  returns seeded data
  •  createGroup()  is atomic (group + permissions)
  •  createGroup()  throws  nameAlreadyExists  on duplicate
  •  updateGroup()  replaces permissions atomically
  •  updateGroup()  throws  cannotEditSystem  on system group
  •  deleteGroup()  throws  cannotDeleteSystem  on system group
  •  assignGroupToUser()  is idempotent
  •  revokeGroupFromUser()  removes assignment

  Success Criteria:

  [ ] No  SQL<unknown>  type errors
  [ ] All multi-table writes in  db.transaction()
  [ ] System guards throw before any write
  [ ]  bun test backend/db/test/  passes with 0 failures
  ──────
  ### Task B — Service: Permission Management Business Logic

  File:  backend/services/auth/permission-management.service.ts  (new)

  Rules (from  backend/services/AGENTS.md ): Separate namespace from  PermissionsService . All
  errors localized. No GraphQL context. SSR-compatible.

    // backend/services/auth/permission-management.service.ts
    import { eq } from "drizzle-orm";
    import { db } from "@/backend/db/drizzleDb";
    import { PermissionManagementRepository } from "@/backend/db/repo";
    import { users } from "@/backend/db/schema";
    import { getBackendTranslations } from "@/backend/lib/intl";
    import { AppPermission } from "@/shared/lib/enum";
    import { PermissionsService } from "./permissions.service";
    import type { PermissionGroupEntity, PermissionGroupWithPermissionsEntity, PermissionRow } from
  "@/backend/types";

    export namespace PermissionManagementService {

      // ─── Private Guards ───────────────────────────────────────────────────────

      async function requireManageAccess(actorUserId: string, locale?: string): Promise<void> {
        const context = await PermissionsService.getUserContext(actorUserId);
        if (!context.isSuperAdmin && !(context.permissions as string[]).includes(AppPermission.
  PERMISSION_GROUPS_MANAGE)) {
          const t = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(t("unauthorized"));
        }
      }

      async function requireAssignAccess(actorUserId: string, locale?: string): Promise<void> {
        const context = await PermissionsService.getUserContext(actorUserId);
        if (!context.isSuperAdmin && !(context.permissions as string[]).includes(AppPermission.
  PERMISSION_GROUPS_ASSIGN)) {
          const t = await getBackendTranslations({ locale, namespace: "errors" });
          throw new Error(t("unauthorized"));
        }
      }

      // ─── Private Helpers ──────────────────────────────────────────────────────

      function generateSlug(name: string): string {
        return name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_+|_+$/g, "")
          .substring(0, 100);
      }

      // ─── Read Operations ──────────────────────────────────────────────────────

      export async function listPermissions(actorUserId: string, locale?: string):
  Promise<PermissionRow[]> {
        await requireManageAccess(actorUserId, locale);
        return PermissionManagementRepository.listAllPermissions();
      }

      export async function listGroups(actorUserId: string, locale?: string):
  Promise<PermissionGroupWithPermissionsEntity[]> {
        await requireManageAccess(actorUserId, locale);
        return PermissionManagementRepository.listAllGroups();
      }

      export async function getGroup(actorUserId: string, groupId: string, locale?: string):
  Promise<PermissionGroupWithPermissionsEntity> {
        await requireManageAccess(actorUserId, locale);
        return PermissionManagementRepository.getGroupById(groupId, locale);
      }

      // ─── Write Operations ─────────────────────────────────────────────────────

      export async function createGroup(
        actorUserId: string,
        input: { name: string; description?: string; permissionIds: string[] },
        locale?: string
      ): Promise<PermissionGroupEntity> {
        await requireManageAccess(actorUserId, locale);
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const trimmedName = input.name.trim();
        if (!trimmedName) throw new Error(t("permission_groups.nameRequired"));
        if (trimmedName.length > 255) throw new Error(t("permission_groups.nameTooLong"));
        const slug = generateSlug(trimmedName);
        if (!slug) throw new Error(t("permission_groups.invalidName"));
        return PermissionManagementRepository.createGroup(
          { name: trimmedName, slug, description: input.description?.trim(), permissionIds: input.
  permissionIds, createdByUserId: actorUserId },
          locale
        );
      }

      export async function updateGroup(
        actorUserId: string,
        input: { groupId: string; name?: string; description?: string; permissionIds?: string[] },
        locale?: string
      ): Promise<PermissionGroupEntity> {
        await requireManageAccess(actorUserId, locale);
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        let trimmedName: string | undefined;
        if (input.name !== undefined) {
          trimmedName = input.name.trim();
          if (!trimmedName) throw new Error(t("permission_groups.nameRequired"));
          if (trimmedName.length > 255) throw new Error(t("permission_groups.nameTooLong"));
        }
        return PermissionManagementRepository.updateGroup(
          { groupId: input.groupId, name: trimmedName, description: input.description?.trim(),
            permissionIds: input.permissionIds, updatedByUserId: actorUserId },
          locale
        );
      }

      export async function deleteGroup(actorUserId: string, groupId: string, locale?: string):
  Promise<void> {
        await requireManageAccess(actorUserId, locale);
        await PermissionManagementRepository.deleteGroup(groupId, locale);
      }

      export async function assignGroupToUser(
        actorUserId: string,
        input: { userId: string; groupId: string },
        locale?: string
      ): Promise<void> {
        await requireAssignAccess(actorUserId, locale);
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const [targetUser] = await db
          .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
          .from(users).where(eq(users.id, input.userId)).limit(1);
        if (!targetUser) throw new Error(t("userNotFound", { id: input.userId }));
        await PermissionManagementRepository.assignGroupToUser(
          { userId: input.userId, groupId: input.groupId, assignedByUserId: actorUserId },
          locale
        );
      }

      export async function revokeGroupFromUser(
        actorUserId: string,
        input: { userId: string; groupId: string },
        locale?: string
      ): Promise<void> {
        await requireAssignAccess(actorUserId, locale);
        const t = await getBackendTranslations({ locale, namespace: "errors" });
        const [targetUser] = await db
          .select({ id: users.id, isSuperAdmin: users.isSuperAdmin })
          .from(users).where(eq(users.id, input.userId)).limit(1);
        if (!targetUser) throw new Error(t("userNotFound", { id: input.userId }));
        if (targetUser.isSuperAdmin) throw new Error(t("permission_groups.cannotModifySuperAdmin"));
        await PermissionManagementRepository.revokeGroupFromUser(
          { userId: input.userId, groupId: input.groupId },
          locale
        );
      }

      export async function listGroupsForUser(actorUserId: string, userId: string, locale?:
  string): Promise<string[]> {
        await requireAssignAccess(actorUserId, locale);
        return PermissionManagementRepository.listGroupsForUser(userId);
      }
    }

  Tests:

  •  listPermissions()  throws  unauthorized  for non-admin
  •  createGroup()  throws  nameRequired  on empty name
  •  createGroup()  auto-generates slug (never from client)
  •  updateGroup()  on system group throws  cannotEditSystem
  •  deleteGroup()  on system group throws  cannotDeleteSystem
  •  revokeGroupFromUser()  on SuperAdmin throws  cannotModifySuperAdmin
  Success Criteria:

  [ ] Every public fn calls auth guard first
  [ ] Slug never accepted from client
  [ ]  bun tsgo  passes with 0 errors
  [ ] Service tests pass
  ──────
  ### Task C — Backend GraphQL: Pothos Schema & Resolvers

  File:  backend/graphql/pothos/permission-management.pothos.ts  (new)

  Rules: Fields non-nullable by default. Resolvers delegate to service. Every object exposes  id .
  Propagate  ctx.locale .

    // backend/graphql/pothos/permission-management.pothos.ts
    import { PermissionManagementService } from "@/backend/services/auth/permission-management.
  service";
    import type { PermissionGroupWithPermissionsEntity, PermissionRow } from "@/backend/types";
    import { gqlSchemaBuilder } from "../gqlSchemaBuilder";

    // ─── Object Types ─────────────────────────────────────────────────────────────

    export const PermissionObject = gqlSchemaBuilder
      .objectRef<PermissionRow>("Permission")
      .implement({
        fields: t => ({
          id: t.exposeString("id"),
          key: t.exposeString("key"),
          resource: t.exposeString("resource"),
          action: t.exposeString("action"),
          description: t.exposeString("description"),
          category: t.exposeString("category"),
          isSystem: t.exposeBoolean("isSystem"),
        }),
      });

    export const PermissionGroupObject = gqlSchemaBuilder
      .objectRef<PermissionGroupWithPermissionsEntity>("PermissionGroup")
      .implement({
        fields: t => ({
          id: t.exposeString("id"),
          name: t.exposeString("name"),
          slug: t.exposeString("slug"),
          description: t.exposeString("description", { nullable: true }),
          isSystem: t.exposeBoolean("isSystem"),
          createdAt: t.expose("createdAt", { type: "DateTime" }),
          updatedAt: t.expose("updatedAt", { type: "DateTime" }),
          permissionIds: t.exposeStringList("permissionIds"),
        }),
      });

    // ─── Input Types ──────────────────────────────────────────────────────────────

    const CreatePermissionGroupInput = gqlSchemaBuilder.inputType("CreatePermissionGroupInput", {
      fields: t => ({
        name: t.string({ required: true }),
        description: t.string({ required: false }),
        permissionIds: t.stringList({ required: true }),
      }),
    });

    const UpdatePermissionGroupInput = gqlSchemaBuilder.inputType("UpdatePermissionGroupInput", {
      fields: t => ({
        groupId: t.string({ required: true }),
        name: t.string({ required: false }),
        description: t.string({ required: false }),
        permissionIds: t.stringList({ required: false }),
      }),
    });

    const AssignPermissionGroupToUserInput = gqlSchemaBuilder.
  inputType("AssignPermissionGroupToUserInput", {
      fields: t => ({
        userId: t.string({ required: true }),
        groupId: t.string({ required: true }),
      }),
    });

    const RevokePermissionGroupFromUserInput = gqlSchemaBuilder.
  inputType("RevokePermissionGroupFromUserInput", {
      fields: t => ({
        userId: t.string({ required: true }),
        groupId: t.string({ required: true }),
      }),
    });

    // ─── Queries ──────────────────────────────────────────────────────────────────

    gqlSchemaBuilder.queryFields(t => ({
      permissions: t.field({
        type: [PermissionObject],
        description: "List all permission catalog entries.",
        resolve: async (_root, _args, ctx) =>
          PermissionManagementService.listPermissions(ctx.userId, ctx.locale),
      }),
      permissionGroups: t.field({
        type: [PermissionGroupObject],
        description: "List all permission groups with their permission IDs.",
        resolve: async (_root, _args, ctx) =>
          PermissionManagementService.listGroups(ctx.userId, ctx.locale),
      }),
      permissionGroup: t.field({
        type: PermissionGroupObject,
        args: { id: t.arg.string({ required: true }) },
        description: "Fetch a single permission group by ID.",
        resolve: async (_root, args, ctx) =>
          PermissionManagementService.getGroup(ctx.userId, args.id, ctx.locale),
      }),
      userPermissionGroups: t.stringList({
        args: { userId: t.arg.string({ required: true }) },
        description: "Return group IDs assigned to a user.",
        resolve: async (_root, args, ctx) =>
          PermissionManagementService.listGroupsForUser(ctx.userId, args.userId, ctx.locale),
      }),
    }));

    // ─── Mutations ────────────────────────────────────────────────────────────────

    gqlSchemaBuilder.mutationFields(t => ({
      createPermissionGroup: t.field({
        type: PermissionGroupObject,
        args: { input: t.arg({ type: CreatePermissionGroupInput, required: true }) },
        resolve: async (_root, args, ctx) =>
          PermissionManagementService.createGroup(ctx.userId,
            { name: args.input.name, description: args.input.description ?? undefined,
  permissionIds: args.input.permissionIds },
            ctx.locale),
      }),
      updatePermissionGroup: t.field({
        type: PermissionGroupObject,
        args: { input: t.arg({ type: UpdatePermissionGroupInput, required: true }) },
        resolve: async (_root, args, ctx) =>
          PermissionManagementService.updateGroup(ctx.userId,
            { groupId: args.input.groupId, name: args.input.name ?? undefined,
              description: args.input.description ?? undefined, permissionIds: args.input.
  permissionIds ?? undefined },
            ctx.locale),
      }),
      deletePermissionGroup: t.boolean({
        args: { groupId: t.arg.string({ required: true }) },
        resolve: async (_root, args, ctx) => {
          await PermissionManagementService.deleteGroup(ctx.userId, args.groupId, ctx.locale);
          return true;
        },
      }),
      assignPermissionGroupToUser: t.boolean({
        args: { input: t.arg({ type: AssignPermissionGroupToUserInput, required: true }) },
        resolve: async (_root, args, ctx) => {
          await PermissionManagementService.assignGroupToUser(ctx.userId,
            { userId: args.input.userId, groupId: args.input.groupId }, ctx.locale);
          return true;
        },
      }),
      revokePermissionGroupFromUser: t.boolean({
        args: { input: t.arg({ type: RevokePermissionGroupFromUserInput, required: true }) },
        resolve: async (_root, args, ctx) => {
          await PermissionManagementService.revokeGroupFromUser(ctx.userId,
            { userId: args.input.userId, groupId: args.input.groupId }, ctx.locale);
          return true;
        },
      }),
    }));

  Add to  backend/graphql/pothos/index.ts :

    import "./permission-management.pothos";

  Then:

    ~/.bun/bin/bun run generate:gqlSchema
    ~/.bun/bin/bun codegen

  Success Criteria:

  [ ] Schema generates without errors
  [ ] Codegen produces  Permission ,  PermissionGroup  types + all operations
  [ ] Both object types expose  id
  [ ]  bun tsgo  passes
  ──────
  ### Task D — Frontend GraphQL: Apollo Documents

  File:  frontend/graphql/sharedDocuments/permission-management.documents.ts  (new)

  Rules:  TypedDocumentNode  only. Import from  "@apollo/client" . No  useLazyQuery . All
  selections include  id .

    // frontend/graphql/sharedDocuments/permission-management.documents.ts
    import { gql, type TypedDocumentNode } from "@apollo/client";
    import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
    import type * as Operations from "@/frontend/graphql/generated/gql/operations";

    const PERMISSION_FIELDS = gql`
      fragment PermissionFields on Permission {
        id
        key
        resource
        action
        description
        category
        isSystem
      }
    `;

    const PERMISSION_GROUP_FIELDS = gql`
      fragment PermissionGroupFields on PermissionGroup {
        id
        name
        slug
        description
        isSystem
        createdAt
        updatedAt
        permissionIds
      }
    `;

    export const permissionsQueryDocument: TypedDocumentNode<Operations.PermissionsQuery> = gql`
      ${PERMISSION_FIELDS}
      query permissions {
        permissions { ...PermissionFields }
      }
    `;

    export const permissionGroupsQueryDocument: TypedDocumentNode<Operations.PermissionGroupsQuery>
  = gql`
      ${PERMISSION_GROUP_FIELDS}
      query permissionGroups {
        permissionGroups { ...PermissionGroupFields }
      }
    `;

    export const permissionGroupQueryDocument: TypedDocumentNode<
      Operations.PermissionGroupQuery,
      Types.QueryPermissionGroupArgs
    > = gql`
      ${PERMISSION_GROUP_FIELDS}
      query permissionGroup($id: String!) {
        permissionGroup(id: $id) { ...PermissionGroupFields }
      }
    `;

    export const userPermissionGroupsQueryDocument: TypedDocumentNode<
      Operations.UserPermissionGroupsQuery,
      Types.QueryUserPermissionGroupsArgs
    > = gql`
      query userPermissionGroups($userId: String!) {
        userPermissionGroups(userId: $userId)
      }
    `;

    export const createPermissionGroupMutationDocument: TypedDocumentNode<
      Operations.CreatePermissionGroupMutation,
      Types.MutationCreatePermissionGroupArgs
    > = gql`
      ${PERMISSION_GROUP_FIELDS}
      mutation createPermissionGroup($input: CreatePermissionGroupInput!) {
        createPermissionGroup(input: $input) { ...PermissionGroupFields }
      }
    `;

    export const updatePermissionGroupMutationDocument: TypedDocumentNode<
      Operations.UpdatePermissionGroupMutation,
      Types.MutationUpdatePermissionGroupArgs
    > = gql`
      ${PERMISSION_GROUP_FIELDS}
      mutation updatePermissionGroup($input: UpdatePermissionGroupInput!) {
        updatePermissionGroup(input: $input) { ...PermissionGroupFields }
      }
    `;

    export const deletePermissionGroupMutationDocument: TypedDocumentNode<
      Operations.DeletePermissionGroupMutation,
      Types.MutationDeletePermissionGroupArgs
    > = gql`
      mutation deletePermissionGroup($groupId: String!) {
        deletePermissionGroup(groupId: $groupId)
      }
    `;

    export const assignPermissionGroupToUserMutationDocument: TypedDocumentNode<
      Operations.AssignPermissionGroupToUserMutation,
      Types.MutationAssignPermissionGroupToUserArgs
    > = gql`
      mutation assignPermissionGroupToUser($input: AssignPermissionGroupToUserInput!) {
        assignPermissionGroupToUser(input: $input)
      }
    `;

    export const revokePermissionGroupFromUserMutationDocument: TypedDocumentNode<
      Operations.RevokePermissionGroupFromUserMutation,
      Types.MutationRevokePermissionGroupFromUserArgs
    > = gql`
      mutation revokePermissionGroupFromUser($input: RevokePermissionGroupFromUserInput!) {
        revokePermissionGroupFromUser(input: $input)
      }
    `;

  Add to  frontend/graphql/sharedDocuments/index.ts :

    export * from "./permission-management.documents";
  ──────
  ### Task E — Frontend State: Zustand Store

  File:  frontend/stores/permissionManagementStore.ts  (new)

    // frontend/stores/permissionManagementStore.ts
    import { create } from "zustand";
    import type { Permission, PermissionGroup } from "@/frontend/graphql/generated/gql/graphql-
  types";

    interface PermissionManagementState {
      permissions: Permission[];
      groups: PermissionGroup[];
      selectedGroupId: string | null;
      isLoading: boolean;
      error: string | null;
      isCreateDialogOpen: boolean;
      isEditDialogOpen: boolean;
      isDeleteDialogOpen: boolean;
      isAssignDialogOpen: boolean;
      setPermissions: (permissions: Permission[]) => void;
      setGroups: (groups: PermissionGroup[]) => void;
      setSelectedGroupId: (id: string | null) => void;
      setLoading: (loading: boolean) => void;
      setError: (error: string | null) => void;
      openCreateDialog: () => void;
      closeCreateDialog: () => void;
      openEditDialog: (groupId: string) => void;
      closeEditDialog: () => void;
      openDeleteDialog: (groupId: string) => void;
      closeDeleteDialog: () => void;
      openAssignDialog: (groupId: string) => void;
      closeAssignDialog: () => void;
      reset: () => void;
    }

    const initialState = {
      permissions: [] as Permission[],
      groups: [] as PermissionGroup[],
      selectedGroupId: null,
      isLoading: false,
      error: null,
      isCreateDialogOpen: false,
      isEditDialogOpen: false,
      isDeleteDialogOpen: false,
      isAssignDialogOpen: false,
    };

    export const usePermissionManagementStore = create<PermissionManagementState>(set => ({
      ...initialState,
      setPermissions: permissions => set({ permissions }),
      setGroups: groups => set({ groups }),
      setSelectedGroupId: id => set({ selectedGroupId: id }),
      setLoading: loading => set({ isLoading: loading }),
      setError: error => set({ error }),
      openCreateDialog: () => set({ isCreateDialogOpen: true }),
      closeCreateDialog: () => set({ isCreateDialogOpen: false }),
      openEditDialog: groupId => set({ isEditDialogOpen: true, selectedGroupId: groupId }),
      closeEditDialog: () => set({ isEditDialogOpen: false, selectedGroupId: null }),
      openDeleteDialog: groupId => set({ isDeleteDialogOpen: true, selectedGroupId: groupId }),
      closeDeleteDialog: () => set({ isDeleteDialogOpen: false, selectedGroupId: null }),
      openAssignDialog: groupId => set({ isAssignDialogOpen: true, selectedGroupId: groupId }),
      closeAssignDialog: () => set({ isAssignDialogOpen: false, selectedGroupId: null }),
      reset: () => set(initialState),
    }));
  ──────
  ### Task F — Frontend i18n: Translation Keys

  Location:  shared/messages/en.ts  and  shared/messages/ar/  (NOT  frontend/locales/ )

  English additions inside  dashboard  namespace:

    permissions: {
      pageTitle: "Permission Management",
      pageSubtitle: "Manage permission groups and assign them to users",
      nav: "Permissions",
      catalog: {
        title: "Permission Catalog",
        subtitle: "All system permissions organized by category",
        noEntries: "No permissions found",
        allCategories: "All categories",
        filterByCategory: "Filter by category",
        columns: {
          key: "Permission Key",
          resource: "Resource",
          action: "Action",
          description: "Description",
          category: "Category",
        },
      },
      groups: {
        title: "Permission Groups",
        subtitle: "Create and manage custom permission groups",
        noEntries: "No permission groups found",
        createGroup: "Create Group",
        systemBadge: "System",
        customBadge: "Custom",
        permissionsCount: "{count} permissions",
        columns: {
          name: "Group Name",
          slug: "Slug",
          type: "Type",
          permissions: "Permissions",
          actions: "Actions",
        },
        actions: {
          edit: "Edit Group",
          delete: "Delete Group",
          viewPermissions: "View Permissions",
          assign: "Assign to User",
        },
      },
      form: {
        createTitle: "Create Permission Group",
        editTitle: "Edit Permission Group",
        nameLabel: "Group Name",
        namePlaceholder: "Enter group name",
        descriptionLabel: "Description",
        descriptionPlaceholder: "Optional group description",
        permissionsLabel: "Permissions",
        permissionsHint: "Select permissions to include in this group",
        submitCreate: "Create Group",
        submitEdit: "Save Changes",
        cancel: "Cancel",
        selectAll: "Select all",
        deselectAll: "Deselect all",
        validation: {
          nameRequired: "Group name is required",
          nameTooLong: "Group name must not exceed 255 characters",
        },
      },
      deleteDialog: {
        title: "Delete Permission Group",
        message: "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
        confirm: "Delete Group",
        cancel: "Cancel",
      },
      assignDialog: {
        title: "Assign Group to User",
        userIdLabel: "User ID",
        userIdPlaceholder: "Enter user UUID",
        groupLabel: "Permission Group",
        submitAssign: "Assign Group",
        submitRevoke: "Revoke Group",
        cancel: "Cancel",
      },
      success: {
        created: "Permission group created successfully",
        updated: "Permission group updated successfully",
        deleted: "Permission group deleted successfully",
        assigned: "Permission group assigned to user",
        revoked: "Permission group revoked from user",
      },
      error: {
        loadFailed: "Failed to load permission data",
        createFailed: "Failed to create permission group",
        updateFailed: "Failed to update permission group",
        deleteFailed: "Failed to delete permission group",
        assignFailed: "Failed to assign permission group",
        revokeFailed: "Failed to revoke permission group",
      },
    },

  Arabic additions (same structure):

    permissions: {
      pageTitle: "إدارة الصلاحيات",
      pageSubtitle: "إدارة مجموعات الصلاحيات وتعيينها للمستخدمين",
      nav: "الصلاحيات",
      catalog: {
        title: "فهرس الصلاحيات",
        subtitle: "جميع صلاحيات النظام منظمة حسب الفئة",
        noEntries: "لا توجد صلاحيات",
        allCategories: "جميع الفئات",
        filterByCategory: "تصفية حسب الفئة",
        columns: {
          key: "مفتاح الصلاحية",
          resource: "المورد",
          action: "الإجراء",
          description: "الوصف",
          category: "الفئة",
        },
      },
      groups: {
        title: "مجموعات الصلاحيات",
        subtitle: "إنشاء وإدارة مجموعات مخصصة",
        noEntries: "لا توجد مجموعات صلاحيات",
        createGroup: "إنشاء مجموعة",
        systemBadge: "النظام",
        customBadge: "مخصص",
        permissionsCount: "{count} صلاحيات",
        columns: {
          name: "اسم المجموعة",
          slug: "المعرف",
          type: "النوع",
          permissions: "الصلاحيات",
          actions: "الإجراءات",
        },
        actions: {
          edit: "تعديل المجموعة",
          delete: "حذف المجموعة",
          viewPermissions: "عرض الصلاحيات",
          assign: "تعيين لمستخدم",
        },
      },
      form: {
        createTitle: "إنشاء مجموعة صلاحيات",
        editTitle: "تعديل مجموعة الصلاحيات",
        nameLabel: "اسم المجموعة",
        namePlaceholder: "أدخل اسم المجموعة",
        descriptionLabel: "الوصف",
        descriptionPlaceholder: "وصف اختياري",
        permissionsLabel: "الصلاحيات",
        permissionsHint: "حدد الصلاحيات لتضمينها في هذه المجموعة",
        submitCreate: "إنشاء المجموعة",
        submitEdit: "حفظ التغييرات",
        cancel: "إلغاء",
        selectAll: "تحديد الكل",
        deselectAll: "إلغاء تحديد الكل",
        validation: {
          nameRequired: "اسم المجموعة مطلوب",
          nameTooLong: "يجب ألا يتجاوز اسم المجموعة 255 حرفاً",
        },
      },
      deleteDialog: {
        title: "حذف مجموعة الصلاحيات",
        message: "هل أنت متأكد من حذف \"{name}\"؟ لا يمكن التراجع عن هذا الإجراء.",
        confirm: "حذف المجموعة",
        cancel: "إلغاء",
      },
      assignDialog: {
        title: "تعيين مجموعة لمستخدم",
        userIdLabel: "معرف المستخدم",
        userIdPlaceholder: "أدخل UUID المستخدم",
        groupLabel: "مجموعة الصلاحيات",
        submitAssign: "تعيين المجموعة",
        submitRevoke: "إلغاء التعيين",
        cancel: "إلغاء",
      },
      success: {
        created: "تم إنشاء مجموعة الصلاحيات بنجاح",
        updated: "تم تحديث مجموعة الصلاحيات بنجاح",
        deleted: "تم حذف مجموعة الصلاحيات بنجاح",
        assigned: "تم تعيين مجموعة الصلاحيات للمستخدم",
        revoked: "تم إلغاء تعيين مجموعة الصلاحيات",
      },
      error: {
        loadFailed: "فشل تحميل بيانات الصلاحيات",
        createFailed: "فشل إنشاء مجموعة الصلاحيات",
        updateFailed: "فشل تحديث مجموعة الصلاحيات",
        deleteFailed: "فشل حذف مجموعة الصلاحيات",
        assignFailed: "فشل تعيين مجموعة الصلاحيات",
        revokeFailed: "فشل إلغاء تعيين مجموعة الصلاحيات",
      },
    },
  ──────
  ### Task G — Frontend Views: Permission Management Page

  │ ⚠️ BLOCKING: Starts only after UX design placed in  .ai/ux/01-in_progress/

  Rules (from  frontend/views/AGENTS.md ):

  • Store accessed ONLY in  PermissionManagementContainer .
  •  <RequirePermission permissions={["permission_groups.manage"]} />  wraps entire page.
  •  useQuery  only — no  useLazyQuery .
  • No hardcoded colors — all  theme.palette .
  • No nested ternaries.
  • Files >150 lines → split into sub-components.
  • Layout:  PageContainer → PageHeader → SectionPanel → AppDataGrid .
  • All dialogs: MUI  Dialog  — NO  window.confirm() .

  File structure:

    frontend/app/[locale]/(dashboard)/permissions/
      page.tsx

    frontend/views/dashboard/permissions/
      components/
        PermissionCatalogDataGrid.tsx
        PermissionGroupsDataGrid.tsx
        PermissionGroupCard.tsx
        PermissionGroupForm.tsx
        DeleteGroupDialog.tsx
        AssignGroupDialog.tsx
      schemas/
        permissionGroupSchema.ts
      PermissionManagementContainer.tsx
      PermissionManagementView.tsx

   page.tsx :

    import { PermissionManagementContainer } from
  "@/frontend/views/dashboard/permissions/PermissionManagementContainer";
    export default function PermissionsPage() {
      return <PermissionManagementContainer />;
    }

   permissionGroupSchema.ts :

    import * as z from "zod";
    export const createPermissionGroupSchema = (messages: { nameRequired: string; nameTooLong:
  string }) =>
      z.object({
        name: z.string({ required_error: messages.nameRequired }).min(1, messages.nameRequired).
  max(255, messages.nameTooLong),
        description: z.string().optional(),
        permissionIds: z.array(z.string()),
      });
    export type PermissionGroupFormData = z.infer<ReturnType<typeof createPermissionGroupSchema>>;

   PermissionManagementContainer.tsx  skeleton:

    "use client";
    import { useQuery, useMutation } from "@apollo/client/react";
    import { useTranslations } from "next-intl";
    import { useEffect } from "react";
    import {
      permissionsQueryDocument, permissionGroupsQueryDocument,
      createPermissionGroupMutationDocument, updatePermissionGroupMutationDocument,
      deletePermissionGroupMutationDocument, assignPermissionGroupToUserMutationDocument,
      revokePermissionGroupFromUserMutationDocument,
    } from "@/frontend/graphql/sharedDocuments";
    import { usePermissionManagementStore } from "@/frontend/stores/permissionManagementStore";
    import { logger } from "@/frontend/utils/logger";
    import { PermissionManagementView } from "./PermissionManagementView";

    export function PermissionManagementContainer() {
      const t = useTranslations("dashboard.permissions");
      const { setPermissions, setGroups, setLoading, setError,
        closeCreateDialog, closeEditDialog, closeDeleteDialog, closeAssignDialog } =
        usePermissionManagementStore();

      const { data: permissionsData, loading: permissionsLoading, error: permissionsError } =
        useQuery(permissionsQueryDocument);
      const { data: groupsData, loading: groupsLoading, error: groupsError, refetch: refetchGroups
  } =
        useQuery(permissionGroupsQueryDocument);

      useEffect(() => { setPermissions(permissionsData?.permissions ?? []); }, [permissionsData,
  setPermissions]);
      useEffect(() => { setGroups(groupsData?.permissionGroups ?? []); }, [groupsData, setGroups]);
      useEffect(() => { setLoading(permissionsLoading || groupsLoading); }, [permissionsLoading,
  groupsLoading, setLoading]);
      useEffect(() => {
        const err = permissionsError ?? groupsError;
        setError(err ? t("error.loadFailed") : null);
        if (err) logger.error("Permission load error", { err });
      }, [permissionsError, groupsError, setError, t]);

      const [createGroup] = useMutation(createPermissionGroupMutationDocument, {
        onCompleted: () => { void refetchGroups(); closeCreateDialog(); },
        onError: err => { setError(t("error.createFailed")); logger.error("createGroup", { err });
  },
      });
      const [updateGroup] = useMutation(updatePermissionGroupMutationDocument, {
        onCompleted: () => { void refetchGroups(); closeEditDialog(); },
        onError: err => { setError(t("error.updateFailed")); logger.error("updateGroup", { err });
  },
      });
      const [deleteGroup] = useMutation(deletePermissionGroupMutationDocument, {
        onCompleted: () => { void refetchGroups(); closeDeleteDialog(); },
        onError: err => { setError(t("error.deleteFailed")); logger.error("deleteGroup", { err });
  },
      });
      const [assignGroup] = useMutation(assignPermissionGroupToUserMutationDocument, {
        onCompleted: () => closeAssignDialog(),
        onError: err => { setError(t("error.assignFailed")); logger.error("assignGroup", { err });
  },
      });
      const [revokeGroup] = useMutation(revokePermissionGroupFromUserMutationDocument, {
        onCompleted: () => closeAssignDialog(),
        onError: err => { setError(t("error.revokeFailed")); logger.error("revokeGroup", { err });
  },
      });

      return (
        <PermissionManagementView
          onCreateGroup={input => { void createGroup({ variables: { input } }); }}
          onUpdateGroup={input => { void updateGroup({ variables: { input } }); }}
          onDeleteGroup={groupId => { void deleteGroup({ variables: { groupId } }); }}
          onAssignGroup={input => { void assignGroup({ variables: { input } }); }}
          onRevokeGroup={input => { void revokeGroup({ variables: { input } }); }}
        />
      );
    }

  Component requirements (implement after UX design):

  •  PermissionGroupsDataGrid : System groups → read-only badge, edit/delete hidden. Custom → all
  actions.
  •  PermissionGroupForm : RHF + Zod. Permissions as categorized checkbox list. "Select all in
  category" per group. Selected count shown.
  •  DeleteGroupDialog :  color="error"  delete button. Group name interpolated.
  •  AssignGroupDialog : userId text input + Assign + Revoke buttons.
  •  PermissionCatalogDataGrid : Category filter chips above AppDataGrid.

  Success Criteria:

  [ ] Page gated by  <RequirePermission permissions={["permission_groups.manage"]} />
  [ ] Container manages Apollo, View is purely presentational
  [ ] System groups: read-only in UI
  [ ] All dialogs use MUI  Dialog
  [ ] No hardcoded colors, no nested ternaries
  [ ]  bun quality-gate  → "ALL QUALITY GATES PASSED"
  ──────
  ### Task H — Navigation Integration

  File:  frontend/views/dashboard/config/navigationConfig.ts

  Add to  SIDEBAR_NAV_ITEMS  (and  BOTTOM_NAV_ITEMS  if applicable):

    {
      key: "permissions",
      labelKey: "dashboard.permissions.nav",
      icon: SecurityOutlined,       // import from "@mui/icons-material"
      href: "/permissions",
      section: "main",
      permission: AppPermission.PermissionGroupsManage,
    },

  Success Criteria:

  [ ] Visible for SuperAdmin +  PermissionGroupsManage  users
  [ ] Hidden for teachers, parents, standard users
  [ ]  bun tsgo  and  bun lint  pass
  ──────
  ## Section 7: Final Verification

    ~/.bun/bin/bun run generate:gqlSchema
    ~/.bun/bin/bun codegen
    ~/.bun/bin/bun tsgo
    ~/.bun/bin/bun test
    bun quality-gate

  Smoke test (SuperAdmin):

  1. Login →  /permissions  → verify catalog + 5 system groups (read-only)
  2. Create custom group with 3 permissions → verify in list
  3. Edit custom group → verify saved
  4. Delete custom group → verify removed
  5. Attempt edit/delete on system group → UI blocks
  6. Assign custom group to user → verify in DB
  7. Login as teacher →  /permissions  returns 403 / nav item hidden

  RTL test: Switch to  /ar/permissions  → verify Arabic labels + RTL layout mirroring.
  ──────
  ## Implementation Order

    Task A (Repo)
      ↓
    Task B (Service)
      ↓
    Task C (Pothos) → generate:gqlSchema + codegen
      ↓
    Task D (Apollo Documents)
      ↓
    Task E (Zustand Store) ──┐
                             ├── parallel
    Task F (i18n Keys) ──────┘
      ↓
    [⚠️ Wait for UX design → .ai/ux/01-in_progress/]
      ↓
    Task G (Views / UI)
      ↓
    Task H (Navigation)
      ↓
    Section 7: Final Verification


    ---
