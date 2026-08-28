import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql";
import { useMeetingIntegrationsSettingsStore } from "@/frontend/common/stores/meetingIntegrationsSettingsStore";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { ConnectedAccountsTableDesktop } from "@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop";
import { ConnectedAccountsTableMobile } from "@/frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  useMeetingIntegrationsSettingsStore.getState().reset();
});

const locale: AppLocale = "ar";
const labels: SettingsMeetingIntegrationsLabels = readTranslation(
  Translation.Dashboard.SettingsMeetingIntegrations,
  locale
);

function makeAccount(overrides: Partial<MeetingIntegrationConnectedAccount> = {}): MeetingIntegrationConnectedAccount {
  return {
    id: "acc-1",
    userId: "user-1",
    name: "أحمد",
    email: "[EMAIL_REDACTED]",
    connectedAt: new Date("2025-01-10"),
    expiresAt: new Date("2025-02-10"),
    lastRefreshedAt: null,
    status: MeetingIntegrationConnectedAccountStatus.Connected,
    ...overrides,
  };
}

function renderTable(props: Partial<ConnectedAccountsTableProps> = {}) {
  const defaultProps: ConnectedAccountsTableProps = {
    labels,
    accounts: [makeAccount()],
    loading: false,
    providerSlug: MeetingIntegrationProviderSlug.Zoom,
    canEdit: true,
    revokingFor: null,
    onRevokeRequest: mock(() => {}),
    onMetadataDialogOpen: mock(() => {}),
  };
  return render(<ConnectedAccountsTableMobile {...defaultProps} {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("ConnectedAccountsTableMobile", () => {
  test("renders connected accounts title with provider name", async () => {
    renderTable();
    await waitFor(() => {
      expect(screen.getByText(`${labels.connectedAccounts} — ${labels.provider.zoom}`)).toBeInTheDocument();
    });
  });

  test("search input change filters rows via handler", async () => {
    const accounts = [
      makeAccount({ id: "1", name: "[A]", email: "[EMAIL_REDACTED]" }),
      makeAccount({ id: "2", name: "[B]", email: "[EMAIL_REDACTED]" }),
    ];
    renderTable({ accounts });
    const input = await screen.findByPlaceholderText(labels.searchPlaceholder);
    fireEvent.change(input, { target: { value: "[B]" } });
    await waitFor(() => {
      expect(screen.queryByText("[A]")).not.toBeInTheDocument();
    });
    expect(screen.getByText("[B]")).toBeInTheDocument();
  });

  test("shows searching helper text while a search term is entered", async () => {
    renderTable();
    const input = await screen.findByPlaceholderText(labels.searchPlaceholder);
    fireEvent.change(input, { target: { value: "Term" } });
    await waitFor(() => {
      expect(screen.getByText(labels.searching)).toBeInTheDocument();
    });
  });

  test("search typed on the desktop variant survives switching to the mobile variant", async () => {
    const desktopProps: ConnectedAccountsTableProps = {
      labels,
      accounts: [makeAccount()],
      loading: false,
      providerSlug: MeetingIntegrationProviderSlug.Zoom,
      canEdit: true,
      revokingFor: null,
      onRevokeRequest: mock(() => {}),
      onMetadataDialogOpen: mock(() => {}),
    };
    const desktopRender = render(<ConnectedAccountsTableDesktop {...desktopProps} />, {
      wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
    });
    const desktopInput = await screen.findByPlaceholderText(labels.searchPlaceholder);
    fireEvent.change(desktopInput, { target: { value: "Term" } });
    await waitFor(() => {
      expect(screen.getByText(labels.searching)).toBeInTheDocument();
    });
    desktopRender.unmount();

    renderTable();
    const mobileInput = await screen.findByPlaceholderText(labels.searchPlaceholder);
    expect(mobileInput).toHaveValue("Term");
    expect(screen.getByText(labels.searching)).toBeInTheDocument();
  });
});
