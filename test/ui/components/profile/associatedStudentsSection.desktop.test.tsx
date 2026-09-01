import { describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { AssociatedStudentRow } from "@/frontend/common/views/dashboard/profile/parent/sections/parentProfileTypes";
import { AssociatedStudentsSectionDesktopView } from "@/frontend/desktop/views/dashboard/profile/parent/sections/associatedStudentsSection.desktop";
import {
  associatedStudentsLabels,
  associatedStudentsLocale,
  makeAssociatedStudentRow,
} from "@/test/ui/components/profile/associatedStudentsFixtures";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function renderSection(props: Readonly<{ loading: boolean; rows: AssociatedStudentRow[] }>) {
  return renderWithWrapper(
    <AssociatedStudentsSectionDesktopView
      labels={associatedStudentsLabels}
      rows={props.rows}
      loading={props.loading}
      emptyMessage={associatedStudentsLabels.parent.students.empty}
    />,
    { locale: associatedStudentsLocale }
  );
}

describe("AssociatedStudentsSection desktop view", () => {
  test("delegates the loading state to the data-grid overlay", async () => {
    const { container } = renderSection({ loading: true, rows: [] });

    await waitFor(() => {
      expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
    });
    expect(screen.queryByText(associatedStudentsLabels.parent.students.empty)).toBeNull();
  });

  test("renders the grid with column headers and row values", async () => {
    const { container } = renderSection({ loading: false, rows: [makeAssociatedStudentRow()] });

    await waitFor(() => {
      expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();
    });

    expect(screen.getByText(associatedStudentsLabels.parent.students.columns.name)).toBeInTheDocument();
    expect(screen.getByText(associatedStudentsLabels.parent.students.columns.status)).toBeInTheDocument();
    expect(screen.getByText("Fatima Ahmad")).toBeInTheDocument();
    expect(screen.getByText("Layla Hassan")).toBeInTheDocument();
  });

  test("shows the no-rows overlay with the forwarded emptyMessage", async () => {
    renderSection({ loading: false, rows: [] });

    expect(await screen.findByText(associatedStudentsLabels.parent.students.empty)).toBeInTheDocument();
  });
});
