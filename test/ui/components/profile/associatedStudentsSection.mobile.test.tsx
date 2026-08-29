import { describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { AssociatedStudentRow } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsSectionMobileView } from "@/frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsSection.mobile";
import {
  associatedStudentsLabels,
  associatedStudentsLocale,
  makeAssociatedStudentRow,
} from "@/test/ui/components/profile/associatedStudentsFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function renderSection(props: Readonly<{ loading: boolean; rows: AssociatedStudentRow[] }>) {
  return renderWithWrapper(
    <AssociatedStudentsSectionMobileView
      labels={associatedStudentsLabels}
      rows={props.rows}
      loading={props.loading}
      emptyMessage={associatedStudentsLabels.parent.students.empty}
    />,
    { locale: associatedStudentsLocale }
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
    const { container } = renderSection({ loading: false, rows: [makeAssociatedStudentRow()] });

    expect(screen.getByText(associatedStudentsLabels.parent.sections.students)).toBeInTheDocument();
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

  test("shows the forwarded emptyMessage as the list empty state when there are no students", async () => {
    renderSection({ loading: false, rows: [] });

    expect(await screen.findByText(associatedStudentsLabels.parent.students.empty)).toBeInTheDocument();
  });
});
