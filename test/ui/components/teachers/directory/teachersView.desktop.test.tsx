import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/teachers", { locale: "ar" });

// Child rows/grids are covered by their own suites; this suite targets the
// page-level layout structure only, so they are replaced with inert stubs.
await mock.module("@/frontend/desktop/views/dashboard/teachers/home/components/teacherMetricsRow.desktop", () => ({
  TeacherMetricsRow: () => <div data-testid="teacher-metrics-row" />,
}));
await mock.module("@/frontend/desktop/views/dashboard/teachers/home/components/teacherDataGrid.desktop", () => ({
  TeacherDataGrid: () => <div data-testid="teacher-data-grid" />,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";

expect.extend(matchers);

import { TeachersDesktopView } from "@/frontend/desktop/views/dashboard/teachers/home/teachersView.desktop";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

// The teachers directory namespace is not part of the shared translation
// preload - warm the cache here so readTranslation resolves synchronously.
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

afterEach(() => {
  cleanup();
});

function renderView() {
  return renderWithWrapper(
    <TeachersDesktopView
      labels={labels}
      metrics={null}
      rows={[]}
      loading={false}
      totalTeachers={0}
      page={0}
      pageSize={10}
      totalCount={0}
      onPageChange={noop}
      canCreateTeacher={false}
    />,
    { locale }
  );
}

describe("TeachersDesktopView layout", () => {
  test("metrics row is a direct child of the page container (no ad-hoc gap wrapper)", () => {
    const { container } = renderView();

    // The first <div> in document order is the DesktopPageContainer root.
    const pageRoot = container.querySelector<HTMLElement>("div");
    const metricsRow = container.querySelector<HTMLElement>("[data-testid='teacher-metrics-row']");
    expect(pageRoot).not.toBeNull();
    expect(metricsRow).not.toBeNull();
    expect(metricsRow?.parentElement).not.toBeNull();
    expect(metricsRow?.parentElement).toBe(pageRoot);
  });

  test("data grid stays inside the section panel that carries the showing-of title", () => {
    const { container } = renderView();

    const grid = container.querySelector("[data-testid='teacher-data-grid']");
    expect(grid).not.toBeNull();
    const panel = grid?.closest(".MuiPaper-root");
    expect(panel?.textContent).toContain(labels.table.showingOf(0, 0));
  });
});
