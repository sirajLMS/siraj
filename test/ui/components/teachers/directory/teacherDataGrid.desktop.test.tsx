import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers", { locale: "ar" });

await mock.module("next/link", () => ({
  default: ({
    children,
    href,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    prefetch?: boolean;
    replace?: boolean;
    scroll?: boolean;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// ViewAsUserButton is an upstream permission-gated auth widget; it stays
// untouched here and renders nothing for non-super-admin actors in tests.
await mock.module("@/frontend/common/components/auth/ViewAsUserButton", () => ({
  ViewAsUserButton: () => null,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import {
  AccountStatus,
  type TeacherDirectoryQuery_teacherDirectory_rows as TeacherDirectoryRow,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { TeacherDataGrid } from "@/frontend/desktop/views/dashboard/teachers/home/components/teacherDataGrid.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

// The teachers directory namespace is not part of the shared translation
// preload yet - warm the cache here so readTranslation resolves synchronously.
const pendingTranslations: Promise<unknown>[] = [];
try {
  readTranslation(Translation.Dashboard.TeachersDirectory, locale);
} catch (thrown) {
  if (thrown instanceof Promise) {
    pendingTranslations.push(thrown);
  }
}
await Promise.all(pendingTranslations);

const labels = readTranslation(Translation.Dashboard.TeachersDirectory, locale);

function noop(): void {
  // Intentional no-op for props whose behavior is out of scope for these tests.
}

function makeRow(overrides: Partial<TeacherDirectoryRow> = {}): TeacherDirectoryRow {
  return {
    id: "teacher-1",
    userId: "user-1",
    index: null,
    name: "Layla Hassan",
    email: "layla@example.com",
    avatarUrl: null,
    status: AccountStatus.Activated,
    ...overrides,
  };
}

function renderGrid(options: { readonly rows?: readonly TeacherDirectoryRow[] } = {}) {
  return renderWithWrapper(
    <TeacherDataGrid
      rows={options.rows ?? [makeRow()]}
      labels={labels}
      page={0}
      pageSize={10}
      totalCount={options.rows?.length ?? 1}
      onPageChange={noop}
    />,
    { locale }
  );
}

afterEach(() => {
  cleanup();
});

describe("TeacherDataGrid (desktop)", () => {
  test("renders the schedule cell as a shared action link", () => {
    const { container } = renderGrid();

    const scheduleLink = container.querySelector(`a[aria-label="${labels.actions.viewSchedule}"]`);
    expect(scheduleLink).not.toBeNull();
    expect(scheduleLink?.getAttribute("href")).toBe("/teachers/teacher-1/schedule/weekly");
  });

  test("renders the options cell as a shared action link to the teacher profile", () => {
    const { container } = renderGrid();

    const optionsLink = container.querySelector(`a[aria-label="${labels.actions.options}"]`);
    expect(optionsLink).not.toBeNull();
    expect(optionsLink?.getAttribute("href")).toBe("/users/user-1/profile");
  });

  test("omits action links when the row has no resolvable target", () => {
    const { container } = renderGrid({ rows: [makeRow({ id: null, userId: null })] });

    expect(container.querySelector(`a[aria-label="${labels.actions.viewSchedule}"]`)).toBeNull();
    expect(container.querySelector(`a[aria-label="${labels.actions.options}"]`)).toBeNull();
  });

  test("renders the row index and teacher identity cells", () => {
    const { container } = renderGrid();

    expect(container.textContent).toContain("Layla Hassan");
    expect(container.textContent).toContain("layla@example.com");
  });
});
