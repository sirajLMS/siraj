import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { ProfileLinkCallout } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ProfileLinkCallout";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels = {
  viewProfileMeetingConfigs: "عرض إعدادات الاجتماع",
} as unknown as SettingsMeetingIntegrationsLabels;

function renderCallout(props: Record<string, unknown>) {
  return render(
    <ProfileLinkCallout labels={labels} onNavigate={mock(() => {})} {...props} />,
    { wrapper: TestWrapper },
  );
}

describe("ProfileLinkCallout", () => {
  test("renders navigate button with label", () => {
    renderCallout({ permissions: [AppPermission.SettingsEditMeetingIntegrations] });
    expect(screen.getByLabelText("Navigate to teacher meeting configs")).toBeInTheDocument();
    expect(screen.getByText("عرض إعدادات الاجتماع")).toBeInTheDocument();
  });

  test("calls onNavigate when button clicked", () => {
    const onNavigate = mock(() => {});
    renderCallout({
      onNavigate,
      permissions: [AppPermission.SettingsEditMeetingIntegrations],
    });
    fireEvent.click(screen.getByLabelText("Navigate to teacher meeting configs"));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test("does not render when permission not granted", () => {
    renderCallout({ permissions: [] });
    expect(screen.queryByLabelText("Navigate to teacher meeting configs")).not.toBeInTheDocument();
  });
});
