import { and, eq, isNull } from "drizzle-orm";

import { db, queryDb } from "@/backend/db";
import {
  buildSuggestionInsertValues,
  type SuggestionInsertInput,
} from "@/backend/db/repo/parents/suggestion.repository.helpers";
import { suggestions } from "@/backend/db/schema";
import { SuggestionStatus } from "@/backend/enum";
import { NotFoundError } from "@/backend/lib/errors";
import type { DBTransaction, SuggestionInsertType, SuggestionSubmitInput } from "@/backend/types";
import { getServerTranslations } from "@/shared/locale";

export const insertSuggestionImpl = async (input: SuggestionInsertInput, tx?: DBTransaction) => {
  const q = queryDb(tx);
  const now = new Date();
  const [created] = await q.insert(suggestions).values(buildSuggestionInsertValues(input, now)).returning();
  if (!created) {
    const { parent } = getServerTranslations("en").errorsTranslations;
    throw new Error(parent.suggestionSubmitFailed);
  }
  return created;
};

/**
 * Batch insert suggestions — single SQL INSERT for N records instead of N round-trips.
 */
export const insertManySuggestionsImpl = async (inputs: SuggestionInsertInput[], tx?: DBTransaction) => {
  if (inputs.length === 0) {
    return [];
  }
  const q = queryDb(tx);
  const now = new Date();
  const values = inputs.map(input => buildSuggestionInsertValues(input, now));

  return q.insert(suggestions).values(values).returning();
};

export const submitSuggestionImpl = async (
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

const updateSuggestionStatus = async (
  suggestionId: string,
  fields: Partial<SuggestionInsertType>,
  tx?: DBTransaction,
  locale?: string
) => {
  const runner = async (t: DBTransaction) => {
    const [updated] = await t
      .update(suggestions)
      .set({ ...fields, reviewedAt: new Date() })
      .where(and(eq(suggestions.id, suggestionId), isNull(suggestions.deletedAt)))
      .returning();

    if (!updated) {
      const tErrors = getServerTranslations(locale ?? "en").errorsTranslations;
      throw new NotFoundError("SUGGESTION", tErrors.suggestionNotFound);
    }

    return updated;
  };

  return tx ? runner(tx) : db.transaction(runner);
};

export const markSuggestionReviewedImpl = async (
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

export const respondToSuggestionImpl = async (
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

export const markAsDuplicateImpl = async (
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

/**
 * Right-to-be-forgotten scrub: delete every suggestion submitted by the
 * anonymized subject's parent row. `submitter_name` and `body` are
 * NOT NULL, so rows are deleted rather than nulled. Runs inside the
 * caller's transaction.
 */
export const deleteByParentIdImpl = async (parentId: string, tx: DBTransaction): Promise<void> => {
  await tx.delete(suggestions).where(eq(suggestions.parentId, parentId));
};
