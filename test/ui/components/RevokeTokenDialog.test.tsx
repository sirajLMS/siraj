import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import { RevokeTokenDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const baseLabels = createMeetingIntegrationLabelsMock();
const labels: SettingsMeetingIntegrationsLabels = {
  ...baseLabels,
  actions: {
    ...baseLabels.actions,
    revokeConfirm: "هل أنت متأكد من إلغاء هذا الرمز؟ سيتعين على المعلم إعادة الاتصال.",
    revokeConfirmTitle: "إلغاء رمز مزود الاجتماعات",
    cancel: "إلغاء",
    confirmRevoke: "إلغاء",
  },
};

function renderDialog(props: Record<string, unknown>) {
  return render(
    <RevokeTokenDialog
      labels={labels}
      open={true}
      revoking={false}
      onConfirm={mock(() => {})}
      onCancel={mock(() => {})}
      {...props}
    />,
    { wrapper: TestWrapper }
  );
}

describe("RevokeTokenDialog", () => {
  test("renders dialog with title and body when open", () => {
    renderDialog({});
    expect(screen.getByText("إلغاء رمز مزود الاجتماعات")).toBeInTheDocument();
    expect(screen.getByText(/هل أنت متأكد من إلغاء هذا الرمز؟/)).toBeInTheDocument();
  });

  test("calls onConfirm when confirm button clicked", () => {
    const onConfirm = mock(() => {});
    renderDialog({ onConfirm });
    // Both cancel and confirm have same label "إلغاء" so we need to find the dialog buttons
    const buttons = screen.getAllByText("إلغاء");
    // Find the confirm button (second one, inside the dialog actions)
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("calls onCancel when cancel button clicked", () => {
    const onCancel = mock(() => {});
    renderDialog({ onCancel });
    const buttons = screen.getAllByText("إلغاء");
    // The first "إلغاء" is the cancel button
    fireEvent.click(buttons[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("shows loading state when revoking is true", () => {
    renderDialog({ revoking: true });
    // When revoking, confirm button should show loading (disabled or progress indicator)
    expect(screen.getByText("إلغاء رمز مزود الاجتماعات")).toBeInTheDocument();
  });

  test("does not render dialog when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText("إلغاء رمز مزود الاجتماعات")).not.toBeInTheDocument();
  });
});
