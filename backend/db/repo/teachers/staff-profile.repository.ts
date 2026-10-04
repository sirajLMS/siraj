import { and, eq, inArray, or } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb } from "@/backend/db";
import {
  aggregateOnboardingMetrics,
  applyManagerProfileUpdate,
  buildManagerDirectoryBaseQuery,
  buildManagerDirectoryCountQuery,
  buildManagerDirectoryWhere,
  buildStaffProfileStatusQuery,
  findManagerDirectoryRow,
  getManagerDirectoryMetrics,
  mapManagerDirectoryRow,
  mapPermissionGroupRow,
} from "@/backend/db/repo/teachers/staff-profile.repository.helpers";
import {
  permissionGroups,
  permissions,
  staffProfiles,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import { AccountStatus, OverrideState } from "@/backend/enum";
import type {
  DBTransaction,
  ManagerDirectoryFilters,
  ManagerDirectoryResult,
  ManagerDirectoryRow,
  ManagerProfileUpdateInput,
  OnboardingMetricsResult,
  PaginationArgs,
  StaffDirectoryAutocompleteRow,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
  StaffProfileCreateResult,
  StaffProfileInsertType,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { parseAccountStatus, parseOverrideState } from "@/shared/lib/enum";
import { getServerTranslations } from "@/shared/locale";

export namespace StaffProfileRepository {
  export async function create(
    input: StaffProfileInsertType,
    tx?: DBTransaction,
    locale?: string
  ): Promise<StaffProfileCreateResult> {
    const executor = tx ?? db;

    const userId = input.userId ?? "";

    const existingProfile = await executor
      .select({ id: staffProfiles.id })
      .from(staffProfiles)
      .where(eq(staffProfiles.userId, userId))
      .limit(1);

    if (existingProfile.length > 0) {
      const { staff } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(staff.alreadyExists);
    }

    const [created] = await executor
      .insert(staffProfiles)
      .values({
        userId: input.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      const { teacher } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(teacher.staffProfileCreateFailed);
    }

    const [userRow] = await executor
      .select({ phone: users.phone, status: users.status })
      .from(users)
      .where(eq(users.id, created.userId))
      .limit(1);

    if (!userRow) {
      const { userNotFound } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(userNotFound(created.userId));
    }

    return {
      id: created.id,
      userId: created.userId,
      status: parseAccountStatus(userRow.status) ?? AccountStatus.ACTIVATED,
      phone: userRow.phone,
      createdAt: created.createdAt,
    };
  }

  export async function ensureForUser(userId: string, tx?: DBTransaction): Promise<void> {
    const executor = tx ?? db;
    const now = new Date();
    await executor
      .insert(staffProfiles)
      .values({
        userId,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }

  export async function getManagerDirectory(
    pagination: PaginationArgs | null = null,
    filters?: ManagerDirectoryFilters,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryResult> {
    const executor = tx ?? db;
    const whereClause = buildManagerDirectoryWhere(filters);

    const baseQuery = buildManagerDirectoryBaseQuery(executor, whereClause).orderBy(users.name);

    if (!pagination) {
      const [rows, metrics] = await Promise.all([baseQuery, getManagerDirectoryMetrics(executor)]);
      return {
        metrics,
        rows: rows.map(row => mapManagerDirectoryRow(row, locale)),
        totalCount: rows.length,
        pageInfo: null,
      };
    }

    const perPage = pagination.perPage;
    const currentPage = pagination.currentPage;
    const offset = pagination.offset;

    const [rows, countResult, metrics] = await Promise.all([
      baseQuery.limit(perPage).offset(offset),
      buildManagerDirectoryCountQuery(executor, whereClause),
      getManagerDirectoryMetrics(executor),
    ]);

    const totalCount = countResult[0]?.count ?? 0;
    const lastPage = Math.max(1, Math.ceil(totalCount / perPage));

    return {
      metrics,
      rows: rows.map(row => mapManagerDirectoryRow(row, locale)),
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

  export async function getStaffDirectoryLite(
    options: { search?: string | null; limit: number; permissionGroupFilter?: string | null },
    tx?: DBTransaction
  ): Promise<StaffDirectoryAutocompleteRow[]> {
    const q = queryDb(tx) ?? db;
    const filters: ManagerDirectoryFilters = {
      roleFilter: options.permissionGroupFilter ?? null,
    };
    const roleWhere = buildManagerDirectoryWhere(filters);

    const searchConditions: ReturnType<typeof or>[] = [];
    const trimmedSearch = options.search?.trim();
    if (trimmedSearch) {
      searchConditions.push(
        or(
          caseInsensitiveLike(users.name, `%${escapeLikeWildcards(trimmedSearch)}%`),
          caseInsensitiveLike(users.email, `%${escapeLikeWildcards(trimmedSearch)}%`)
        )
      );
    }

    const whereClause = searchConditions.length > 0 ? and(roleWhere, searchConditions[0]) : roleWhere;

    return await q
      .select({
        id: users.id,
        name: users.name,
        avatarUrl: users.avatarUrl,
        email: users.email,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(whereClause)
      .groupBy(users.id, users.name, users.avatarUrl, users.email)
      .orderBy(users.name)
      .limit(options.limit);
  }

  export async function getOnboardingMetrics(tx?: DBTransaction): Promise<OnboardingMetricsResult> {
    const q = queryDb(tx) ?? db;

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const rows = await buildStaffProfileStatusQuery(q);
    const { activeStaff, pendingApproval, avgOnboardingDays } = aggregateOnboardingMetrics(rows, ninetyDaysAgo);

    return {
      id: "onboarding-metrics",
      activeStaff,
      pendingApproval,
      avgOnboardingDays,
    };
  }

  export async function findByUserId(
    userId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const q = queryDb(tx) ?? db;
    return findManagerDirectoryRow(eq(users.id, userId), q, locale);
  }

  /**
   * Batch variant of findByUserId — single query for N user IDs. Returns one
   * row per user (highest-priority group mapping), preserving input order
   * (unmatched IDs are simply absent — callers use a Map/lookup if needed).
   */
  export async function findByUserIds(
    userIds: readonly string[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow[]> {
    if (userIds.length === 0) return [];

    const q = queryDb(tx) ?? db;
    const uniqueIds = [...new Set(userIds)];
    const rows = await buildManagerDirectoryBaseQuery(q, inArray(users.id, uniqueIds));

    const profileMap = new Map<string, ManagerDirectoryRow>();
    for (const row of rows) {
      if (!profileMap.has(row.id)) {
        profileMap.set(row.id, mapManagerDirectoryRow(row, locale));
      }
    }

    return Array.from(profileMap.values());
  }

  export async function findByStaffProfileId(
    staffProfileId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const q = queryDb(tx) ?? db;
    return findManagerDirectoryRow(eq(staffProfiles.id, staffProfileId), q, locale);
  }

  export async function updateManagerProfile(
    staffProfileId: string,
    input: ManagerProfileUpdateInput,
    locale?: string,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow> {
    if (tx) {
      return await applyManagerProfileUpdate(tx, staffProfileId, input, locale);
    }
    return await db.transaction(t => applyManagerProfileUpdate(t, staffProfileId, input, locale));
  }

  export async function getUserPermissionGroupSlugs(userId: string, tx?: DBTransaction): Promise<string[]> {
    const q = queryDb(tx) ?? db;

    const results = await q
      .select({ slug: permissionGroups.slug })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId));

    return results.map(r => r.slug);
  }

  export async function getUserPermissionGroups(
    userId: string,
    locale?: string,
    tx?: DBTransaction
  ): Promise<StaffPermissionGroupReturnType[]> {
    const q = queryDb(tx) ?? db;

    const rows = await q
      .select({
        id: permissionGroups.id,
        name: permissionGroups.name,
        slug: permissionGroups.slug,
        description: permissionGroups.description,
      })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId));

    const result = rows.map(row => mapPermissionGroupRow(row, locale));

    return result.toSorted((a, b) => a.name.localeCompare(b.name));
  }

  export async function getUserPermissionOverrides(
    userId: string,
    tx?: DBTransaction
  ): Promise<StaffPermissionOverrideReturnType[]> {
    const q = queryDb(tx) ?? db;

    const rows = await q
      .select({
        permissionId: userPermissionOverrides.permissionId,
        permissionKey: permissions.key,
        resource: permissions.resource,
        action: permissions.action,
        state: userPermissionOverrides.state,
      })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
      .where(eq(userPermissionOverrides.userId, userId))
      .orderBy(permissions.resource, permissions.action);

    return rows.map(row => ({
      id: row.permissionId,
      permissionId: row.permissionId,
      permissionKey: row.permissionKey,
      resource: row.resource,
      action: row.action,
      state: parseOverrideState(row.state) ?? OverrideState.DENIED,
    }));
  }
}
