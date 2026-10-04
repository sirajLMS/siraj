import { and, count, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";

import { isSqlite, queryDb } from "@/backend/db";
import { parents, suggestions, users } from "@/backend/db/schema";
import { SuggestionStatus } from "@/backend/enum";
import type { DBTransaction, SuggestionContributorStats } from "@/backend/types";

type SuggestionMetrics = {
  pending: number;
  reviewed: number;
  duplicate: number;
  avgResponseHours: number;
};

export const getSuggestionMetricsImpl = async (tx?: DBTransaction): Promise<SuggestionMetrics> => {
  const q = queryDb(tx);

  const statusCounts = await q
    .select({
      status: suggestions.status,
      count: count(),
    })
    .from(suggestions)
    .where(isNull(suggestions.deletedAt))
    .groupBy(suggestions.status);

  const pending = statusCounts.find((r: { status: string; count: number }) => r.status === "PENDING")?.count ?? 0;
  const reviewed = statusCounts.find((r: { status: string; count: number }) => r.status === "REVIEWED")?.count ?? 0;
  const duplicate = statusCounts.find((r: { status: string; count: number }) => r.status === "DUPLICATE")?.count ?? 0;

  const epochExprSuggestion = isSqlite()
    ? sql<number>`((${suggestions.reviewedAt} - ${suggestions.createdAt}) / 1000.0 / 3600.0)`
    : sql<number>`EXTRACT(EPOCH FROM (${suggestions.reviewedAt} - ${suggestions.createdAt})) / 3600`;

  const [avgResult] = await q
    .select({
      avgHours: sql<number>`COALESCE(AVG(${epochExprSuggestion}), 0)`.mapWith(Number),
    })
    .from(suggestions)
    .where(and(isNull(suggestions.deletedAt), ne(suggestions.status, SuggestionStatus.PENDING)));

  return {
    pending,
    reviewed,
    duplicate,
    avgResponseHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
  };
};

export const getContributorStatsImpl = async (
  days: number,
  tx?: DBTransaction
): Promise<SuggestionContributorStats> => {
  const q = queryDb(tx);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const baseWhere = and(isNull(suggestions.deletedAt), gte(suggestions.createdAt, cutoffDate));

  const [contributorRows, uniqueContributorResult] = await Promise.all([
    q
      .select({
        parentId: suggestions.parentId,
        name: users.name,
        suggestionCount: count(),
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(baseWhere)
      .groupBy(suggestions.parentId, users.name)
      .orderBy(desc(count()))
      .limit(10),
    q
      .select({
        count: sql<number>`COUNT(DISTINCT ${suggestions.parentId})`.mapWith(Number),
      })
      .from(suggestions)
      .where(baseWhere),
  ]);

  return {
    id: "suggestion-contributor-stats",
    uniqueContributorCount: uniqueContributorResult[0]?.count ?? 0,
    contributors: contributorRows.map(row => ({
      id: row.parentId,
      name: row.name ?? "",
      suggestionCount: row.suggestionCount,
    })),
  };
};
