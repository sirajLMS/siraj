import type { DBTransaction } from "../db.types";

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

/**
 * Repository shape accepted by {@link resolveEntityById} and
 * {@link softDeleteEntityLog}. The helper only needs `getById`; concrete
 * repos offer many more methods.
 */
export interface BaseRepo<T extends BaseEntity> {
  getById?(id: string, tx?: DBTransaction): Promise<T | null>;
  getByIds?(ids: string[], tx?: DBTransaction): Promise<Map<string, T | null>>;
}

/** Alias kept consistent with the design doc naming. */
export type DBTx = DBTransaction;

/** Result returned by {@link buildResolutionResponse} for resolve responses. */
export interface ResolutionResult {
  readonly resolved: boolean;
  readonly resolution: string | null;
}
