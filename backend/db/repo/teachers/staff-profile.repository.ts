import { and, count, eq, inArray, or } from "drizzle-orm";
import { caseInsensitiveLike, db, queryDb } from "@/backend/db";
import { UserRepository } from "@/backend/db/repo/users";
import {
  permissionGroups,
  permissions,
  staffProfiles,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import { AccountStatus, OverrideState } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  DBQueryExecutor,
  DBTransaction,
  ManagerDirectoryFilters,
  ManagerDirectoryMetrics,
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
import { parseAccountStatus, parseCurrencyCodeOrNull, parseOverrideState } from "@/shared/lib/enum";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { getServerTranslations } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

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

  const MANAGER_DIRECTORY_SELECT = {
    id: users.id,
    staffProfileId: staffProfiles.id,
    name: users.name,
    email: users.email,
    avatarUrl: users.avatarUrl,
    phone: users.phone,
    status: users.status,
    roleSlug: permissionGroups.slug,
    roleNameMap: permissionGroups.name,
    hourlyRate: staffProfiles.hourlyRate,
    rateCurrency: staffProfiles.rateCurrency,
  } as const;

  function mapManagerDirectoryRow(
    row: {
      id: string;
      staffProfileId: string;
      name: string;
      email: string;
      avatarUrl: string | null;
      phone: string | null;
      status: string;
      roleSlug: string | null;
      roleNameMap: LocalizedString | null;
      hourlyRate: string | null;
      rateCurrency: string | null;
    },
    locale?: string
  ): ManagerDirectoryRow {
    return {
      id: row.id,
      staffProfileId: row.staffProfileId,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatarUrl,
      phone: row.phone,
      status: parseAccountStatus(row.status),
      roleSlug: row.roleSlug,
      roleName: row.roleNameMap ? resolveLocalizedString(row.roleNameMap, locale) : null,
      hourlyRate: row.hourlyRate,
      rateCurrency: parseCurrencyCodeOrNull(row.rateCurrency),
    };
  }

  function resolveRoleCondition(filters?: ManagerDirectoryFilters) {
    if (filters?.roleFilter === "admin") {
      return caseInsensitiveLike(permissionGroups.slug, "%admin%");
    }
    if (filters?.roleFilter === "supervisor") {
      return caseInsensitiveLike(permissionGroups.slug, "%supervisor%");
    }
    if (filters?.roleFilter === "manager") {
      return caseInsensitiveLike(permissionGroups.slug, "%admin%");
    }
    return undefined;
  }

  function resolveStatusCondition(filters?: ManagerDirectoryFilters) {
    if (filters?.statusFilter === "active") {
      return eq(users.status, AccountStatus.ACTIVATED);
    }
    if (filters?.statusFilter === "offline") {
      return eq(users.status, AccountStatus.DEACTIVATED);
    }
    return undefined;
  }

  function buildManagerDirectoryWhere(filters?: ManagerDirectoryFilters) {
    const conditions: ReturnType<typeof and> = and(resolveRoleCondition(filters), resolveStatusCondition(filters));
    return conditions ?? undefined;
  }

  export async function getManagerDirectory(
    pagination: PaginationArgs | null = null,
    filters?: ManagerDirectoryFilters,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryResult> {
    const executor = tx ?? db;
    const whereClause = buildManagerDirectoryWhere(filters);

    const baseQuery = executor
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(whereClause)
      .orderBy(users.name);

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
      executor
        .select({ count: count() })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(whereClause),
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

  async function getManagerDirectoryMetrics(executor: typeof db | DBTransaction): Promise<ManagerDirectoryMetrics> {
    const rows = await executor
      .select({
        userId: users.id,
        userStatus: users.status,
        groupSlug: permissionGroups.slug,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id));

    const adminUserIds = new Set<string>();
    const nonAdminUserIds = new Set<string>();
    const activeUserIds = new Set<string>();
    const alertUserIds = new Set<string>();

    for (const r of rows) {
      const slug = r.groupSlug?.toLowerCase() ?? "";
      if (slug.includes("admin")) {
        adminUserIds.add(r.userId);
      } else {
        nonAdminUserIds.add(r.userId);
      }
      if (r.userStatus === "ACTIVATED") {
        activeUserIds.add(r.userId);
      } else {
        alertUserIds.add(r.userId);
      }
    }

    return {
      id: "manager-directory-metrics",
      totalAdmin: adminUserIds.size,
      systemStaff: nonAdminUserIds.size,
      activeNow: activeUserIds.size,
      alerts: alertUserIds.size,
    };
  }

  export async function getOnboardingMetrics(tx?: DBTransaction): Promise<OnboardingMetricsResult> {
    const q = queryDb(tx) ?? db;

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const rows = await q
      .select({
        status: users.status,
        createdAt: staffProfiles.createdAt,
        updatedAt: staffProfiles.updatedAt,
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id));

    let activeStaff = 0;
    let pendingApproval = 0;
    let totalDays = 0;
    let countInNinetyDays = 0;

    for (const row of rows) {
      if (row.status === "ACTIVATED") activeStaff++;
      if (row.status === "DEACTIVATED") pendingApproval++;
      if (row.createdAt && row.createdAt >= ninetyDaysAgo && row.updatedAt) {
        const diffMs = row.updatedAt.getTime() - row.createdAt.getTime();
        totalDays += diffMs / (1000 * 86400);
        countInNinetyDays++;
      }
    }

    const avgOnboardingDays = countInNinetyDays > 0 ? totalDays / countInNinetyDays : 0;

    return {
      id: "onboarding-metrics",
      activeStaff,
      pendingApproval,
      avgOnboardingDays: Math.round(avgOnboardingDays * 10) / 10,
    };
  }

  async function findManagerDirectoryRow(
    whereCondition: ReturnType<typeof eq>,
    queryDbInstance: DBQueryExecutor,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const results = await queryDbInstance
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(whereCondition)
      .limit(1);

    return results[0] ? mapManagerDirectoryRow(results[0], locale) : null;
  }

  export async function findByUserId(
    userId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const q = queryDb(tx) ?? db;
    return findManagerDirectoryRow(eq(users.id, userId), q, locale);
  }

  export async function findByUserIds(
    userIds: readonly string[],
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow[]> {
    if (userIds.length === 0) return [];

    const q = queryDb(tx) ?? db;
    const uniqueIds = [...new Set(userIds)];
    const rows = await q
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(inArray(users.id, uniqueIds));

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
    const updateTx = async (t: DBTransaction): Promise<ManagerDirectoryRow> => {
      const errorsTranslations = getServerTranslations(locale ?? "en").errorsTranslations;

      const existing = await t.select().from(staffProfiles).where(eq(staffProfiles.id, staffProfileId)).limit(1);

      if (existing.length === 0) {
        throw new Error(errorsTranslations.staffProfileNotFound);
      }

      const profile = existing[0];
      const hasUserFieldUpdate = input.phoneIsSet ?? input.statusIsSet;
      const hasStaffFieldUpdate = input.hourlyRateIsSet ?? input.rateCurrencyIsSet;

      if (input.phoneIsSet) {
        await UserRepository.updateProfileFields(profile.userId, { phone: input.phone ?? null }, locale, t);
      }

      if (input.statusIsSet) {
        const status = parseAccountStatus(input.status ?? AccountStatus.ACTIVATED) ?? AccountStatus.ACTIVATED;
        await UserRepository.updateStatus(profile.userId, status, t, locale);
      }

      if (hasStaffFieldUpdate) {
        await t
          .update(staffProfiles)
          .set({
            ...(input.hourlyRateIsSet ? { hourlyRate: input.hourlyRate ?? null } : {}),
            ...(input.rateCurrencyIsSet ? { rateCurrency: parseCurrencyCodeOrNull(input.rateCurrency ?? null) } : {}),
            updatedAt: new Date(),
          })
          .where(eq(staffProfiles.id, staffProfileId));
      } else if (hasUserFieldUpdate) {
        await t.update(staffProfiles).set({ updatedAt: new Date() }).where(eq(staffProfiles.id, staffProfileId));
      }

      const updated = await t
        .select(MANAGER_DIRECTORY_SELECT)
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(eq(staffProfiles.id, staffProfileId))
        .limit(1);

      if (updated.length === 0) {
        throw new Error(errorsTranslations.teacher.staffProfileUpdateFailed);
      }

      logger.info("Manager profile updated", { staffProfileId });

      return mapManagerDirectoryRow(updated[0], locale);
    };

    if (tx) {
      return await updateTx(tx);
    }
    return await db.transaction(updateTx);
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

    const result = rows.map(row => {
      const description = resolveLocalizedString(row.description, locale);
      return {
        id: row.id,
        name: resolveLocalizedString(row.name, locale),
        slug: row.slug,
        description: description === "" ? null : description,
      };
    });

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
