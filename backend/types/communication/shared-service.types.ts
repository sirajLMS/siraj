import type { AppPermission } from "@/backend/enum";
import type { DBTx } from "@/backend/types/communication/communication.types";

/** Union of not-found error keys used by complaint/suggestion resolution. */
export type ResolveNotFoundErrorKey = "complaintNotFound" | "suggestionNotFound";

/** Args for resolving an entity by id with permission gating. */
export interface ResolveEntityByIdArgs<T> {
  actorUserId: string;
  permission: AppPermission;
  entityId: string;
  findFn: (id: string, tx?: DBTx) => Promise<T | null>;
  notFoundErrorKey: ResolveNotFoundErrorKey;
  entityCode: string;
  tx?: DBTx;
  locale?: string;
  logLabel?: string;
}

/** Args for the soft-delete entity log helper. */
export interface SoftDeleteEntityLogArgs {
  actorUserId: string;
  /** Short human-readable label used in log messages (`Complaint` / `Suggestion`). */
  entityLabel: string;
  /** Lowercase identifier key used in structured logs (`complaintId` / `suggestionId`). */
  idKey: string;
  entityId: string;
  /** Void soft-delete function that returns `{ deletedAt: Date }`. */
  deleteFn: (entityId: string, actorUserId: string) => Promise<{ deletedAt: Date }>;
}
