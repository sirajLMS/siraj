import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/credits", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import { studentsDirectoryQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-directory.documents";
import {
  DIRECTORY_FETCH_LIMIT,
  StudentCreditsList,
} from "@/frontend/common/views/dashboard/accounting/credits/StudentCreditsList";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardBillingCreditAdjustment, DashboardStudentDirectory } from "@/shared/locale/namespaces";
import type { NamespaceHandle } from "@/shared/locale/namespaces/define-namespace";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";

// Neither namespace is part of the shared translation preload - warm the cache
// here so readTranslation resolves synchronously inside the component render.
const pendingTranslations: Promise<unknown>[] = [];
const handles: readonly NamespaceHandle<unknown>[] = [DashboardBillingCreditAdjustment, DashboardStudentDirectory];
for (const handle of handles) {
  try {
    readTranslation(handle, locale);
  } catch (thrown) {
    if (thrown instanceof Promise) {
      pendingTranslations.push(thrown);
    }
  }
}
await Promise.all(pendingTranslations);

const credits = readTranslation(DashboardBillingCreditAdjustment, locale);
const directory = readTranslation(DashboardStudentDirectory, locale);

afterEach(() => {
  cleanup();
  mockPush.mockClear();
});

const studentRows = [
  {
    __typename: "StudentDirectoryRow",
    id: "s-1",
    name: "Ahmed Mohamed",
    email: "ahmed@example.com",
    avatarUrl: null,
    status: "REGULAR",
    classesRemaining: 12,
    classesTotal: 24,
    hoursPerWeek: 2,
    teacherName: "Layla Haddad",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
  {
    __typename: "StudentDirectoryRow",
    id: "s-2",
    name: "Sara Ali",
    email: "sara@example.com",
    avatarUrl: null,
    status: "REGULAR",
    classesRemaining: 2,
    classesTotal: 10,
    hoursPerWeek: 1,
    teacherName: "Nasr Ali",
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
  },
  {
    __typename: "StudentDirectoryRow",
    id: "s-3",
    name: "Omar Khaled",
    email: null,
    avatarUrl: null,
    status: "REGULAR",
    classesRemaining: 0,
    classesTotal: 8,
    hoursPerWeek: null,
    teacherName: null,
    createdAt: "2026-01-03T00:00:00.000Z",
    updatedAt: "2026-01-03T00:00:00.000Z",
  },
];

/** Builds an exactly-at-cap result set so the truncation hint path can be exercised. */
function cappedRows() {
  return Array.from({ length: DIRECTORY_FETCH_LIMIT }, (_, index) => ({
    __typename: "StudentDirectoryRow",
    id: `s-${index}`,
    name: `Student ${index}`,
    email: null,
    avatarUrl: null,
    status: "REGULAR",
    classesRemaining: 5,
    classesTotal: 10,
    hoursPerWeek: null,
    teacherName: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }));
}

function directoryMocks(rows: typeof studentRows | ReturnType<typeof cappedRows> = studentRows) {
  return [
    {
      request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: 500 } },
      result: { data: { studentsDirectory: rows } },
    },
  ];
}

describe("student credits list (component)", () => {
  test("renders rows with student names, balances, and translated column headers", async () => {
    renderWithWrapper(<StudentCreditsList />, { locale, mocks: directoryMocks() });

    expect(await screen.findByText("Ahmed Mohamed")).toBeVisible();
    expect(screen.getByText("Sara Ali")).toBeVisible();
    expect(screen.getByText("ahmed@example.com")).toBeVisible();
    expect(screen.getByText("12 / 24")).toBeVisible();
    expect(screen.getByText("0 / 8")).toBeVisible();

    // Column headers and the toolbar label come straight from the i18n namespaces.
    expect(screen.getByText(directory.table.student)).toBeVisible();
    expect(screen.getByText(directory.table.classesLeft)).toBeVisible();
    expect(screen.getByText(directory.table.actions)).toBeVisible();
    expect(screen.getByPlaceholderText(directory.searchPlaceholder)).toBeVisible();
    expect(screen.getAllByRole("button", { name: credits.adjustCredits }).length).toBeGreaterThan(0);
    expect(screen.queryByText(credits.resultsCappedHint(DIRECTORY_FETCH_LIMIT))).not.toBeInTheDocument();
  });

  test("shows the refine-search hint when the directory result hits the fetch cap", async () => {
    renderWithWrapper(<StudentCreditsList />, { locale, mocks: directoryMocks(cappedRows()) });

    expect(await screen.findByText(credits.resultsCappedHint(DIRECTORY_FETCH_LIMIT))).toBeVisible();
  });

  test("shows the translated empty state when no students match", async () => {
    renderWithWrapper(<StudentCreditsList />, { locale, mocks: directoryMocks([]) });

    expect(await screen.findByText(directory.noEntries)).toBeVisible();
  });

  test("shows the translated error alert when the directory query fails", async () => {
    renderWithWrapper(<StudentCreditsList />, {
      locale,
      mocks: [
        {
          request: { query: studentsDirectoryQueryDocument, variables: { search: null, limit: 500 } },
          error: new Error("directory unavailable"),
        },
      ],
    });

    expect(await screen.findByText(directory.errors.loadFailed)).toBeVisible();
  });

  test("row adjust action navigates to the adjustment form with the student id", async () => {
    renderWithWrapper(<StudentCreditsList />, { locale, mocks: directoryMocks() });

    const rowText = await screen.findByText("Sara Ali");
    const row = rowText.closest('[role="row"]');
    if (!(row instanceof HTMLElement)) throw new Error("expected the grid row element to exist");
    const adjustButton = within(row).getByRole("button", { name: credits.adjustCredits });
    fireEvent.click(adjustButton);

    expect(mockPush).toHaveBeenCalledWith("/accounting/credits/adjust?studentId=s-2");
  });

  test("search re-queries the server with the debounced term", async () => {
    renderWithWrapper(<StudentCreditsList />, {
      locale,
      mocks: [
        ...directoryMocks(),
        {
          request: { query: studentsDirectoryQueryDocument, variables: { search: "Sara", limit: 500 } },
          result: { data: { studentsDirectory: [studentRows[1]] } },
        },
      ],
    });

    expect(await screen.findByText("Ahmed Mohamed")).toBeVisible();

    fireEvent.change(screen.getByPlaceholderText(directory.searchPlaceholder), { target: { value: "Sara" } });

    // 300ms debounce inside the component before the variable changes.
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    expect(await screen.findByText("Sara Ali")).toBeVisible();
    expect(screen.queryByText("Ahmed Mohamed")).not.toBeInTheDocument();
  });
});
