import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ConnectProviderAction } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels = {
  connectProvider: "ربط المزود",
  connecting: "جارٍ الربط…",
  connectProviderError: "تعذّر ربط المزود.",
} as unknown as SettingsMeetingIntegrationsLabels;

function renderAction(props: Record<string, unknown>) {
  return render(
    <ConnectProviderAction
      labels={labels}
      providerSlug={MeetingIntegrationProviderSlug.Zoom}
      providerName="Zoom"
      connecting={false}
      connectError={null}
      onConnect={mock(() => {})}
      {...props}
    />,
    { wrapper: TestWrapper }
  );
}

describe("ConnectProviderAction", () => {
  test("renders connect button with provider name", () => {
    renderAction({});
    expect(screen.getByLabelText("Connect Zoom OAuth")).toBeInTheDocument();
    expect(screen.getByText("ربط المزود")).toBeInTheDocument();
  });

  test("calls onConnect when button clicked", () => {
    const onConnect = mock(() => {});
    renderAction({ onConnect });
    fireEvent.click(screen.getByLabelText("Connect Zoom OAuth"));
    expect(onConnect).toHaveBeenCalledWith(MeetingIntegrationProviderSlug.Zoom);
  });

  test("shows loading state when connecting", () => {
    renderAction({ connecting: true });
    expect(screen.getByText("جارٍ الربط…")).toBeInTheDocument();
    expect(screen.getByLabelText("Connect Zoom OAuth").closest("button")).toBeDisabled();
  });

  test("shows error alert when connectError provided and not connecting", () => {
    renderAction({ connectError: "Authorization failed" });
    expect(screen.getByText("تعذّر ربط المزود.")).toBeInTheDocument();
    // Retry button visible
    expect(screen.getByText("ربط المزود")).toBeInTheDocument();
  });

  test("clicking retry in error state calls onConnect", () => {
    const onConnect = mock(() => {});
    renderAction({ connectError: "Authorization failed", onConnect });
    fireEvent.click(screen.getByLabelText("Connect Zoom OAuth"));
    expect(onConnect).toHaveBeenCalledWith(MeetingIntegrationProviderSlug.Zoom);
  });
});
