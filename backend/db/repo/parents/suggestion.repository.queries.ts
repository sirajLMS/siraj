import { aliasedTable, and, count, desc, eq, isNull, ne, sql } from "drizzle-orm";

import { caseInsensitiveLike, queryDb } from "@/backend/db";
import { commonSuggestionColumns, isSuggestionStatus } from "@/backend/db/repo/parents/suggestion.repository.helpers";
import { parents, suggestions, users } from "@/backend/db/schema";
import { SuggestionStatus } from "@/backend/enum";
import type { DBTransaction, SuggestionReturnType } from "@/backend/types";
import { escapeLikeWildcards } from "@/backend/utils";

export const getSuggestionsByParentImpl = async (
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

type AdminSuggestionQueueRow = {
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

type AdminSuggestionQueueResult = {
  rows: AdminSuggestionQueueRow[];
  totalCount: number;
};

export const getAdminSuggestionQueueImpl = async (
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
    conditions.push(caseInsensitiveLike(users.name, `%${escapeLikeWildcards(options.search)}%`));
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

export const getSuggestionByIdImpl = async (
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

type SuggestionSearchResult = {
  id: string;
  body: string;
  submitterName: string;
  status: string;
  createdAt: Date;
};

export const searchSuggestionsImpl = async (
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
        caseInsensitiveLike(suggestions.body, `%${escapeLikeWildcards(query)}%`),
        ne(suggestions.id, excludeId),
        isNull(suggestions.deletedAt),
        ne(suggestions.status, SuggestionStatus.DUPLICATE)
      )
    )
    .orderBy(desc(suggestions.createdAt))
    .limit(10);

  return rows;
};
