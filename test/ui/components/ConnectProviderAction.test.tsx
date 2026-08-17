import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  ConnectProviderAction,
  type ConnectProviderActionLabels,
} from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/ConnectProviderAction";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const locale: AppLocale = "ar";
const labels: ConnectProviderActionLabels = readTranslation(Translation.Dashboard.SettingsMeetingIntegrations, locale);

const providerName = "Zoom";
const ariaLabel = `Connect ${providerName} OAuth`;

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
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("ConnectProviderAction", () => {
  test("renders connect button with provider name", () => {
    renderAction({});
    expect(screen.getByLabelText(ariaLabel)).toBeInTheDocument();
    expect(screen.getByText(labels.connectProvider)).toBeInTheDocument();
  });

  test("calls onConnect when button clicked", () => {
    const onConnect = mock(() => {});
    renderAction({ onConnect });
    fireEvent.click(screen.getByLabelText(ariaLabel));
    expect(onConnect).toHaveBeenCalledWith(MeetingIntegrationProviderSlug.Zoom);
  });

  test("shows loading state when connecting", () => {
    renderAction({ connecting: true });
    expect(screen.getByText(labels.connecting)).toBeInTheDocument();
    expect(screen.getByLabelText(ariaLabel).closest("button")).toBeDisabled();
  });

  test("shows error alert when connectError provided and not connecting", () => {
    renderAction({ connectError: "Authorization failed" });
    expect(screen.getByText(labels.connectProviderError)).toBeInTheDocument();
    // Retry button visible
    expect(screen.getByText(labels.connectProvider)).toBeInTheDocument();
  });

  test("clicking retry in error state calls onConnect", () => {
    const onConnect = mock(() => {});
    renderAction({ connectError: "Authorization failed", onConnect });
    fireEvent.click(screen.getByLabelText(ariaLabel));
    expect(onConnect).toHaveBeenCalledWith(MeetingIntegrationProviderSlug.Zoom);
  });
});
