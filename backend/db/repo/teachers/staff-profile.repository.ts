import { and, count, eq, ilike, isNull, notIlike, or, sql } from "drizzle-orm";
import type { DBTransaction } from "@/backend/db/db.types";
import { db } from "@/backend/db/drizzleDb";
import { UserRepository } from "@/backend/db/repo/users/user.repository";
import { localeJsonKey, resolveLocalized } from "@/backend/db/repo/utils/resolve-localized";
import {
  permissionGroups,
  permissions,
  staffProfiles,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import { AccountStatus, OverrideState } from "@/backend/enum";
import { parseAccountStatus, parseOverrideState } from "@/backend/lib/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
  LocalizedString,
  ManagerDirectoryFilters,
  ManagerDirectoryMetrics,
  ManagerDirectoryResult,
  ManagerDirectoryRow,
  OnboardingMetricsResult,
  PaginationArgs,
  StaffPermissionGroupReturnType,
  StaffPermissionOverrideReturnType,
  StaffProfileCreateResult,
  StaffProfileEntityInput,
} from "@/backend/types";
import { DEFAULT_CONTENT_LOCALE } from "@/backend/types/shared/localized-string.types";

export interface ManagerProfileUpdateInput {
  readonly phone?: string | null;
  readonly phoneIsSet?: boolean;
  readonly status?: string | null;
  readonly statusIsSet?: boolean;
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
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("staff.createFailed"));
    }

    const [userRow] = await queryDb
      .select({ phone: users.phone, status: users.status })
      .from(users)
      .where(eq(users.id, created.userId))
      .limit(1);

    if (!userRow) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("userNotFound", { id: created.userId }));
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
    const queryDb = tx ?? db;
    const now = new Date();
    await queryDb
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
      roleName: row.roleNameMap ? resolveLocalized(row.roleNameMap, locale) : null,
    };
  }

  function resolveRoleCondition(filters?: ManagerDirectoryFilters) {
    if (filters?.roleFilter === "admin") {
      return ilike(permissionGroups.slug, "%admin%");
    }
    if (filters?.roleFilter === "staff") {
      return or(
        isNull(permissionGroups.slug),
        and(notIlike(permissionGroups.slug, "%admin%"), ilike(permissionGroups.slug, "%staff%"))
      );
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
    const queryDb = tx ?? db;
    const whereClause = buildManagerDirectoryWhere(filters);

    const baseQuery = queryDb
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(whereClause)
      .orderBy(users.name);

    if (!pagination) {
      const [rows, metrics] = await Promise.all([baseQuery, getManagerDirectoryMetrics(queryDb)]);
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
      queryDb
        .select({ count: count() })
        .from(staffProfiles)
        .innerJoin(users, eq(staffProfiles.userId, users.id))
        .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
        .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
        .where(whereClause),
      getManagerDirectoryMetrics(queryDb),
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

  async function getManagerDirectoryMetrics(queryDb: typeof db | DBTransaction): Promise<ManagerDirectoryMetrics> {
    const metricsResult = await queryDb
      .select({
        totalAdmin:
          sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${permissionGroups.slug} ILIKE '%admin%')`.mapWith(
            Number
          ),
        systemStaff:
          sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${permissionGroups.slug} NOT ILIKE '%admin%')`.mapWith(
            Number
          ),
        activeNow: sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${users.status} = 'ACTIVATED')`.mapWith(
          Number
        ),
        alerts: sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${users.status} != 'ACTIVATED')`.mapWith(Number),
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id));

    const m = metricsResult[0];
    return {
      id: "manager-directory-metrics",
      totalAdmin: m?.totalAdmin ?? 0,
      systemStaff: m?.systemStaff ?? 0,
      activeNow: m?.activeNow ?? 0,
      alerts: m?.alerts ?? 0,
    };
  }

  export async function getOnboardingMetrics(tx?: DBTransaction): Promise<OnboardingMetricsResult> {
    const queryDb = tx ?? db;

    const ninetyDaysAgo = sql`NOW() - INTERVAL '90 days'`;

    const result = await queryDb
      .select({
        activeStaff: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'ACTIVATED')`.mapWith(Number),
        pendingApproval: sql<number>`COUNT(*) FILTER (WHERE ${users.status} = 'DEACTIVATED')`.mapWith(Number),
        avgOnboardingDays:
          sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${staffProfiles.updatedAt} - ${staffProfiles.createdAt})) / 86400) FILTER (WHERE ${staffProfiles.createdAt} >= ${ninetyDaysAgo}), 0)`.mapWith(
            Number
          ),
      })
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id));

    const r = result[0];
    return {
      id: "onboarding-metrics",
      activeStaff: r?.activeStaff ?? 0,
      pendingApproval: r?.pendingApproval ?? 0,
      avgOnboardingDays: Math.round((r?.avgOnboardingDays ?? 0) * 10) / 10,
    };
  }

  async function findManagerDirectoryRow(
    whereCondition: ReturnType<typeof eq>,
    queryDb: typeof db | DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const results = await queryDb
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
    const queryDb = tx ?? db;
    return findManagerDirectoryRow(eq(users.id, userId), queryDb, locale);
  }

  export async function findByStaffProfileId(
    staffProfileId: string,
    tx?: DBTransaction,
    locale?: string
  ): Promise<ManagerDirectoryRow | null> {
    const queryDb = tx ?? db;
    return findManagerDirectoryRow(eq(staffProfiles.id, staffProfileId), queryDb, locale);
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

      const profile = existing[0];
      const hasUserFieldUpdate = input.phoneIsSet || input.statusIsSet;

      if (input.phoneIsSet) {
        await UserRepository.updateProfileFields(profile.userId, { phone: input.phone ?? null }, locale, t);
      }

      if (input.statusIsSet) {
        const status = parseAccountStatus(input.status ?? AccountStatus.ACTIVATED) ?? AccountStatus.ACTIVATED;
        await UserRepository.updateStatus(profile.userId, status, t, locale);
      }

      if (hasUserFieldUpdate) {
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
        throw new Error(t18n("staffProfileUpdateFailed"));
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
    const queryDb = tx ?? db;

    const results = await queryDb
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
    const queryDb = tx ?? db;
    const key = localeJsonKey(locale);

    const rows = await queryDb
      .select({
        id: permissionGroups.id,
        name: permissionGroups.name,
        slug: permissionGroups.slug,
        description: permissionGroups.description,
      })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId))
      .orderBy(sql`coalesce(${permissionGroups.name}->>${key}, ${permissionGroups.name}->>${DEFAULT_CONTENT_LOCALE})`);

    return rows.map(row => {
      const description = resolveLocalized(row.description, locale);
      return {
        id: row.id,
        name: resolveLocalized(row.name, locale),
        slug: row.slug,
        description: description === "" ? null : description,
      };
    });
  }

  export async function getUserPermissionOverrides(
    userId: string,
    tx?: DBTransaction
  ): Promise<StaffPermissionOverrideReturnType[]> {
    const queryDb = tx ?? db;

    const rows = await queryDb
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
