import { afterEach, beforeEach, describe, expect, it, jest } from "bun:test";
import {
  OrderSortDirection,
  SessionAuditReportSortField,
  SessionAuditStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  buildSessionAuditUrlParams,
  parseSessionAuditUrlParams,
  SESSION_AUDIT_DEFAULT_PAGE_SIZE,
  SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS,
  startSessionAuditUrlSync,
  useSessionAuditFilterStore,
} from "@/frontend/common/stores/sessionAuditFilterStore";

const PAGE_PATHNAME = "/accounting/reports";

let replaceCalls: string[];
let currentSearch: string;

function installFakeWindow(): void {
  replaceCalls = [];
  currentSearch = "";
  const fakeWindow = {
    location: {
      pathname: PAGE_PATHNAME,
      get search(): string {
        return currentSearch;
      },
    },
    history: {
      replaceState: (_data: unknown, _unused: string, url?: string | URL | null) => {
        const href = url === undefined || url === null ? "" : String(url);
        replaceCalls.push(href);
        const queryIndex = href.indexOf("?");
        currentSearch = queryIndex >= 0 ? href.slice(queryIndex) : "";
      },
    },
  };
  Object.defineProperty(globalThis, "window", {
    value: fakeWindow,
    writable: true,
    configurable: true,
  });
}

function uninstallFakeWindow(): void {
  Reflect.deleteProperty(globalThis, "window");
}

function urlParam(name: string): string | null {
  return new URLSearchParams(currentSearch).get(name);
}

function resetStore(): void {
  useSessionAuditFilterStore.getState().reset();
}

describe("sessionAuditFilterStore state setters", () => {
  beforeEach(resetStore);

  it("starts with the service defaults (scheduledStartAt desc, page 0, pageSize 50)", () => {
    const state = useSessionAuditFilterStore.getState();
    expect(state.teacherId).toBeNull();
    expect(state.studentId).toBeNull();
    expect(state.dateFrom).toBeNull();
    expect(state.dateTo).toBeNull();
    expect(state.currentStatuses).toEqual([]);
    expect(state.search).toBe("");
    expect(state.sortField).toBe(SessionAuditReportSortField.ScheduledStartAt);
    expect(state.sortDirection).toBe(OrderSortDirection.Desc);
    expect(state.page).toBe(0);
    expect(state.pageSize).toBe(SESSION_AUDIT_DEFAULT_PAGE_SIZE);
  });

  it("resets the page to the first page when a filter changes", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setPage(4);
    store.setSearch("ali");
    expect(useSessionAuditFilterStore.getState().page).toBe(0);
  });

  it("resets the page when the sort changes", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setPage(4);
    store.setSort(SessionAuditReportSortField.TeacherName, OrderSortDirection.Asc);
    const state = useSessionAuditFilterStore.getState();
    expect(state.page).toBe(0);
    expect(state.sortField).toBe(SessionAuditReportSortField.TeacherName);
    expect(state.sortDirection).toBe(OrderSortDirection.Asc);
  });

  it("clamps non-integer and negative pages to a valid index", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setPage(-3);
    expect(useSessionAuditFilterStore.getState().page).toBe(0);
    store.setPage(2.7);
    expect(useSessionAuditFilterStore.getState().page).toBe(2);
    store.setPage(Number.NaN);
    expect(useSessionAuditFilterStore.getState().page).toBe(0);
  });

  it("clearFilters clears filters and returns to page 0 but keeps sort and page size", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setSort(SessionAuditReportSortField.DurationMinutes, OrderSortDirection.Asc);
    store.setPageSize(25);
    store.setTeacherId("teacher-1");
    store.setCurrentStatuses([SessionAuditStatus.End]);
    store.clearFilters();
    const state = useSessionAuditFilterStore.getState();
    expect(state.teacherId).toBeNull();
    expect(state.currentStatuses).toEqual([]);
    expect(state.page).toBe(0);
    expect(state.sortField).toBe(SessionAuditReportSortField.DurationMinutes);
    expect(state.pageSize).toBe(25);
  });

  it("reset restores every default including sort and page size", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setSort(SessionAuditReportSortField.DurationMinutes, OrderSortDirection.Asc);
    store.setPageSize(25);
    store.reset();
    const state = useSessionAuditFilterStore.getState();
    expect(state.sortField).toBe(SessionAuditReportSortField.ScheduledStartAt);
    expect(state.sortDirection).toBe(OrderSortDirection.Desc);
    expect(state.pageSize).toBe(SESSION_AUDIT_DEFAULT_PAGE_SIZE);
  });
});

describe("buildSessionAuditUrlParams (state → URL)", () => {
  beforeEach(resetStore);

  it("serializes the default state to an empty query string", () => {
    expect(buildSessionAuditUrlParams(useSessionAuditFilterStore.getState()).toString()).toBe("");
  });

  it("serializes non-default filters, sort, and pagination", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setTeacherId("teacher-1");
    store.setStudentId("student-1");
    store.setDateFrom("2026-01-01");
    store.setDateTo("2026-01-31");
    store.setCurrentStatuses([SessionAuditStatus.End, SessionAuditStatus.Absent]);
    store.setSearch("ali");
    store.setSort(SessionAuditReportSortField.TeacherName, OrderSortDirection.Asc);
    store.setPage(2);
    store.setPageSize(25);
    const params = buildSessionAuditUrlParams(useSessionAuditFilterStore.getState());
    expect(params.get("teacherId")).toBe("teacher-1");
    expect(params.get("studentId")).toBe("student-1");
    expect(params.get("dateFrom")).toBe("2026-01-01");
    expect(params.get("dateTo")).toBe("2026-01-31");
    expect(params.get("currentStatuses")).toBe("end,Absent");
    expect(params.get("search")).toBe("ali");
    expect(params.get("sortField")).toBe("teacherName");
    expect(params.get("sortDirection")).toBe("asc");
    expect(params.get("page")).toBe("2");
    expect(params.get("pageSize")).toBe("25");
  });

  it("writes sort params as a pair and omits them at the default sort", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setSort(SessionAuditReportSortField.ScheduledStartAt, OrderSortDirection.Desc);
    const params = buildSessionAuditUrlParams(useSessionAuditFilterStore.getState());
    expect(params.has("sortField")).toBe(false);
    expect(params.has("sortDirection")).toBe(false);
  });
});

describe("parseSessionAuditUrlParams (URL → state hydration)", () => {
  beforeEach(resetStore);

  it("hydrates every param from a full query string", () => {
    const hydrated = parseSessionAuditUrlParams(
      "?teacherId=teacher-1&studentId=student-1&dateFrom=2026-01-01&dateTo=2026-01-31&currentStatuses=end,Absent&search=ali&sortField=teacherName&sortDirection=asc&page=2&pageSize=25"
    );
    expect(hydrated).toEqual({
      teacherId: "teacher-1",
      studentId: "student-1",
      dateFrom: "2026-01-01",
      dateTo: "2026-01-31",
      currentStatuses: [SessionAuditStatus.End, SessionAuditStatus.Absent],
      search: "ali",
      sortField: SessionAuditReportSortField.TeacherName,
      sortDirection: OrderSortDirection.Asc,
      page: 2,
      pageSize: 25,
    });
  });

  it("supports repeatable currentStatuses params and dedupes values", () => {
    const hydrated = parseSessionAuditUrlParams(
      "?currentStatuses=open&currentStatuses=end,absent_student&currentStatuses=open"
    );
    expect(hydrated.currentStatuses).toEqual([
      SessionAuditStatus.Open,
      SessionAuditStatus.End,
      SessionAuditStatus.AbsentStudent,
    ]);
  });

  it("ignores unknown statuses, impossible dates, and malformed numbers while keeping valid keys", () => {
    const hydrated = parseSessionAuditUrlParams(
      "?teacherId=teacher-1&currentStatuses=ghost,Absent&dateFrom=2026-02-30&dateTo=2026-01-15&page=-1&pageSize=abc"
    );
    expect(hydrated).toEqual({
      teacherId: "teacher-1",
      currentStatuses: [SessionAuditStatus.Absent],
      dateTo: "2026-01-15",
    });
  });

  it("ignores a half or invalid sort pair entirely", () => {
    expect(parseSessionAuditUrlParams("?sortField=teacherName")).toEqual({});
    expect(parseSessionAuditUrlParams("?sortDirection=asc")).toEqual({});
    expect(parseSessionAuditUrlParams("?sortField=nope&sortDirection=asc")).toEqual({});
    expect(parseSessionAuditUrlParams("?sortField=teacherName&sortDirection=sideways")).toEqual({});
  });

  it("rejects zero-padded and decimal pagination values", () => {
    expect(parseSessionAuditUrlParams("?page=03")).toEqual({});
    expect(parseSessionAuditUrlParams("?page=1.5")).toEqual({});
    expect(parseSessionAuditUrlParams("?pageSize=0")).toEqual({});
  });

  it("accepts hydration strings with or without the leading question mark", () => {
    expect(parseSessionAuditUrlParams("teacherId=teacher-1").teacherId).toBe("teacher-1");
  });
});

describe("hydrateFromUrl (one-shot URL → state on mount)", () => {
  beforeEach(() => {
    installFakeWindow();
    resetStore();
  });

  afterEach(uninstallFakeWindow);

  it("drops stale filters from a previous visit before applying the query string", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setTeacherId("stale-teacher");
    store.setSearch("stale");
    store.setSort(SessionAuditReportSortField.TeacherName, OrderSortDirection.Asc);
    store.setPage(3);

    useSessionAuditFilterStore.getState().hydrateFromUrl("?studentId=student-9");

    const state = useSessionAuditFilterStore.getState();
    expect(state.studentId).toBe("student-9");
    expect(state.teacherId).toBeNull();
    expect(state.search).toBe("");
    expect(state.sortField).toBe(SessionAuditReportSortField.ScheduledStartAt);
    expect(state.sortDirection).toBe(OrderSortDirection.Desc);
    expect(state.page).toBe(0);
  });

  it("reads the current address bar when no query string is passed", () => {
    currentSearch = "?teacherId=teacher-1&currentStatuses=Absent";
    useSessionAuditFilterStore.getState().hydrateFromUrl();
    const state = useSessionAuditFilterStore.getState();
    expect(state.teacherId).toBe("teacher-1");
    expect(state.currentStatuses).toEqual([SessionAuditStatus.Absent]);
    expect(state.sortField).toBe(SessionAuditReportSortField.ScheduledStartAt);
  });

  it("no-ops without a window (server rendering)", () => {
    uninstallFakeWindow();
    expect(() => useSessionAuditFilterStore.getState().hydrateFromUrl()).not.toThrow();
    expect(useSessionAuditFilterStore.getState().teacherId).toBeNull();
  });
});

describe("startSessionAuditUrlSync (debounced state → URL)", () => {
  let stopSync: () => void;

  beforeEach(() => {
    installFakeWindow();
    resetStore();
    jest.useFakeTimers();
    stopSync = startSessionAuditUrlSync();
  });

  afterEach(() => {
    stopSync();
    jest.useRealTimers();
    uninstallFakeWindow();
  });

  it("does not rewrite the URL before the debounce window elapses", () => {
    useSessionAuditFilterStore.getState().setTeacherId("teacher-1");
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS - 1);
    expect(replaceCalls).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(replaceCalls).toHaveLength(1);
    expect(urlParam("teacherId")).toBe("teacher-1");
  });

  it("collapses a burst of changes into a single history entry", () => {
    const store = useSessionAuditFilterStore.getState();
    store.setTeacherId("teacher-1");
    store.setSearch("ali");
    store.setCurrentStatuses([SessionAuditStatus.Open]);
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
    expect(replaceCalls).toHaveLength(1);
    expect(urlParam("teacherId")).toBe("teacher-1");
    expect(urlParam("search")).toBe("ali");
    expect(urlParam("currentStatuses")).toBe("open");
  });

  it("preserves unrelated query params while updating its own keys", () => {
    currentSearch = "?openOverride=1&teacherId=teacher-1";
    resetStore();
    useSessionAuditFilterStore.getState().setTeacherId("teacher-2");
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
    expect(urlParam("openOverride")).toBe("1");
    expect(urlParam("teacherId")).toBe("teacher-2");
  });

  it("drops its own params back to defaults on clearFilters", () => {
    currentSearch = "?teacherId=teacher-1&currentStatuses=end";
    resetStore();
    useSessionAuditFilterStore.getState().hydrateFromUrl();
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
    useSessionAuditFilterStore.getState().clearFilters();
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
    expect(currentSearch).toBe("");
    expect(replaceCalls.length).toBeGreaterThan(0);
  });

  it("survives a mocked URL → state → URL round trip", () => {
    currentSearch =
      "?teacherId=teacher-1&dateFrom=2026-01-01&currentStatuses=end,absent_student&sortField=teacherName&sortDirection=asc&page=1&pageSize=25";
    useSessionAuditFilterStore.getState().hydrateFromUrl();
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS);
    expect(urlParam("teacherId")).toBe("teacher-1");
    expect(urlParam("currentStatuses")).toBe("end,absent_student");
    expect(urlParam("sortDirection")).toBe("asc");
    expect(urlParam("page")).toBe("1");
    expect(urlParam("pageSize")).toBe("25");
  });

  it("stops syncing after the cleanup runs", () => {
    stopSync();
    stopSync = () => undefined;
    useSessionAuditFilterStore.getState().setTeacherId("teacher-1");
    jest.advanceTimersByTime(SESSION_AUDIT_URL_SYNC_DEBOUNCE_MS * 2);
    expect(replaceCalls).toEqual([]);
  });
});
