"use client";

/**
 * Shared scaffold for server-paginated filter stores: page/page-size
 * normalization helpers plus the standard pagination and bulk-selection
 * actions (setPage / setPageSize / toggleSelected / clearSelection /
 * clearFilters / reset).
 *
 * Eliminates the duplicated store logic between `carryoverFilterStore.ts`,
 * `expenseFilterStore.ts`, and `sessionAuditFilterStore.ts` (and any future
 * filter store that follows the same pattern).
 */

/** Slice of a filter store's state owned by the shared pagination actions. */
export interface PaginatedFilterSelectionState {
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
  /** Ids of the rows currently checked for bulk actions. */
  selectedIds: readonly string[];
}

/**
 * State setter accepted by the shared actions — a structural subset of
 * Zustand's `set` (full state, partial state, or updater function). The
 * partial shape is the concrete `PaginatedFilterSelectionState` subset, which
 * every store state extends.
 */
export type PaginatedFilterStoreSet = (
  partial:
    | PaginatedFilterSelectionState
    | Partial<PaginatedFilterSelectionState>
    | ((state: PaginatedFilterSelectionState) => PaginatedFilterSelectionState | Partial<PaginatedFilterSelectionState>)
) => void;

/** Actions shared by every paginated filter store. */
export interface PaginatedFilterActions {
  /** Applies the page index, clamped to a non-negative integer. */
  setPage: (page: number) => void;
  /** Applies the page size (min 1) and returns to the first page. */
  setPageSize: (pageSize: number) => void;
  /** Adds the id when unchecked and removes it when checked. */
  toggleSelected: (id: string) => void;
  /** Empties the bulk-selection set. */
  clearSelection: () => void;
  /**
   * Clears every filter, returns to the first page, and drops the selection
   * (rows may leave the result set, so stale bulk-action ids must not
   * survive), while keeping the chosen page size.
   */
  clearFilters: () => void;
  /** Restores the pristine store, including the default page size. */
  reset: () => void;
}

/** Per-store wiring the shared actions need. */
export interface PaginatedFilterStoreDefaults<TState> {
  /** Rows per server page on first load; also the fallback for invalid setPageSize values. */
  defaultPageSize: number;
  /** Filter-field defaults spread on clearFilters. */
  defaultFilters: Partial<TState>;
  /** Builds the pristine state used on store creation and reset. */
  createDefaultState: () => TState;
}

function toNonNegativePage(page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.trunc(page));
}

function toPositivePageSize(pageSize: number, fallbackPageSize: number): number {
  if (!Number.isFinite(pageSize)) return fallbackPageSize;
  return Math.max(1, Math.trunc(pageSize));
}

function toggleIdInSelection(selectedIds: readonly string[], id: string): readonly string[] {
  return selectedIds.includes(id) ? selectedIds.filter(selectedId => selectedId !== id) : [...selectedIds, id];
}

/**
 * Builds the pagination and bulk-selection actions shared by paginated
 * filter stores. Spread the result into the store's `create` body.
 */
export function createPaginatedFilterActions<TState extends PaginatedFilterSelectionState>(
  set: PaginatedFilterStoreSet,
  defaults: PaginatedFilterStoreDefaults<TState>
): PaginatedFilterActions {
  return {
    setPage: page => set({ page: toNonNegativePage(page) }),
    setPageSize: pageSize => set({ pageSize: toPositivePageSize(pageSize, defaults.defaultPageSize), page: 0 }),
    toggleSelected: id =>
      set(state => ({
        selectedIds: toggleIdInSelection(state.selectedIds, id),
      })),
    clearSelection: () => set({ selectedIds: [] }),
    clearFilters: () => set({ ...defaults.defaultFilters, page: 0, selectedIds: [] }),
    reset: () => set(defaults.createDefaultState()),
  };
}
