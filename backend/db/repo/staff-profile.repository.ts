import { and, count, eq, ilike, isNull, notIlike, or, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import {
  permissionGroups,
  permissions,
  staffProfiles,
  userPermissionGroups,
  userPermissionOverrides,
  users,
} from "@/backend/db/schema";
import type { AccountStatus, OverrideState } from "@/backend/enum";
import { getBackendTranslations } from "@/backend/lib/intl";
import { logger } from "@/backend/lib/logger";
import type {
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
import type { DBTransaction } from "../db.types";

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
        phone: input.phone ?? null,
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
      createdAt: created.createdAt,
    };
  }

  const MANAGER_DIRECTORY_SELECT = {
    id: users.id,
    staffProfileId: staffProfiles.id,
    name: users.name,
    email: users.email,
    avatarUrl: users.avatarUrl,
    phone: staffProfiles.phone,
    status: staffProfiles.status,
    roleSlug: permissionGroups.slug,
    roleName: permissionGroups.name,
  } as const;

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
      return eq(staffProfiles.status, "ACTIVATED");
    }
    if (filters?.statusFilter === "offline") {
      return eq(staffProfiles.status, "DEACTIVATED");
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
    tx?: DBTransaction
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
        rows: rows.map(row => ({ ...row, status: row.status as AccountStatus })),
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
      rows: rows.map(row => ({ ...row, status: row.status as AccountStatus })),
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
        activeNow:
          sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${staffProfiles.status} = 'ACTIVATED')`.mapWith(Number),
        alerts: sql<number>`COUNT(DISTINCT ${users.id}) FILTER (WHERE ${staffProfiles.status} != 'ACTIVATED')`.mapWith(
          Number
        ),
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
        activeStaff: sql<number>`COUNT(*) FILTER (WHERE ${staffProfiles.status} = 'ACTIVATED')`.mapWith(Number),
        pendingApproval: sql<number>`COUNT(*) FILTER (WHERE ${staffProfiles.status} = 'DEACTIVATED')`.mapWith(Number),
        avgOnboardingDays:
          sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${staffProfiles.updatedAt} - ${staffProfiles.createdAt})) / 86400) FILTER (WHERE ${staffProfiles.createdAt} >= ${ninetyDaysAgo}), 0)`.mapWith(
            Number
          ),
      })
      .from(staffProfiles);

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
    queryDb: typeof db | DBTransaction
  ): Promise<ManagerDirectoryRow | null> {
    const results = await queryDb
      .select(MANAGER_DIRECTORY_SELECT)
      .from(staffProfiles)
      .innerJoin(users, eq(staffProfiles.userId, users.id))
      .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
      .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(whereCondition)
      .limit(1);

    return (results[0] ? { ...results[0], status: results[0].status as AccountStatus } : null) ?? null;
  }

  export async function findByUserId(userId: string, tx?: DBTransaction): Promise<ManagerDirectoryRow | null> {
    const queryDb = tx ?? db;
    return findManagerDirectoryRow(eq(users.id, userId), queryDb);
  }

  export async function findByStaffProfileId(
    staffProfileId: string,
    tx?: DBTransaction
  ): Promise<ManagerDirectoryRow | null> {
    const queryDb = tx ?? db;
    return findManagerDirectoryRow(eq(staffProfiles.id, staffProfileId), queryDb);
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
      if (input.statusIsSet) {
        updateSet.status = input.status ?? "ACTIVATED";
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

      return { ...updated[0], status: updated[0].status as AccountStatus };
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
    tx?: DBTransaction
  ): Promise<StaffPermissionGroupReturnType[]> {
    const queryDb = tx ?? db;

    return queryDb
      .select({
        id: permissionGroups.id,
        name: permissionGroups.name,
        slug: permissionGroups.slug,
        description: permissionGroups.description,
      })
      .from(userPermissionGroups)
      .innerJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
      .where(eq(userPermissionGroups.userId, userId))
      .orderBy(permissionGroups.name);
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
      state: row.state as OverrideState,
    }));
  }
}
