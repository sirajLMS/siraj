import { and, count, desc, eq, ilike, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/backend/db/drizzleDb";
import { parents, suggestions, users } from "@/backend/db/schema";
import { getBackendTranslations } from "@/backend/lib/intl";

type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface SuggestionSubmitInput {
  parentId: string;
  submitterName: string;
  body: string;
}

export type AdminSuggestionRow = {
  id: string;
  parentId: string;
  parentName: string | null;
  submitterName: string;
  body: string;
  emailSentAt: Date | null;
  createdAt: Date;
};

export type AdminSuggestionResult = {
  rows: AdminSuggestionRow[];
  totalCount: number;
};

export type SuggestionMetrics = {
  pending: number;
  reviewed: number;
  avgResponseHours: number;
};

export namespace SuggestionRepository {
  export const submitSuggestion = async (input: SuggestionSubmitInput, tx?: DBTransaction, locale?: string) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [created] = await queryDb
      .insert(suggestions)
      .values({
        parentId: input.parentId,
        submitterName: input.submitterName,
        body: input.body,
        createdAt: now,
      })
      .returning();

    if (!created) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("suggestion.createFailed"));
    }

    return created;
  };

  export const getSuggestionsForAdmin = async (
    options: { search?: string | null; status?: string | null; limit: number; offset: number },
    tx?: DBTransaction
  ): Promise<AdminSuggestionResult> => {
    const queryDb = tx ?? db;

    const conditions = [];

    if (options.status === "PENDING") {
      conditions.push(isNull(suggestions.emailSentAt));
    } else if (options.status === "REVIEWED") {
      conditions.push(isNotNull(suggestions.emailSentAt));
    }

    if (options.search) {
      conditions.push(ilike(users.name, `%${options.search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await queryDb
      .select({
        id: suggestions.id,
        parentId: suggestions.parentId,
        parentName: users.name,
        submitterName: suggestions.submitterName,
        body: suggestions.body,
        emailSentAt: suggestions.emailSentAt,
        createdAt: suggestions.createdAt,
      })
      .from(suggestions)
      .leftJoin(parents, eq(suggestions.parentId, parents.id))
      .leftJoin(users, eq(parents.userId, users.id))
      .where(whereClause)
      .orderBy(desc(suggestions.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    const [totalCount] = await queryDb
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

  export const getSuggestionMetrics = async (tx?: DBTransaction): Promise<SuggestionMetrics> => {
    const queryDb = tx ?? db;

    const [pendingResult] = await queryDb
      .select({ count: count() })
      .from(suggestions)
      .where(isNull(suggestions.emailSentAt));

    const [reviewedResult] = await queryDb
      .select({ count: count() })
      .from(suggestions)
      .where(isNotNull(suggestions.emailSentAt));

    const [avgResult] = await queryDb
      .select({
        avgHours: sql<number>`COALESCE(
          AVG(
            EXTRACT(EPOCH FROM (${suggestions.emailSentAt} - ${suggestions.createdAt})) / 3600
          ), 0
        )`.mapWith(Number),
      })
      .from(suggestions)
      .where(isNotNull(suggestions.emailSentAt));

    return {
      pending: pendingResult?.count ?? 0,
      reviewed: reviewedResult?.count ?? 0,
      avgResponseHours: Math.round((avgResult?.avgHours ?? 0) * 100) / 100,
    };
  };

  export const markSuggestionReviewed = async (suggestionId: string, tx?: DBTransaction, locale?: string) => {
    const queryDb = tx ?? db;
    const now = new Date();

    const [updated] = await queryDb
      .update(suggestions)
      .set({ emailSentAt: now })
      .where(eq(suggestions.id, suggestionId))
      .returning();

    if (!updated) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("suggestion.notFound", { id: suggestionId }));
    }

    return updated;
  };
}
