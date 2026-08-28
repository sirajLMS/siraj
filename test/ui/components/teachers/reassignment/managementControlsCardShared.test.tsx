import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { Box, Typography } from "@mui/material";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { ManagementControlsCardShared } from "@/frontend/common/views/dashboard/teachers/reassignment/components/managementControlsCardShared";
import type { ManagementControlsCardProps } from "@/frontend/common/views/dashboard/teachers/reassignment/types";
import type {
  ManagementControlsCardSlotProps,
  SharedCardContainerProps,
  SharedStatusBadgeProps,
  SharedTeacherAutocompleteProps,
} from "@/frontend/common/views/dashboard/teachers/reassignment/types/managementControlsCardShared.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { TeacherReassignmentLabels } from "@/shared/locale/types/dashboard/teachers/reassignment";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";

let labels: Pick<TeacherReassignmentLabels, "controls" | "actions">;
try {
  labels = readTranslation(Translation.Dashboard.TeacherReassignment, locale);
} catch (thrown) {
  if (!(thrown instanceof Promise)) throw thrown;
  await thrown;
  labels = readTranslation(Translation.Dashboard.TeacherReassignment, locale);
}

afterEach(() => {
  cleanup();
});

function MockCardContainer({ children }: Readonly<SharedCardContainerProps>) {
  return <Box>{children}</Box>;
}

function MockStatusBadge({ label }: Readonly<SharedStatusBadgeProps>) {
  return <Typography>{label}</Typography>;
}

function MockTeacherAutocomplete({ label }: Readonly<SharedTeacherAutocompleteProps>) {
  return <Typography>{label}</Typography>;
}

const slots: ManagementControlsCardSlotProps = {
  CardContainer: MockCardContainer,
  StatusBadge: MockStatusBadge,
  TeacherAutocomplete: MockTeacherAutocomplete,
};

function renderShared(overrides?: Readonly<Partial<ManagementControlsCardProps>>) {
  const props: ManagementControlsCardProps = {
    currentStatus: StudentStatus.Regular,
    studentId: "student-1",
    version: 1,
    isSubmitting: false,
    onReassign: async () => {},
    onStatusChange: async () => {},
    onCancel: () => {},
    selectedTeacherId: "",
    selectedNewStatus: "",
    saved: false,
    onSelectedTeacherIdChange: () => {},
    onSelectedNewStatusChange: () => {},
    onSubmitForm: async () => {},
    labels,
    statusLabelId: "status-update-label",
    ...overrides,
  };
  return render(<ManagementControlsCardShared props={props} slots={slots} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("ManagementControlsCardShared action presets", () => {
  test("renders cancel via the outlined filter preset and submit via the contained primary preset", () => {
    renderShared();
    const cancelButton = screen.getByRole("button", { name: labels.actions.cancel });
    const submitButton = screen.getByRole("button", { name: labels.actions.submit });
    expect(cancelButton.className.includes("MuiButton-outlined")).toBe(true);
    expect(submitButton.className.includes("MuiButton-contained")).toBe(true);
    expect(submitButton).not.toBeDisabled();
  });

  test("loading state renders a spinner inside the primary preset and disables the submit action", () => {
    renderShared({ isSubmitting: true });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.queryByText(labels.actions.submit)).toBeNull();
    const buttons = screen.getAllByRole("button");
    const submitButton = buttons.find(button => button.className.includes("MuiButton-contained"));
    expect(submitButton).toBeDefined();
    expect(submitButton).toBeDisabled();
  });

  test("saved state renders the saved label with success icon inside the disabled primary preset", () => {
    renderShared({ saved: true });
    const savedButton = screen.getByRole("button", { name: labels.actions.saved });
    expect(savedButton.className.includes("MuiButton-contained")).toBe(true);
    expect(savedButton).toBeDisabled();
    expect(savedButton.querySelector("svg[data-testid='CheckCircleOutlinedIcon']")).not.toBeNull();
  });

  test("cancel click propagates to onCancel", () => {
    let cancelCalls = 0;
    renderShared({
      onCancel: () => {
        cancelCalls += 1;
      },
    });
    fireEvent.click(screen.getByRole("button", { name: labels.actions.cancel }));
    expect(cancelCalls).toBe(1);
  });
});
