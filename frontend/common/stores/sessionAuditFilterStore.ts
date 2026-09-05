"use client";

import { create } from "zustand";
import {
  OrderSortDirection,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";

/** Rows per server page on first load; mirrors the audit query resolver default. */
export const SESSION_AUDIT_DEFAULT_PAGE_SIZE = 50;

/** Delay between the last store change and the URL rewrite, collapsing bursts of keystrokes. */
export const SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS = 100;

/** Query-string keys owned by this store; unrelated params on the address bar are preserved as-is. */
const URL_PARAM_KEYS = [
  "teacherId",
  "studentId",
  "dateFrom",
  "dateTo",
  "currentStatuses",
  "search",
  "sortField",
  "sortDirection",
  "page",
  "pageSize",
] as const;

/** Filter, sort, and pagination state for the session audit report. */
export interface SessionAuditFilterState {
  /** Teacher UUID filter (null = all teachers). */
  teacherId: string | null;
  /** Student UUID filter (null = all students). */
  studentId: string | null;
  /** Inclusive scheduled-date lower bound (ISO date, YYYY-MM-DD). */
  dateFrom: string | null;
  /** Inclusive scheduled-date upper bound (ISO date, YYYY-MM-DD). */
  dateTo: string | null;
  /** AND-combined audit statuses (empty = all statuses). */
  currentStatuses: readonly SessionAuditStatus[];
  /** Free-text teacher/student name search exactly as typed; consumers debounce before querying. */
  search: string;
  /** Column the server sorts by. */
  sortField: SessionAuditReportSortField;
  /** Sort order applied to the sort field. */
  sortDirection: OrderSortDirection;
  /** Server page index (0-based). */
  page: number;
  /** Rows per server page. */
  pageSize: number;
}

/** Subset of the filter state recovered from a query string; absent keys keep their defaults. */
export type SessionAuditUrlHydration = Partial<SessionAuditFilterState>;

interface SessionAuditFilterStore extends SessionAuditFilterState {
  setTeacherId: (teacherId: string | null) => void;
  setStudentId: (studentId: string | null) => void;
  setDateFrom: (dateFrom: string | null) => void;
  setDateTo: (dateTo: string | null) => void;
  setCurrentStatuses: (currentStatuses: readonly SessionAuditStatus[]) => void;
  setSearch: (search: string) => void;
  /** Re-sorting restarts the listing from the first page. */
  setSort: (
    sortField: SessionAuditFilterState["sortField"],
    sortDirection: SessionAuditFilterState["sortDirection"]
  ) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** Clears every report filter and returns to the first page, keeping sort and page size. */
  clearFilters: () => void;
  /** Restores the pristine store, including default sort and page size. */
  reset: () => void;
  /**
   * One-shot URL → state hydration for page mount. Accepts a raw query string
   * (with or without the leading `?`); defaults to the current address bar.
   * The store first returns to its defaults, so filters left over from a
   * previous visit never leak into a fresh hydration.
   */
  hydrateFromUrl: (search?: string) => void;
}

const DEFAULT_FILTERS = {
  teacherId: null,
  studentId: null,
  dateFrom: null,
  dateTo: null,
  currentStatuses: [] as readonly SessionAuditStatus[],
  search: "",
} as const;

function defaultSort(): Pick<SessionAuditFilterState, "sortField" | "sortDirection"> {
  return {
    sortField: SessionAuditReportSortField.ScheduledStartAt,
    sortDirection: OrderSortDirection.Desc,
  };
}

function defaultState(): SessionAuditFilterState {
  return {
    ...DEFAULT_FILTERS,
    ...defaultSort(),
    page: 0,
    pageSize: SESSION_AUDIT_DEFAULT_PAGE_SIZE,
  };
}

function toNonNegativePage(page: number): number {
  if (!Number.isFinite(page)) return 0;
  return Math.max(0, Math.trunc(page));
}

function toPositivePageSize(pageSize: number): number {
  if (!Number.isFinite(pageSize)) return SESSION_AUDIT_DEFAULT_PAGE_SIZE;
  return Math.max(1, Math.trunc(pageSize));
}

function currentWindowSearch(): string {
  if (typeof window === "undefined") return "";
  return window.location.search;
}

function isSessionAuditStatus(value: string): value is SessionAuditStatus {
  return Object.values<string>(SessionAuditStatus).includes(value);
}

function isSessionAuditSortField(value: string): value is SessionAuditReportSortField {
  return Object.values<string>(SessionAuditReportSortField).includes(value);
}

/** Strict YYYY-MM-DD check that also rejects impossible calendar dates (e.g. 2026-02-30). */
function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Accepts "asc"/"desc" case-insensitively so hand-shared links stay forgiving. */
function parseSortDirection(value: string): OrderSortDirection | null {
  const normalized = value.toLowerCase();
  if (normalized === "asc") return OrderSortDirection.Asc;
  if (normalized === "desc") return OrderSortDirection.Desc;
  return null;
}

/** Rejects decimal, negative, and zero-padded values ("1.5", "-2", "03") outright. */
function parseNonNegativeInt(value: string): number | null {
  const trimmed = value.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || String(parsed) !== trimmed) return null;
  return parsed;
}

/**
 * Extracts the filter / sort / pagination state from a query string. Unknown
 * values are dropped one key at a time (never replacing valid siblings), and
 * sort params are honored only as a complete valid pair — so a corrupted or
 * hand-edited link always hydrates to a coherent server query.
 */
export function parseSessionAuditUrlParams(search: string): SessionAuditUrlHydration {
  const params = new URLSearchParams(search);
  const hydrated: SessionAuditUrlHydration = {};
  const statuses = [
    ...new Set(
      params
        .getAll("currentStatuses")
        .flatMap(chunk => chunk.split(","))
        .map(value => value.trim())
        .filter(isSessionAuditStatus)
    ),
  ];
  if (statuses.length > 0) hydrated.currentStatuses = statuses;
  const teacherId = params.get("teacherId")?.trim();
  if (teacherId) hydrated.teacherId = teacherId;
  const studentId = params.get("studentId")?.trim();
  if (studentId) hydrated.studentId = studentId;
  applyDateBounds(params, hydrated);
  applySortPair(params, hydrated);
  applyPagination(params, hydrated);
  const searchText = params.get("search")?.trim();
  if (searchText) hydrated.search = searchText;
  return hydrated;
}

function applyDateBounds(params: URLSearchParams, hydrated: SessionAuditUrlHydration): void {
  const dateFrom = params.get("dateFrom");
  if (dateFrom !== null && isCalendarDate(dateFrom)) hydrated.dateFrom = dateFrom;
  const dateTo = params.get("dateTo");
  if (dateTo !== null && isCalendarDate(dateTo)) hydrated.dateTo = dateTo;
}

function applySortPair(params: URLSearchParams, hydrated: SessionAuditUrlHydration): void {
  const sortFieldParam = params.get("sortField");
  const sortDirectionParam = params.get("sortDirection");
  if (sortFieldParam === null || sortDirectionParam === null) return;
  const sortDirection = parseSortDirection(sortDirectionParam);
  if (!isSessionAuditSortField(sortFieldParam) || sortDirection === null) return;
  hydrated.sortField = sortFieldParam;
  hydrated.sortDirection = sortDirection;
}

function applyPagination(params: URLSearchParams, hydrated: SessionAuditUrlHydration): void {
  const pageParam = params.get("page");
  if (pageParam !== null) {
    const page = parseNonNegativeInt(pageParam);
    if (page !== null) hydrated.page = page;
  }
  const pageSizeParam = params.get("pageSize");
  if (pageSizeParam !== null) {
    const pageSize = parseNonNegativeInt(pageSizeParam);
    if (pageSize !== null && pageSize >= 1) hydrated.pageSize = pageSize;
  }
}

/**
 * Serializes the state to query-string params. Default-valued fields are
 * omitted so bookmarked links stay short and keep inheriting future default
 * changes. Sort params are written as a pair (or not at all), matching the
 * validation contract of the CSV export endpoint.
 */
export function buildSessionAuditUrlParams(state: SessionAuditFilterState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.teacherId) params.set("teacherId", state.teacherId);
  if (state.studentId) params.set("studentId", state.studentId);
  if (state.dateFrom) params.set("dateFrom", state.dateFrom);
  if (state.dateTo) params.set("dateTo", state.dateTo);
  if (state.currentStatuses.length > 0) params.set("currentStatuses", state.currentStatuses.join(","));
  if (state.search !== "") params.set("search", state.search);
  if (state.sortField !== defaultSort().sortField || state.sortDirection !== defaultSort().sortDirection) {
    params.set("sortField", state.sortField);
    params.set("sortDirection", state.sortDirection.toLowerCase());
  }
  if (state.page > 0) params.set("page", String(state.page));
  if (state.pageSize !== SESSION_AUDIT_DEFAULT_PAGE_SIZE) params.set("pageSize", String(state.pageSize));
  return params;
}

export const useSessionAuditFilterStore = create<SessionAuditFilterStore>(set => ({
  ...defaultState(),
  setTeacherId: teacherId => set({ teacherId, page: 0 }),
  setStudentId: studentId => set({ studentId, page: 0 }),
  setDateFrom: dateFrom => set({ dateFrom, page: 0 }),
  setDateTo: dateTo => set({ dateTo, page: 0 }),
  setCurrentStatuses: currentStatuses => set({ currentStatuses, page: 0 }),
  setSearch: search => set({ search, page: 0 }),
  setSort: (sortField, sortDirection) => set({ sortField, sortDirection, page: 0 }),
  setPage: page => set({ page: toNonNegativePage(page) }),
  setPageSize: pageSize => set({ pageSize: toPositivePageSize(pageSize), page: 0 }),
  clearFilters: () => set({ ...DEFAULT_FILTERS, page: 0 }),
  reset: () => set(defaultState()),
  hydrateFromUrl: search => set({ ...defaultState(), ...parseSessionAuditUrlParams(search ?? currentWindowSearch()) }),
}));

/**
 * Rewrites the address bar via `history.replaceState` (never `pushState`, so
 * typing in the filter bar does not flood the history stack). Keys owned by
 * this store are replaced while unrelated query params survive untouched.
 */
function writeStateToUrl(state: SessionAuditFilterState): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  for (const key of URL_PARAM_KEYS) params.delete(key);
  for (const [key, value] of buildSessionAuditUrlParams(state)) params.append(key, value);
  const query = params.toString();
  const href = query === "" ? window.location.pathname : `${window.location.pathname}?${query}`;
  window.history.replaceState(null, "", href);
}

let urlSyncTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleUrlSync(): void {
  if (urlSyncTimer !== null) clearTimeout(urlSyncTimer);
  urlSyncTimer = setTimeout(() => {
    urlSyncTimer = null;
    writeStateToUrl(useSessionAuditFilterStore.getState());
  }, SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
}

/**
 * Starts the debounced state → URL sync and returns its cleanup. Call it once
 * per page mount (e.g. the ViewModel's `useEffect`), after the one-shot
 * `hydrateFromUrl` pass, and run the returned function on unmount.
 */
export function startSessionAuditUrlSync(): () => void {
  const unsubscribe = useSessionAuditFilterStore.subscribe(() => scheduleUrlSync());
  return () => {
    unsubscribe();
    if (urlSyncTimer !== null) {
      clearTimeout(urlSyncTimer);
      urlSyncTimer = null;
    }
  };
}
