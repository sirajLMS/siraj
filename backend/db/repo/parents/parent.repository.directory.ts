import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db, queryWithPagination } from "@/backend/db";
import {
  buildDirectoryConditions,
  fetchDirectoryMetrics,
  fetchUnpaidInvoiceCounts,
  type ParentDirectoryResult,
} from "@/backend/db/repo/parents/parent.repository.helpers";
import { parents, students, users } from "@/backend/db/schema";
import type { ParentStatus } from "@/backend/enum";
import type { DBTransaction, PaginationArgs, ParentDirectoryAutocompleteRow } from "@/backend/types";
import { PaginationUtils } from "@/backend/utils";

export const getParentDirectoryImpl = async (
  options: {
    search?: string | null;
    pagination?: PaginationArgs | null;
    lifecycleStatus?: ParentStatus | null;
  },
  tx?: DBTransaction
): Promise<ParentDirectoryResult> => {
  const executor = tx ?? db;

  const metrics = await fetchDirectoryMetrics(executor);
  const conditions = buildDirectoryConditions(options);

  let rowsQuery = executor
    .select({
      id: parents.id,
      userId: parents.userId,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      lifecycleStatus: parents.status,
      accountStatus: users.status,
      updatedAt: parents.updatedAt,
    })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(parents.updatedAt))
    .$dynamic();

  if (options.pagination) {
    rowsQuery = queryWithPagination(rowsQuery, options.pagination);
  }

  const rows = await rowsQuery;

  const [totalCount, unpaidMap] = await Promise.all([
    executor
      .select({ count: count() })
      .from(parents)
      .innerJoin(users, eq(parents.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined),
    fetchUnpaidInvoiceCounts(
      executor,
      rows.map(r => r.id)
    ),
  ]);

  const rowsWithUnpaid = rows.map(r => Object.assign(r, { unpaidInvoices: unpaidMap.get(r.id) ?? 0 }));

  const total = totalCount[0]?.count ?? 0;
  const pageInfo = PaginationUtils.buildPageInfoFromArgs(options.pagination ?? null, rowsWithUnpaid.length, total);

  return {
    metrics,
    rows: rowsWithUnpaid,
    totalCount: total,
    pageInfo,
  };
};

export const findParentsDirectoryLiteImpl = async (
  options: { search?: string | null; limit: number },
  tx?: DBTransaction
): Promise<ParentDirectoryAutocompleteRow[]> => {
  const executor = tx ?? db;
  const conditions = buildDirectoryConditions({ search: options.search });

  return await executor
    .select({
      id: parents.id,
      name: users.name,
      avatarUrl: users.avatarUrl,
      email: users.email,
    })
    .from(parents)
    .innerJoin(users, eq(parents.userId, users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(parents.updatedAt))
    .limit(options.limit);
};

export const getStudentsForParentImpl = async (parentId: string, tx?: DBTransaction): Promise<{ name: string }[]> => {
  const executor = tx ?? db;
  return await executor.select({ name: students.name }).from(students).where(eq(students.parentId, parentId)).limit(5);
};

export const getStudentsForParentsImpl = async (
  parentIds: readonly string[],
  tx?: DBTransaction
): Promise<Map<string, { name: string }[]>> => {
  const executor = tx ?? db;

  if (parentIds.length === 0) {
    return new Map();
  }

  const rows = await executor
    .select({
      parentId: students.parentId,
      name: students.name,
    })
    .from(students)
    .where(inArray(students.parentId, [...parentIds]))
    .limit(5 * parentIds.length);

  const result = new Map<string, { name: string }[]>();
  for (const id of parentIds) {
    result.set(id, []);
  }
  for (const row of rows) {
    if (row.parentId) {
      result.get(row.parentId)?.push({ name: row.name });
    }
  }
  return result;
};
