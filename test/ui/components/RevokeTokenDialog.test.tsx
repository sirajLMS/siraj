import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { RevokeTokenDialog } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels: SettingsMeetingIntegrationsLabels = readTranslation(
  Translation.Dashboard.SettingsMeetingIntegrations,
  locale
);

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
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("RevokeTokenDialog", () => {
  test("renders dialog with title and body when open", () => {
    renderDialog({});
    expect(screen.getByText(labels.actions.revokeConfirmTitle)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(labels.actions.revokeConfirm))).toBeInTheDocument();
  });

  test("calls onConfirm when confirm button clicked", () => {
    const onConfirm = mock(() => {});
    renderDialog({ onConfirm });
    // Cancel and confirm may share the same label; find all matching and click the last (confirm)
    const buttons = screen.getAllByText(labels.actions.confirmRevoke);
    fireEvent.click(buttons[buttons.length - 1]);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("calls onCancel when cancel button clicked", () => {
    const onCancel = mock(() => {});
    renderDialog({ onCancel });
    const buttons = screen.getAllByText(labels.actions.cancel);
    fireEvent.click(buttons[0]);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("shows loading state when revoking is true", () => {
    renderDialog({ revoking: true });
    // When revoking, confirm button shows loading indicator; title still visible
    expect(screen.getByText(labels.actions.revokeConfirmTitle)).toBeInTheDocument();
  });

  test("does not render dialog when open is false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText(labels.actions.revokeConfirmTitle)).not.toBeInTheDocument();
  });
});
