import { aliasedTable, and, count, desc, eq, gte, ilike, isNull, ne, sql } from "drizzle-orm";
import { db, isSqlite, queryDb } from "@/backend/db";
import { parents, suggestions, users } from "@/backend/db/schema";
import { SuggestionStatus } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib/errors";
import type {
  DBTransaction,
  SuggestionContributorStats,
  SuggestionInsertType,
  SuggestionReturnType,
  SuggestionSubmitInput,
} from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";
import { getServerTranslations } from "@/shared/locale";

function isSuggestionStatus(value: string): value is SuggestionStatus {
  return (Object.values(SuggestionStatus) as readonly string[]).includes(value);
}

const commonSuggestionColumns = {
  parentName: users.name,
  submitterName: suggestions.submitterName,
  body: suggestions.body,
  status: suggestions.status,
  adminResponse: suggestions.adminResponse,
  duplicateOfId: suggestions.duplicateOfId,
  reviewedByUserId: suggestions.reviewedByUserId,
  reviewedAt: suggestions.reviewedAt,
  createdAt: suggestions.createdAt,
};

export namespace SuggestionRepository {
  export type SuggestionInsertInput = {
    parentId: string;
    submitterName: string;
    body: string;
    status: SuggestionStatus;
    adminResponse?: string | null;
    reviewedByUserId?: string | null;
    reviewedAt?: Date | null;
    createdAt?: Date;
  };

  export const insertSuggestion = async (input: SuggestionInsertInput, tx?: DBTransaction) => {
    const q = queryDb(tx);
    const now = new Date();
    const [created] = await q
      .insert(suggestions)
      .values({
        parentId: input.parentId,
        submitterName: input.submitterName,
        body: input.body,
        status: input.status,
        adminResponse: input.adminResponse ?? null,
        reviewedByUserId: input.reviewedByUserId ?? null,
        reviewedAt: input.reviewedAt ?? null,
        createdAt: input.createdAt ?? now,
      })
      .returning();
    if (!created) {
      const { parent } = getServerTranslations("en").errorsTranslations;
      throw new Error(parent.suggestionSubmitFailed);
    }
    return created;
  };

  export const submitSuggestion = async (
    input: SuggestionSubmitInput & { parentId: string },
    tx?: DBTransaction,
    locale?: string
  ) => {
    const q = queryDb(tx);
    const now = new Date();

    const [created] = await q
      .insert(suggestions)
      .values({
        parentId: input.parentId,
        submitterName: input.submitterName,
        body: input.body,
        createdAt: now,
      })
      .returning();

    if (!created) {
      const { parent } = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new Error(parent.suggestionSubmitFailed);
    }

    return created;
  };

  export const getSuggestionsByParent = async (
    parentId: string,
    options: { limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<SuggestionReturnType[]> => {
    const q = queryDb(tx);

    const dupSuggestions = aliasedTable(suggestions, "dup_suggestions");

    const rows = await q
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        status: suggestions.status,
        adminResponse: suggestions.adminResponse,
        duplicateOfId: suggestions.duplicateOfId,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewedAt: suggestions.reviewedAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(dupSuggestions, and(eq(suggestions.duplicateOfId, dupSuggestions.id), isNull(dupSuggestions.deletedAt)))
      .where(and(eq(suggestions.parentId, parentId), isNull(suggestions.deletedAt)))
      .orderBy(desc(suggestions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return rows;
  };

  export type AdminSuggestionQueueRow = {
    id: string;
    parentId: string;
    parentUserId: string | null;
    parentName: string;
    submitterName: string;
    body: string;
    status: string;
    adminResponse: string | null;
    duplicateOfId: string | null;
    duplicateOfBody: string | null;
    duplicateOfSubmitterName: string | null;
    reviewedByUserId: string | null;
    reviewerName: string | null;
    reviewedAt: Date | null;
    createdAt: Date;
  };

  export type AdminSuggestionQueueResult = {
    rows: AdminSuggestionQueueRow[];
    totalCount: number;
  };

  export const getAdminSuggestionQueue = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminSuggestionQueueResult> => {
    const q = queryDb(tx);

    const dupSuggestions = aliasedTable(suggestions, "dup_suggestions");

    const conditions = [isNull(suggestions.deletedAt)];

    if (options.status && isSuggestionStatus(options.status)) {
      conditions.push(eq(suggestions.status, options.status));
    }

    if (options.search) {
      conditions.push(ilike(users.name, `%${escapeLikeWildcards(options.search)}%`));
    }

    const whereClause = and(...conditions);

    const rows = await q
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        parentUserId: parents.userId,
        ...commonSuggestionColumns,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewerName: sql<string | null>`COALESCE(${users.name}, NULL)`,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(dupSuggestions, and(eq(suggestions.duplicateOfId, dupSuggestions.id), isNull(dupSuggestions.deletedAt)))
      .where(whereClause)
      .orderBy(desc(suggestions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totalCount] = await q
      .select({ count: count() })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(whereClause);

    return {
      rows,
      totalCount: totalCount?.count ?? 0,
    };
  };

  export type SuggestionDetailRow = {
    id: string;
    parentId: string;
    parentName: string;
    submitterName: string;
    body: string;
    status: string;
    adminResponse: string | null;
    duplicateOfId: string | null;
    duplicateOfBody: string | null;
    duplicateOfSubmitterName: string | null;
    reviewedByUserId: string | null;
    reviewerName: string | null;
    reviewedAt: Date | null;
    emailSentAt: Date | null;
    createdAt: Date;
  };

  export const getSuggestionById = async (
    suggestionId: string,
    tx?: DBTransaction
  ): Promise<SuggestionDetailRow | null> => {
    const q = queryDb(tx);

    const dupSuggestions = aliasedTable(suggestions, "dup_suggestions");
    const reviewerUsers = aliasedTable(users, "reviewer_users");

    const results = await q
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        ...commonSuggestionColumns,
        duplicateOfBody: sql<string | null>`COALESCE(${dupSuggestions.body}, NULL)`,
        duplicateOfSubmitterName: sql<string | null>`COALESCE(${dupSuggestions.submitterName}, NULL)`,
        reviewerName: sql<string | null>`COALESCE(${reviewerUsers.name}, NULL)`,
        emailSentAt: suggestions.emailSentAt,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .leftJoin(dupSuggestions, eq(suggestions.duplicateOfId, dupSuggestions.id))
      .leftJoin(reviewerUsers, eq(suggestions.reviewedByUserId, reviewerUsers.id))
      .where(and(eq(suggestions.id, suggestionId), isNull(suggestions.deletedAt)))
      .limit(1);

    return results[0] ?? null;
  };

  const updateSuggestionStatus = async (
    suggestionId: string,
    fields: Partial<SuggestionInsertType>,
    tx?: DBTransaction,
    _locale?: string
  ) => {
    const runner = async (t: DBTransaction) => {
      const [updated] = await t
        .update(suggestions)
        .set({ ...fields, reviewedAt: new Date() })
        .where(and(eq(suggestions.id, suggestionId), isNull(suggestions.deletedAt)))
        .returning();

      if (!updated) {
        throw new NotFoundError("SUGGESTION", `Suggestion ${suggestionId} not found`);
      }

      return updated;
    };

    return tx ? runner(tx) : db.transaction(runner);
  };

  export const markSuggestionReviewed = async (
    input: { suggestionId: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) =>
    updateSuggestionStatus(
      input.suggestionId,
      { status: SuggestionStatus.REVIEWED, reviewedByUserId: input.reviewedByUserId },
      tx,
      locale
    );

  export const respondToSuggestion = async (
    input: { suggestionId: string; adminResponse: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) =>
    updateSuggestionStatus(
      input.suggestionId,
      {
        status: SuggestionStatus.REVIEWED,
        adminResponse: input.adminResponse,
        reviewedByUserId: input.reviewedByUserId,
      },
      tx,
      locale
    );

  export const markAsDuplicate = async (
    input: { suggestionId: string; duplicateOfId: string; reviewedByUserId: string },
    tx?: DBTransaction,
    locale?: string
  ) =>
    updateSuggestionStatus(
      input.suggestionId,
      {
        status: SuggestionStatus.DUPLICATE,
        duplicateOfId: input.duplicateOfId,
        reviewedByUserId: input.reviewedByUserId,
      },
      tx,
      locale
    );

  export type SuggestionSearchResult = {
    id: string;
    body: string;
    submitterName: string;
    status: string;
    createdAt: Date;
  };

  export const searchSuggestions = async (
    query: string,
    excludeId: string,
    tx?: DBTransaction
  ): Promise<SuggestionSearchResult[]> => {
    const q = queryDb(tx);

    const rows = await q
      .select({
        id: suggestions.id,
        body: suggestions.body,
        submitterName: suggestions.submitterName,
        status: suggestions.status,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .where(
        and(
          ilike(suggestions.body, `%${escapeLikeWildcards(query)}%`),
          ne(suggestions.id, excludeId),
          isNull(suggestions.deletedAt),
          ne(suggestions.status, SuggestionStatus.DUPLICATE)
        )
      )
      .orderBy(desc(suggestions.createdAt))
      .limit(10);

    return rows;
  };

  export type SuggestionMetrics = {
    pending: number;
    reviewed: number;
    duplicate: number;
    avgResponseHours: number;
  };

  export const getSuggestionMetrics = async (tx?: DBTransaction): Promise<SuggestionMetrics> => {
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

  export type ContributorRow = {
    parentId: string;
    name: string;
    suggestionCount: number;
  };

  export const getContributorStats = async (days: number, tx?: DBTransaction): Promise<SuggestionContributorStats> => {
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
}
