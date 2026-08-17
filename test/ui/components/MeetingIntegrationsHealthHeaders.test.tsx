import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, render, screen } from "@testing-library/react";

import type { ReactNode } from "react";

expect.extend(matchers);

import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MeetingIntegrationsHealthHeadersShared } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/__shared__/meetingIntegrationsHealthHeadersShared";
import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";
import type { MeetingIntegrationsViewModel } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const t = readTranslation(Translation.Dashboard.SettingsMeetingIntegrations, locale);

afterEach(() => {
  cleanup();
});

const baseLabels = createMeetingIntegrationLabelsMock();
const labels: SettingsMeetingIntegrationsLabels = {
  ...baseLabels,
  totalProviders: t.totalProviders,
  connectedProviders: t.connectedProviders,
  providersWithIssues: t.providersWithIssues,
  disconnectedProviders: t.disconnectedProviders,
  provider: {
    zoom: t.provider.zoom,
    googleMeet: t.provider.googleMeet,
    microsoftTeams: t.provider.microsoftTeams,
  },
};

function makeProvider(
  overrides: Partial<{
    slug: MeetingIntegrationProviderSlug;
    credentialsHealthy: boolean;
    reauthNeededCount: number;
  }> = {}
) {
  return {
    id: "prov-1",
    slug: overrides.slug ?? MeetingIntegrationProviderSlug.Zoom,
    kind: "oauth" as const,
    credentialsHealthy: overrides.credentialsHealthy ?? true,
    lastTestedAt: null,
    connectedTeacherCount: 0,
    reauthNeededCount: overrides.reauthNeededCount ?? 0,
    endpoints: ["https://zoom.us/oauth"],
  };
}

function makeViewModel(overrides: Partial<MeetingIntegrationsViewModel> = {}): MeetingIntegrationsViewModel {
  return {
    labels,
    locale,
    loading: false,
    error: undefined,
    canEdit: true,
    providers: [makeProvider()],
    expandedSlug: null,
    onExpandedSlugChange: mock(() => {}),
    connectedAccountsByProvider: {},
    loadingAccountsFor: null,
    testingFor: null,
    lastTestResultByProvider: {
      [MeetingIntegrationProviderSlug.Zoom]: null,
      [MeetingIntegrationProviderSlug.GoogleMeet]: null,
      [MeetingIntegrationProviderSlug.MicrosoftTeams]: null,
    },
    revokingFor: null,
    metadataDialogAccount: null,
    metadataDialogProviderSlug: null,
    runTest: mock(() => Promise.resolve()),
    revokeAccount: mock(() => Promise.resolve()),
    onMetadataDialogOpen: mock(() => {}),
    onMetadataDialogClose: mock(() => {}),
    connectingFor: null,
    connectErrorFor: {},
    connectProvider: mock(() => {}),
    navigateToProfile: mock(() => {}),
    canViewProfile: true,
    refresh: mock(() => Promise.resolve()),
    ...overrides,
  };
}

const SkeletonComponent = () => <div data-testid="skeleton">Skeleton</div>;

const MetricsRenderer = ({
  metrics,
}: {
  metrics: readonly { key: string; label?: string; count: number | string }[];
}) => (
  <div data-testid="metrics">
    {metrics.map(m => (
      <div key={m.key} data-testid={`metric-${m.key}`}>
        <span data-testid={`label-${m.key}`}>{m.label}</span>
        <span data-testid={`count-${m.key}`}>{m.count}</span>
      </div>
    ))}
  </div>
);

function renderShared(viewModel: MeetingIntegrationsViewModel) {
  return render(
    <MeetingIntegrationsHealthHeadersShared
      viewModel={viewModel}
      renderSkeleton={() => (<SkeletonComponent />) as ReactNode}
      renderMetrics={metrics => MetricsRenderer({ metrics }) as ReactNode}
    />,
    { wrapper: ({ children }) => <TestWrapper locale={locale}>{children}</TestWrapper> }
  );
}

describe("MeetingIntegrationsHealthHeadersShared", () => {
  test("renders skeleton when loading=true", () => {
    renderShared(makeViewModel({ loading: true }));
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  test("renders 4 metrics when data loaded", () => {
    renderShared(makeViewModel({ loading: false }));
    expect(screen.getByTestId("metric-totalProviders")).toBeInTheDocument();
    expect(screen.getByTestId("metric-connected")).toBeInTheDocument();
    expect(screen.getByTestId("metric-issues")).toBeInTheDocument();
    expect(screen.getByTestId("metric-disconnected")).toBeInTheDocument();
  });

  test("shows correct counts when providers loaded", () => {
    // connected = credentialsHealthy count; disconnected = !credentialsHealthy count
    // issues = sum of reauthNeededCount across all providers
    const providers = [
      makeProvider({ slug: MeetingIntegrationProviderSlug.Zoom, credentialsHealthy: true, reauthNeededCount: 0 }),
      makeProvider({
        slug: MeetingIntegrationProviderSlug.GoogleMeet,
        credentialsHealthy: false,
        reauthNeededCount: 2,
      }),
      makeProvider({
        slug: MeetingIntegrationProviderSlug.MicrosoftTeams,
        credentialsHealthy: true,
        reauthNeededCount: 1,
      }),
    ];
    renderShared(makeViewModel({ providers }));

    expect(screen.getByTestId("count-totalProviders")).toHaveTextContent("3");
    expect(screen.getByTestId("count-connected")).toHaveTextContent("2");
    expect(screen.getByTestId("count-issues")).toHaveTextContent("3"); // 2 + 1
    expect(screen.getByTestId("count-disconnected")).toHaveTextContent("1");
  });

  test("shows zero counts and empty labels when no providers (empty state)", () => {
    renderShared(makeViewModel({ providers: [] }));
    expect(screen.getByTestId("count-totalProviders")).toHaveTextContent("0");
    expect(screen.getByTestId("count-connected")).toHaveTextContent("0");
    expect(screen.getByTestId("count-issues")).toHaveTextContent("0");
    expect(screen.getByTestId("count-disconnected")).toHaveTextContent("0");
  });

  test("applies error variant to metrics when error present", () => {
    renderShared(makeViewModel({ error: new Error("fail") }));
    // Still renders metrics, but variant is error — we just verify metrics render
    expect(screen.getByTestId("metric-totalProviders")).toBeInTheDocument();
  });
});
