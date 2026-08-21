import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { ProfileLinkCallout } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout";
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

function renderCallout(props: Record<string, unknown>, wrapperProps?: { permissions?: AppPermission[] }) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper locale={locale} permissions={wrapperProps?.permissions}>
      {children}
    </TestWrapper>
  );
  return render(<ProfileLinkCallout labels={labels} onNavigate={mock(() => {})} {...props} />, {
    wrapper,
  });
}

describe("ProfileLinkCallout", () => {
  test("renders navigate button with label", () => {
    renderCallout({}, { permissions: [AppPermission.SettingsEditMeetingIntegrations] });
    expect(screen.getByLabelText(labels.viewProfileMeetingConfigsAriaLabel)).toBeInTheDocument();
    expect(screen.getByText(labels.viewProfileMeetingConfigs)).toBeInTheDocument();
  });

  test("calls onNavigate when button clicked", () => {
    const onNavigate = mock(() => {});
    renderCallout({ onNavigate }, { permissions: [AppPermission.SettingsEditMeetingIntegrations] });
    fireEvent.click(screen.getByLabelText(labels.viewProfileMeetingConfigsAriaLabel));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test("does not render when permission not granted", () => {
    renderCallout({}, { permissions: [] });
    expect(screen.queryByLabelText(labels.viewProfileMeetingConfigsAriaLabel)).not.toBeInTheDocument();
  });
});
