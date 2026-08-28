import { afterEach, describe, expect, mock, test } from "bun:test";

// Stub @toolpad/core/useNotifications — must be before component imports.
const showNotification = mock(() => {});
await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: showNotification }),
}));

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: {
    info: () => {},
    warn: () => {},
    debug: () => {},
    error: () => {},
  },
}));

await mock.module("next/navigation", () => ({
  useRouter: () => ({
    refresh: mock(() => {}),
    push: mock(() => {}),
    replace: mock(() => {}),
    back: mock(() => {}),
  }),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql";
import { envConfigEntriesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { MeetingProviderCredentialForm } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm";
import type { MeetingIntegrationProviderSummary } from "@/frontend/common/views/dashboard/settings/types/meetingIntegrations.types";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  showNotification.mockClear();
});

import { createMeetingIntegrationLabelsMock } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/meetingIntegrationsStoryMocks";

const baseLabels = createMeetingIntegrationLabelsMock();
const labels: SettingsMeetingIntegrationsLabels = {
  ...baseLabels,
  loading: "جارٍ التحميل…",
  loadError: "تعذّر التحميل",
  credentialFormCreateTitle: "إضافة بيانات",
  credentialFormEditTitle: "تعديل البيانات",
  clientIdRequired: "معرّف العميل مطلوب",
  clientSecretRequired: "السر مطلوب",
  scopesRequired: "النطاقات مطلوبة",
  credentialsSaved: "تم الحفظ",
  credentialForm: {
    ...baseLabels.credentialForm,
    clientId: "معرّف العميل",
    clientSecret: "السر",
    tenantId: "معرّف المستأجر",
    accountId: "معرّف الحساب",
    scopes: "النطاقات",
    scopesPlaceholder: "أدخل النطاق واضغط Enter",
    webhookSecret: "سر الويبهوك",
    showValue: "إظهار",
    hideValue: "إخفاء",
    save: "حفظ",
    saving: "جارٍ الحفظ…",
    noFields: "لا توجد حقول",
    removeScope: "حذف النطاق",
  },
  actions: {
    ...baseLabels.actions,
    cancel: "إلغاء",
  },
};

function makeProvider(
  slug: MeetingIntegrationProviderSlug = MeetingIntegrationProviderSlug.Zoom
): MeetingIntegrationProviderSummary {
  return {
    id: "prov-1",
    slug,
    kind: "oauth",
    credentialsHealthy: true,
    lastTestedAt: null,
    connectedTeacherCount: 0,
    reauthNeededCount: 0,
    endpoints: ["https://zoom.us/oauth"],
  };
}

const ZOOM_ENTRIES = [
  {
    __typename: "EnvConfigEntry",
    id: "e1",
    key: "ZOOM_CLIENT_ID",
    value: "client123",
    category: "meeting",
    displayStrategy: "text",
    description: null,
    isSecret: false,
    excludeFromDb: false,
    source: "db",
    hasDbOverride: true,
    editable: true,
  },
  {
    __typename: "EnvConfigEntry",
    id: "e2",
    key: "ZOOM_CLIENT_SECRET",
    value: "secret456",
    category: "meeting",
    displayStrategy: "text",
    description: null,
    isSecret: true,
    excludeFromDb: false,
    source: "db",
    hasDbOverride: true,
    editable: true,
  },
  {
    __typename: "EnvConfigEntry",
    id: "e3",
    key: "ZOOM_SCOPES",
    value: "meeting:write,meeting:read",
    category: "meeting",
    displayStrategy: "text",
    description: null,
    isSecret: false,
    excludeFromDb: false,
    source: "db",
    hasDbOverride: true,
    editable: true,
  },
];

const ENV_QUERY_MOCK = () => ({
  request: {
    query: envConfigEntriesQueryDocument,
  },
  result: {
    data: {
      __typename: "Query",
      envConfigEntries: ZOOM_ENTRIES,
    },
  },
});

function renderForm(mocks?: NonNullable<Parameters<typeof renderWithWrapper>[1]>["mocks"], provider = makeProvider()) {
  return renderWithWrapper(<MeetingProviderCredentialForm provider={provider} labels={labels} />, {
    mocks: mocks ?? [ENV_QUERY_MOCK()],
  });
}

describe("MeetingProviderCredentialForm", () => {
  test("renders form fields when entries loaded", async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByLabelText("معرّف العميل")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("السر")).toBeInTheDocument();
    expect(screen.getByLabelText("سر الويبهوك")).toBeInTheDocument();
    expect(screen.getByLabelText("معرّف الحساب")).toBeInTheDocument();
  });

  test("shows edit title when credentials exist (hasDbOverride)", async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByText("تعديل البيانات")).toBeInTheDocument();
    });
  });

  test("shows save button", async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByText("حفظ")).toBeInTheDocument();
    });
  });

  test("renders scopes chips from existing entries", async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByText("meeting:write")).toBeInTheDocument();
      expect(screen.getByText("meeting:read")).toBeInTheDocument();
    });
  });

  test("adds a scope via Enter and removes it via chip delete", async () => {
    renderForm();

    await waitFor(() => {
      expect(screen.getByText("meeting:write")).toBeInTheDocument();
    });

    const scopesLabel = screen.getByText(labels.credentialForm.scopes);
    const scopesInput = scopesLabel.parentElement?.querySelector("input");
    expect(scopesInput).not.toBeNull();
    if (!scopesInput) {
      return;
    }

    fireEvent.change(scopesInput, { target: { value: "meeting:update" } });
    fireEvent.keyDown(scopesInput, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("meeting:update")).toBeInTheDocument();
    });

    const chip = screen.getByText("meeting:update").closest(".MuiChip-root");
    const deleteIcon = chip?.querySelector(".MuiChip-deleteIcon");
    expect(deleteIcon).not.toBeNull();
    if (!deleteIcon) {
      return;
    }
    fireEvent.click(deleteIcon);

    await waitFor(() => {
      expect(screen.queryByText("meeting:update")).not.toBeInTheDocument();
    });
  });

  test("renders Microsoft Teams tenant ID field for Teams provider", async () => {
    const TEAMS_ENTRIES = [
      {
        __typename: "EnvConfigEntry",
        id: "t1",
        key: "MICROSOFT_TEAMS_CLIENT_ID",
        value: "teams-client-id",
        category: "meeting",
        displayStrategy: "text",
        description: null,
        isSecret: false,
        excludeFromDb: false,
        source: "db",
        hasDbOverride: true,
        editable: true,
      },
      {
        __typename: "EnvConfigEntry",
        id: "t2",
        key: "MICROSOFT_TEAMS_CLIENT_SECRET",
        value: "teams-secret",
        category: "meeting",
        displayStrategy: "text",
        description: null,
        isSecret: true,
        excludeFromDb: false,
        source: "db",
        hasDbOverride: true,
        editable: true,
      },
      {
        __typename: "EnvConfigEntry",
        id: "t3",
        key: "MICROSOFT_TEAMS_TENANT_ID",
        value: "teams-tenant-123",
        category: "meeting",
        displayStrategy: "text",
        description: null,
        isSecret: false,
        excludeFromDb: false,
        source: "db",
        hasDbOverride: true,
        editable: true,
      },
      {
        __typename: "EnvConfigEntry",
        id: "t4",
        key: "MICROSOFT_TEAMS_SCOPES",
        value: "https://graph.microsoft.com/.default",
        category: "meeting",
        displayStrategy: "text",
        description: null,
        isSecret: false,
        excludeFromDb: false,
        source: "db",
        hasDbOverride: true,
        editable: true,
      },
    ];
    renderForm(
      [
        {
          request: { query: envConfigEntriesQueryDocument },
          result: { data: { __typename: "Query", envConfigEntries: TEAMS_ENTRIES } },
        },
      ],
      makeProvider(MeetingIntegrationProviderSlug.MicrosoftTeams)
    );

    await waitFor(() => {
      expect(screen.getByLabelText("معرّف المستأجر")).toBeInTheDocument();
    });
  });

  test("shows loading state while entries are loading", async () => {
    renderForm([
      {
        request: { query: envConfigEntriesQueryDocument },
        delay: 1000,
        result: { data: { __typename: "Query", envConfigEntries: ZOOM_ENTRIES } },
      },
    ]);

    expect(screen.getByText("إضافة بيانات")).toBeInTheDocument();
    expect(screen.getByText("جارٍ التحميل…")).toBeInTheDocument();
  });

  test.each([
    ["shows error state when query fails", { error: new Error("network error") }, "تعذّر التحميل"],
    [
      "shows noFields when entries empty and not loading",
      { result: { data: { __typename: "Query", envConfigEntries: [] } } },
      "لا توجد حقول",
    ],
  ])("%s", async (_name, mockConfig, expectedText) => {
    renderForm([{ request: { query: envConfigEntriesQueryDocument }, ...mockConfig }]);
    await waitFor(() => {
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });
  });
});
