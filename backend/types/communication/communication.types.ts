import type { DBTransaction } from "@/backend/types";

/**
 * Shared types for communication-domain service helpers used by both
 * {@link ComplaintService} and {@link SuggestionService}. They enable the
 * `complaintSuggestionBase.ts` helpers to operate generically over two entity
 * types that share identical permission/lookup/resolve/soft-delete flows.
 */

/** Minimal shape required by generic service helpers. */
export interface BaseEntity {
  readonly id: string;
}

/** Alias kept consistent with the design doc naming. */
export type DBTx = DBTransaction;
