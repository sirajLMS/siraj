import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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
    name: "أحمد محمد",
    email: "ahmed@example.com",
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
  return render(<ConnectedAccountsTableDesktop {...defaultProps} {...props} />, {
    wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper>,
  });
}

describe("ConnectedAccountsTableDesktop", () => {
  test("renders connected accounts title with provider name", async () => {
    renderTable();
    await waitFor(() => {
      expect(screen.getByText(`${labels.connectedAccounts} — ${labels.provider.zoom}`)).toBeInTheDocument();
    });
  });

  test("renders account rows with name and email", async () => {
    renderTable();
    await waitFor(() => {
      expect(screen.getByText("أحمد محمد")).toBeInTheDocument();
      expect(screen.getByText("ahmed@example.com")).toBeInTheDocument();
    });
  });

  test("renders status chip with correct label", async () => {
    renderTable({ accounts: [makeAccount({ status: MeetingIntegrationConnectedAccountStatus.Connected })] });
    await waitFor(() => {
      expect(screen.getByText(labels.status.connected)).toBeInTheDocument();
    });
  });

  test("renders revoke and viewMetadata action buttons when canEdit=true", async () => {
    renderTable();
    await waitFor(() => {
      expect(screen.getByText(labels.actions.revoke)).toBeInTheDocument();
      expect(screen.getByText(labels.actions.viewMetadata)).toBeInTheDocument();
    });
  });

  test("hides actions column when canEdit=false", async () => {
    renderTable({ canEdit: false });
    await waitFor(() => {
      expect(screen.queryByText(labels.actions.revoke)).not.toBeInTheDocument();
      expect(screen.queryByText(labels.actions.viewMetadata)).not.toBeInTheDocument();
    });
  });

  test("calls onRevokeRequest when revoke button clicked", async () => {
    const onRevokeRequest = mock(() => {});
    const account = makeAccount();
    renderTable({ accounts: [account], onRevokeRequest });
    await waitFor(() => {
      const revokeBtn = screen.getByText(labels.actions.revoke);
      fireEvent.click(revokeBtn);
    });
    expect(onRevokeRequest).toHaveBeenCalledTimes(1);
  });

  test("disables revoke button when revokingFor matches account", async () => {
    const account = makeAccount({ id: "acc-1", userId: "user-1" });
    renderTable({
      accounts: [account],
      revokingFor: { userId: "user-1", providerSlug: MeetingIntegrationProviderSlug.Zoom },
    });
    await waitFor(() => {
      const revokeBtn = screen.getByText(labels.actions.revoke).closest("button");
      expect(revokeBtn).toBeDisabled();
    });
  });

  test("shows empty message when no accounts", async () => {
    renderTable({ accounts: [] });
    await waitFor(() => {
      expect(screen.getByText(labels.noConnectedAccounts)).toBeInTheDocument();
    });
  });

  test("filters rows by search text", async () => {
    const accounts = [
      makeAccount({ id: "1", name: "أحمد", email: "ahmed@test.com" }),
      makeAccount({ id: "2", name: "سارة", email: "sara@test.com" }),
    ];
    renderTable({ accounts });
    await waitFor(() => {
      expect(screen.getByText("أحمد")).toBeInTheDocument();
      expect(screen.getByText("سارة")).toBeInTheDocument();
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

  test("search survives unmount and remount of the table", async () => {
    const accounts = [
      makeAccount({ id: "1", name: "[A]", email: "[EMAIL_REDACTED]" }),
      makeAccount({ id: "2", name: "[B]", email: "[EMAIL_REDACTED]" }),
    ];
    const firstRender = renderTable({ accounts });
    const input = await screen.findByPlaceholderText(labels.searchPlaceholder);
    fireEvent.change(input, { target: { value: "[B]" } });
    await waitFor(() => {
      expect(screen.queryByText("[A]")).not.toBeInTheDocument();
    });
    firstRender.unmount();

    renderTable({ accounts });
    const remountedInput = await screen.findByPlaceholderText(labels.searchPlaceholder);
    expect(remountedInput).toHaveValue("[B]");
    await waitFor(() => {
      expect(screen.queryByText("[A]")).not.toBeInTheDocument();
    });
    expect(screen.getByText("[B]")).toBeInTheDocument();
  });

  test("status filter survives unmount and remount of the table", async () => {
    const accounts = [
      makeAccount({ id: "1", name: "[A]", status: MeetingIntegrationConnectedAccountStatus.Connected }),
      makeAccount({ id: "2", name: "[B]", status: MeetingIntegrationConnectedAccountStatus.Revoked }),
    ];
    const firstRender = renderTable({ accounts });
    await waitFor(() => {
      expect(screen.getByText("[A]")).toBeInTheDocument();
    });
    act(() => {
      useMeetingIntegrationsSettingsStore
        .getState()
        .setConnectedAccountsStatusFilter(
          MeetingIntegrationProviderSlug.Zoom,
          MeetingIntegrationConnectedAccountStatus.Revoked
        );
    });
    await waitFor(() => {
      expect(screen.queryByText("[A]")).not.toBeInTheDocument();
    });
    firstRender.unmount();

    renderTable({ accounts });
    await waitFor(() => {
      expect(screen.getByText("[B]")).toBeInTheDocument();
    });
    expect(screen.queryByText("[A]")).not.toBeInTheDocument();
  });
});
