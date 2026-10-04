import { and, count, eq, type SQL } from "drizzle-orm";
import { caseInsensitiveLike, type db, type QueryDbHandle } from "@/backend/db";
import { UserRepository } from "@/backend/db/repo/users";
import { permissionGroups, staffProfiles, userPermissionGroups, users } from "@/backend/db/schema";
import { AccountStatus } from "@/backend/enum";
import { logger } from "@/backend/lib/logger";
import type {
  DBQueryExecutor,
  DBTransaction,
  ManagerDirectoryFilters,
  ManagerDirectoryMetrics,
  ManagerDirectoryRow,
  ManagerProfileUpdateInput,
  StaffPermissionGroupReturnType,
} from "@/backend/types";
import { parseAccountStatus, parseCurrencyCodeOrNull } from "@/shared/lib/enum";
import { resolveLocalizedString } from "@/shared/lib/localized-string";
import { getServerTranslations } from "@/shared/locale";
import type { LocalizedString } from "@/shared/types";

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

export function buildManagerDirectoryBaseQuery(q: QueryDbHandle | DBTransaction, whereClause: SQL | undefined) {
  return q
    .select(MANAGER_DIRECTORY_SELECT)
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id))
    .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
    .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
    .where(whereClause);
}

export function buildManagerDirectoryCountQuery(q: QueryDbHandle | DBTransaction, whereClause: SQL | undefined) {
  return q
    .select({ count: count() })
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id))
    .leftJoin(userPermissionGroups, eq(users.id, userPermissionGroups.userId))
    .leftJoin(permissionGroups, eq(userPermissionGroups.groupId, permissionGroups.id))
    .where(whereClause);
}

export function mapManagerDirectoryRow(
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

export function buildManagerDirectoryWhere(filters?: ManagerDirectoryFilters) {
  const conditions: ReturnType<typeof and> = and(resolveRoleCondition(filters), resolveStatusCondition(filters));
  return conditions ?? undefined;
}

export async function getManagerDirectoryMetrics(
  executor: typeof db | DBTransaction
): Promise<ManagerDirectoryMetrics> {
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

export async function findManagerDirectoryRow(
  whereCondition: ReturnType<typeof eq>,
  queryDbInstance: DBQueryExecutor,
  locale?: string
): Promise<ManagerDirectoryRow | null> {
  const results = await buildManagerDirectoryBaseQuery(queryDbInstance, whereCondition).limit(1);
  return results[0] ? mapManagerDirectoryRow(results[0], locale) : null;
}

export async function applyManagerProfileUpdate(
  t: DBTransaction,
  staffProfileId: string,
  input: ManagerProfileUpdateInput,
  locale?: string
): Promise<ManagerDirectoryRow> {
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

  const updated = await buildManagerDirectoryBaseQuery(t, eq(staffProfiles.id, staffProfileId)).limit(1);

  if (updated.length === 0) {
    throw new Error(errorsTranslations.teacher.staffProfileUpdateFailed);
  }

  logger.info("Manager profile updated", { staffProfileId });

  return mapManagerDirectoryRow(updated[0], locale);
}

export function buildStaffProfileStatusQuery(q: QueryDbHandle | DBTransaction) {
  return q
    .select({
      status: users.status,
      createdAt: staffProfiles.createdAt,
      updatedAt: staffProfiles.updatedAt,
    })
    .from(staffProfiles)
    .innerJoin(users, eq(staffProfiles.userId, users.id));
}

export function aggregateOnboardingMetrics(
  rows: readonly { status: string; createdAt: Date | null; updatedAt: Date | null }[],
  ninetyDaysAgo: Date
): { activeStaff: number; pendingApproval: number; avgOnboardingDays: number } {
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
    activeStaff,
    pendingApproval,
    avgOnboardingDays: Math.round(avgOnboardingDays * 10) / 10,
  };
}

export function mapPermissionGroupRow(
  row: { id: string; name: LocalizedString; slug: string; description: LocalizedString | null },
  locale?: string
): StaffPermissionGroupReturnType {
  const description = resolveLocalizedString(row.description, locale);
  return {
    id: row.id,
    name: resolveLocalizedString(row.name, locale),
    slug: row.slug,
    description: description === "" ? null : description,
  };
}
