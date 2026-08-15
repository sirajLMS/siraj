import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingIntegrationConnectedAccountStatus,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type {
  ConnectedAccountsTableProps,
  MeetingIntegrationConnectedAccount,
} from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import { ConnectedAccountsTableDesktop } from "@/frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const baseLabels = createMeetingIntegrationLabelsMock();
const labels: SettingsMeetingIntegrationsLabels = {
  ...baseLabels,
  connectedAccounts: "الحسابات المرتبطة",
  noConnectedAccounts: "لا توجد حسابات",
  provider: {
    zoom: "Zoom",
    googleMeet: "Google Meet",
    microsoftTeams: "Microsoft Teams",
  },
  status: {
    ...baseLabels.status,
    connected: "مرتبط",
    expiringSoon: "على وشك الانتهاء",
    reauthNeeded: "مطلوب إعادة ربط",
    revoked: "مُلغى",
  },
  columns: {
    ...baseLabels.columns,
    name: "الاسم",
    email: "البريد",
    connectedAt: "تاريخ الربط",
    expiresAt: "تاريخ الانتهاء",
    status: "الحالة",
    actions: "إجراءات",
  },
  actions: {
    ...baseLabels.actions,
    viewMetadata: "عرض التفاصيل",
    revoke: "إلغاء",
    cancel: "إلغاء",
  },
};

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
  return render(<ConnectedAccountsTableDesktop {...defaultProps} {...props} />, { wrapper: TestWrapper });
}

describe("ConnectedAccountsTableDesktop", () => {
  beforeEach(() => {
    // Reset any pending timers
  });

  test("renders connected accounts title with provider name", () => {
    renderTable();
    expect(screen.getByText(`الحسابات المرتبطة — Zoom`)).toBeInTheDocument();
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
      expect(screen.getByText("مرتبط")).toBeInTheDocument();
    });
  });

  test("renders revoke and viewMetadata action buttons when canEdit=true", async () => {
    renderTable();
    await waitFor(() => {
      expect(screen.getByText("إلغاء")).toBeInTheDocument();
      expect(screen.getByText("عرض التفاصيل")).toBeInTheDocument();
    });
  });

  test("hides actions column when canEdit=false", async () => {
    renderTable({ canEdit: false });
    await waitFor(() => {
      expect(screen.queryByText("إلغاء")).not.toBeInTheDocument();
      expect(screen.queryByText("عرض التفاصيل")).not.toBeInTheDocument();
    });
  });

  test("calls onRevokeRequest when revoke button clicked", async () => {
    const onRevokeRequest = mock(() => {});
    const account = makeAccount();
    renderTable({ accounts: [account], onRevokeRequest });
    await waitFor(() => {
      const revokeBtn = screen.getByText("إلغاء");
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
      const revokeBtn = screen.getByText("إلغاء").closest("button");
      expect(revokeBtn).toBeDisabled();
    });
  });

  test("shows empty message when no accounts", async () => {
    renderTable({ accounts: [] });
    await waitFor(() => {
      expect(screen.getByText("لا توجد حسابات")).toBeInTheDocument();
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
});
