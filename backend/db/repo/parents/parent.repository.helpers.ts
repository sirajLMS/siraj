import { and, count, eq, inArray, or, type SQL, sql } from "drizzle-orm";
import { caseInsensitiveLike, type db } from "@/backend/db";
import { invoices, parents, users } from "@/backend/db/schema";
import type { AccountStatus, ParentStatus } from "@/backend/enum";
import type { DBTransaction, PageInfo, ParentDirectoryRawMetrics, ParentDirectoryRawRow } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import type { CurrencyCode } from "@/shared/constants/currency.enum";
import type { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

type ParentDirectoryMetrics = ParentDirectoryRawMetrics;

type ParentDirectoryRow = ParentDirectoryRawRow;

export type ParentDirectoryResult = {
  metrics: ParentDirectoryMetrics;
  rows: ParentDirectoryRow[];
  totalCount: number;
  pageInfo: PageInfo | null;
};

export type ParentProfileResult = {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  lifecycleStatus: string;
  accountStatus: AccountStatus;
  phone: string | null;
  nationality: string | null;
  address: string | null;
  facebook: string | null;
  whatsapp: string | null;
  twitter: string | null;
  invoiceType: string | null;
  feeAmount: string | null;
  currency: CurrencyCode | null;
  displayCurrency: CurrencyCode | null;
  timezone: IanaTimezone;
  createdAt: Date;
  updatedAt: Date;
};

export async function fetchDirectoryMetrics(executor: typeof db | DBTransaction): Promise<ParentDirectoryMetrics> {
  const metricsResult = await executor
    .select({
      status: parents.status,
      count: count(),
    })
    .from(parents)
    .groupBy(parents.status);

  const metrics: ParentDirectoryMetrics = {
    regular: 0,
    onLeave: 0,
    suspended: 0,
    onTrial: 0,
  };

  for (const m of metricsResult) {
    if (m.status === "REGULAR") metrics.regular = m.count;
    else if (m.status === "ON_LEAVE") metrics.onLeave = m.count;
    else if (m.status === "SUSPENDED") metrics.suspended = m.count;
    else if (m.status === "ON_TRIAL") metrics.onTrial = m.count;
  }

  return metrics;
}

export function buildDirectoryConditions(options: {
  search?: string | null;
  lifecycleStatus?: ParentStatus | null;
}): (SQL | undefined)[] {
  const conditions: (SQL | undefined)[] = [];
  if (options.search) {
    conditions.push(
      or(
        caseInsensitiveLike(users.name, `%${escapeLikeWildcards(options.search)}%`),
        caseInsensitiveLike(users.email, `%${escapeLikeWildcards(options.search)}%`)
      )
    );
  }
  if (options.lifecycleStatus) {
    conditions.push(eq(parents.status, options.lifecycleStatus));
  }
  return conditions;
}

export async function fetchUnpaidInvoiceCounts(
  executor: typeof db | DBTransaction,
  parentIds: string[]
): Promise<Map<string, number>> {
  if (parentIds.length === 0) return new Map();

  const unpaidCounts = await executor
    .select({
      parentId: invoices.parentId,
      cnt: sql<number>`count(*)`.mapWith(Number),
    })
    .from(invoices)
    .where(and(inArray(invoices.parentId, parentIds), eq(invoices.status, "UNPAID")))
    .groupBy(invoices.parentId);

  const map = new Map<string, number>();
  for (const r of unpaidCounts) {
    if (r.parentId) {
      map.set(r.parentId, r.cnt);
    }
  }
  return map;
}
