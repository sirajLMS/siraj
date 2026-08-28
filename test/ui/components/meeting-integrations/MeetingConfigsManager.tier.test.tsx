import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import type * as React from "react";
import { useMemo } from "react";
import type { MeetingConfigListProps } from "@/frontend/common/components/ui/display/meetingConfig/types";
import {
  ViewportContext,
  type ViewportContextType,
  type ViewportTier,
} from "@/frontend/common/context/ViewportContext";
import type { UserMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const meetingConfigLabels = readTranslation(Translation.Ui.MeetingConfig, locale);
const profileNotificationsLabels = readTranslation(Translation.Profile.Notifications, locale);

const labels = {
  manager: meetingConfigLabels.manager,
  classScope: meetingConfigLabels.classScope,
  display: meetingConfigLabels.display,
  summary: meetingConfigLabels.summary,
  reauthNeeded: meetingConfigLabels.reauthNeeded,
  linkedClassInstances: meetingConfigLabels.linkedClassInstances,
  autoGeneration: profileNotificationsLabels.autoGeneration,
  connectAccount: profileNotificationsLabels.connectAccount,
  enhancements: meetingConfigLabels.enhancements,
};

const config: UserMeetingConfigFieldsFragment = {
  id: "cfg-1",
  userId: "user-1",
  providerId: "prov-zoom-1",
  label: "Personal Room",
  isDefault: true,
  hasSecret: false,
  oauthTokenExpiresAt: null,
  providerMetadata: null,
  createdAt: "2026-01-15T10:00:00Z",
  updatedAt: "2026-01-20T12:00:00Z",
  details: { id: "details-1", meetingUrl: "https://zoom.us/j/123", username: null, tenantId: null },
  provider: {
    id: "prov-zoom-1",
    slug: "zoom",
    name: { en: "Zoom", ar: "Zoom" },
    description: null,
    instructions: null,
    urlAllowlist: [],
    urlExample: "https://zoom.us/j/123",
    logoUrl: null,
    providerKind: "oauth",
    isActive: true,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    fieldSchema: null,
  },
};

const noop = () => {};
const asyncNoop = async () => {};

/** Minimal ViewModel surface consumed by the manager; provider lists stay empty
 *  so optional sections (reconnect, token expiry, connect cards) never render. */
const fakeViewModelState = {
  labels,
  t: labels.manager,
  configs: [config],
  loading: false,
  error: undefined,
  refetch: asyncNoop,
  formOpen: false,
  editConfig: null,
  deleteId: null,
  showSuccess: false,
  errorMessage: null,
  deleting: false,
  settingDefault: false,
  deleteLabel: "",
  setDeleteId: noop,
  setShowSuccess: noop,
  setErrorMessage: noop,
  handleSaved: asyncNoop,
  handleConfirmDelete: asyncNoop,
  handleSetDefault: asyncNoop,
  openCreateForm: noop,
  openEditForm: noop,
  closeForm: noop,
  generating: false,
  requiresReconnect: [],
  reauthProviders: [],
  onReconnect: asyncNoop,
  connectProvider: asyncNoop,
  disconnectProvider: asyncNoop,
  disconnecting: false,
  connectProviderAccountItems: [],
  expandedBookingsId: null,
  bookingsInstances: new Map<string, readonly never[]>(),
  bookingsLoading: false,
  handleViewBookings: noop,
  regenerateConfig: asyncNoop,
  navigateToSettings: noop,
  handleOAuthCallback: noop,
  reconnectAllProvider: async () => false,
  onReconnectAllComplete: noop,
  providerTokenExpiryMap: new Map<string, Date>(),
  reconnectingFor: null,
};

await mock.module(
  "@/frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel",
  () => ({
    useMeetingConfigsManagerViewModel: () => fakeViewModelState,
  })
);

function tierToContext(tier: ViewportTier | undefined): ViewportContextType {
  const resolved: ViewportTier = tier ?? "desktop";
  return {
    tier: resolved,
    isMobile: resolved === "mobile" || resolved === "tablet",
    isTablet: resolved === "tablet",
    isDesktop: resolved === "desktop",
  };
}

/**
 * Supplies the viewport tier through context without the real provider's
 * breakpoint `useMediaQuery` calls, so the matchMedia spy below measures only
 * the component under test.
 */
await mock.module("@/frontend/common/providers/theme/ViewportProvider", () => ({
  ViewportProvider: ({
    viewport,
    children,
  }: {
    readonly viewport?: ViewportTier;
    readonly children: React.ReactNode;
  }) => {
    const value = useMemo(() => tierToContext(viewport), [viewport]);
    return <ViewportContext.Provider value={value}>{children}</ViewportContext.Provider>;
  },
}));

await mock.module("@/frontend/mobile/components/ui/display/meetingConfig/MeetingConfigList.mobile", () => ({
  MobileMeetingConfigList: (props: MeetingConfigListProps) => (
    <div data-testid="mobile-meeting-config-list">{props.title}</div>
  ),
}));

await mock.module("@/frontend/desktop/components/ui/display/meetingConfig/MeetingConfigList.desktop", () => ({
  DesktopMeetingConfigList: (props: MeetingConfigListProps) => (
    <div data-testid="desktop-meeting-config-list">{props.title}</div>
  ),
}));

/** Captures the `fullScreen` seam value the manager passes to the form dialog. */
await mock.module("@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialog", () => ({
  MeetingConfigFormDialog: ({ open, fullScreen }: { readonly open: boolean; readonly fullScreen?: boolean }) => (
    <div data-testid="meeting-config-form-dialog" data-open={open} data-fullscreen={String(fullScreen ?? false)} />
  ),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { MeetingConfigsManager } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function renderManager(
  props: Partial<React.ComponentProps<typeof MeetingConfigsManager>> = {},
  viewport: ViewportTier = "desktop"
) {
  return renderWithWrapper(<MeetingConfigsManager targetUserId="user-1" canManage {...props} />, {
    locale,
    viewport,
    mocks: [],
  });
}

describe("MeetingConfigsManager tier isolation", () => {
  test("renders the desktop list variant on the desktop tier", async () => {
    renderManager();
    expect(await screen.findByTestId("desktop-meeting-config-list")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-meeting-config-list")).not.toBeInTheDocument();
  });

  test("renders the mobile list variant on the mobile tier", async () => {
    renderManager({}, "mobile");
    expect(await screen.findByTestId("mobile-meeting-config-list")).toBeInTheDocument();
    expect(screen.queryByTestId("desktop-meeting-config-list")).not.toBeInTheDocument();
  });

  test("registers no matchMedia listeners", async () => {
    const matchMediaSpy = spyOn(window, "matchMedia");
    renderManager();
    await screen.findByTestId("desktop-meeting-config-list");
    expect(matchMediaSpy).not.toHaveBeenCalled();
    matchMediaSpy.mockRestore();
  });

  test("form dialog stays inline by default (desktop seam)", () => {
    renderManager();
    expect(screen.getByTestId("meeting-config-form-dialog")).toHaveAttribute("data-fullscreen", "false");
  });

  test("passes fullScreen through to the form dialog when the mobile tier sets it", () => {
    renderManager({ fullScreenFormDialog: true }, "mobile");
    expect(screen.getByTestId("meeting-config-form-dialog")).toHaveAttribute("data-fullscreen", "true");
  });
});
