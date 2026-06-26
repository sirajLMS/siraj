import { count, eq } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { permissionGroups, staffProfiles, userPermissionGroups, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type { ManagerDirectoryResult, ManagerDirectoryRow, StaffProfileCreateResult, StaffProfileEntityInput, PaginationArgs } from "@/backend/types";
import type { DBTransaction } from "../db.types";

export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly phoneIsSet?: boolean;
  readonly skypeId?: string | null;
  readonly skypeIdIsSet?: boolean;
}

export namespace StaffProfileRepository {
  export async function create(
    input: StaffProfileEntityInput,
    tx?: DBTransaction,
    locale?: string
  ): Promise<StaffProfileCreateResult> {
    const queryDb = tx ?? db;

    const existingProfile = await queryDb
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, input.userId))
      .limit(1);

    if (existingProfile.length > 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("staff.alreadyExists"));
    }

    const [created] = await queryDb
      .insert(staffProfiles)
      .values({
        userId: input.userId,
        phone: input.phone ?? null,
        skypeId: input.skypeId ?? null,
        status: input.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("staff.createFailed"));
    }

    return {
      id: created.id,
      userId: created.userId,
      status: created.status,
      phone: created.phone,
      skypeId: created.skypeId,
      createdAt: created.createdAt,
    };
  }

  const MANAGER_DIRECTORY_SELECT = {
    id: users.id,
    staffProfileId: staffProfiles.id,
    name: users.name,
    email: users.email,
    phone: staffProfiles.phone,
    skypeId: staffProfiles.skypeId,
    status: staffProfiles.status,
    roleSlug: permissionGroups.slug,
    roleName: permissionGroups.name,
  } as const;

  export async function getManagerDirectory(
    pagination: PaginationArgs | null = null,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryResult> {
    const queryDb = tx ?? db;

    const baseQuery = queryDb
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .orderBy(users.name);

    if (!pagination) {
      const rows = await baseQuery;
      return { rows, totalCount: rows.length, pageInfo: null };
    }

    const perPage = pagination.perPage;
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [rows, countResult] = await Promise.all([
      baseQuery.limit(perPage).offset(offset),
      queryDb
        .select({ count: count() })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id)),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(totalCount / perPage));

    return {
      rows,
      totalCount,
      pageInfo: {
        count: rows.length,
        currentPage,
        firstItem: rows.length > 0 ? offset + 1 : null,
        lastItem: rows.length > 0 ? offset + rows.length : null,
        hasMorePages: currentPage < lastPage,
        lastPage,
        perPage,
        total: totalCount,
      },
    };
  }

  export async function findByUserId(userId: string, tx?: DBTransaction): Promise<ManagerDirectoryRow | null> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(users.id, userId))
      .limit(1);

    return results[0] ?? null;
  }

  export async function updateManagerProfile(
    staffProfileId: string,
    input: ManagerProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow> {
    const updateTx = async (t: DBTransaction): Promise<ManagerDirectoryRow> => {
      const t18n = await getBackendTranslations({ locale, namespace: "errors" });

      const existing = await t.select().from(staffProfiles).where(eq(staffProfiles.id, staffProfileId)).limit(1);

      if (existing.length === 0) {
        throw new Error(t18n("staffProfileNotFound"));
      }

      const updateSet: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (input.phoneIsSet) {
        updateSet.phone = input.phone ?? null;
      }
      if (input.skypeIdIsSet) {
        updateSet.skypeId = input.skypeId ?? null;
      }

      await t.update(staffProfiles).set(updateSet).where(eq(staffProfiles.id, staffProfileId));

      const updated = await t
        .select(MANAGER_DIRECTORY_SELECT)
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(eq(staffProfiles.id, staffProfileId))
        .limit(1);

      if (updated.length === 0) {
        throw new Error(t18n("staffProfileUpdateFailed"));
      }

      logger.info("Manager profile updated", { staffProfileId });

      return updated[0];
    };

    if (tx) {
      return await updateTx(tx);
    }
    return await db.transaction(updateTx);
  }

  export async function getUserPermissionGroupSlugs(userId: string, tx?: DBTransaction): Promise<string[]> {
    const queryDb = tx ?? db;

    const results = await queryDb
      .select({ slug: permissionGroups.slug })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId));

    return results.map(r => r.slug);
  }
}
