import { describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type {
  AssociatedStudentRow,
  AssociatedStudentsSectionLabels,
} from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsSectionMobileView } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsSection.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

const labels: AssociatedStudentsSectionLabels = {
  parent: readTranslation(Translation.Profile.Parent, locale),
  base: readTranslation(Translation.Profile.Base, locale),
};

function makeRow(overrides: Partial<AssociatedStudentRow> = {}): AssociatedStudentRow {
  return {
    id: "student-1",
    name: "Fatima Ahmad",
    studentAvatarUrl: null,
    status: "REGULAR",
    primaryTeacherId: "teacher-1",
    teacherUserId: "teacher-user-1",
    teacherName: "Layla Hassan",
    teacherAvatarUrl: null,
    hoursPerWeek: "3",
    classesRemaining: 4,
    classesTotal: 10,
    ...overrides,
  };
}

function renderSection(props: Readonly<{ loading: boolean; rows: AssociatedStudentRow[] }>) {
  return renderWithWrapper(
    <AssociatedStudentsSectionMobileView
      labels={labels}
      rows={props.rows}
      loading={props.loading}
      emptyMessage={labels.parent.students.empty}
    />,
    { locale }
  );
}

describe("AssociatedStudentsSection mobile view", () => {
  test("delegates the loading state to the list instead of the data-grid overlay", async () => {
    const { container } = renderSection({ loading: true, rows: [] });

    await waitFor(() => {
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    });
    expect(container.querySelector(".MuiCircularProgress-root")).not.toBeNull();
    expect(container.querySelector(".MuiDataGrid-overlay")).toBeNull();
  });

  test("renders the title and edge-to-edge rows without an extra content-gutter wrapper", async () => {
    const { container } = renderSection({ loading: false, rows: [makeRow()] });

    expect(screen.getByText(labels.parent.sections.students)).toBeInTheDocument();
    const studentName = await screen.findByText("Fatima Ahmad");
    expect(studentName).toBeInTheDocument();
    expect(container.querySelector(".MuiDataGrid-overlay")).toBeNull();

    // MobileCardListItem Paper → row key wrapper (Box) → list root (Box) →
    // MobileSectionPanel Paper. Any extra Box (contentInset gutter or the
    // removed px/py wrapper) would break this direct-parent chain.
    const itemPaper = studentName.closest(".MuiPaper-root");
    expect(itemPaper).not.toBeNull();
    const listRoot = itemPaper?.parentElement?.parentElement;
    expect(listRoot?.parentElement?.className).toContain("MuiPaper-root");
  });

  test("shows the list empty state when there are no students", async () => {
    renderSection({ loading: false, rows: [] });

    expect(await screen.findByText(labels.parent.students.mobileListLabel)).toBeInTheDocument();
  });
});
