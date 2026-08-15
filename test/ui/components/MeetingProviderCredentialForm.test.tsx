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
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { gql } from "@apollo/client";

expect.extend(matchers);

import {
  deleteEnvConfigEntryMutationDocument,
  envConfigEntriesQueryDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { MeetingIntegrationProviderSlug } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { MeetingProviderCredentialForm } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingProviderCredentialForm";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
  showNotification.mockClear();
});

const labels = {
  loading: "جارٍ التحميل…",
  loadError: "تعذّر التحميل",
  credentialFormCreateTitle: "إضافة بيانات",
  credentialFormEditTitle: "تعديل البيانات",
  clientIdRequired: "معرّف العميل مطلوب",
  clientSecretRequired: "السر مطلوب",
  scopesRequired: "النطاقات مطلوبة",
  credentialsSaved: "تم الحفظ",
  credentialForm: {
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
    notifications: {
      saveError: "تعذّر الحفظ",
      saveSuccess: "تم الحفظ",
    },
  },
  actions: {
    cancel: "إلغاء",
  },
} as unknown as SettingsMeetingIntegrationsLabels;

function makeProvider(slug: MeetingIntegrationProviderSlug = MeetingIntegrationProviderSlug.Zoom) {
  return {
    id: "prov-1",
    slug,
    kind: "oauth",
    credentialsHealthy: true,
    lastTestedAt: null,
    connectedTeacherCount: 0,
    reauthNeededCount: 0,
    endpoints: {},
  };
}

const ZOOM_ENTRIES = [
  {
    id: "e1",
    key: "ZOOM_CLIENT_ID",
    value: "client123",
    category: "meeting",
    hasDbOverride: true,
  },
  {
    id: "e2",
    key: "ZOOM_CLIENT_SECRET",
    value: "secret456",
    category: "meeting",
    hasDbOverride: true,
  },
  {
    id: "e3",
    key: "ZOOM_SCOPES",
    value: "meeting:write,meeting:read",
    category: "meeting",
    hasDbOverride: true,
  },
];

const ENV_QUERY_MOCK = {
  request: {
    query: envConfigEntriesQueryDocument,
  },
  result: {
    data: {
      envConfigEntries: ZOOM_ENTRIES,
    },
  },
};

const UPSERT_MOCK = {
  request: {
    query: upsertEnvConfigEntryMutationDocument,
    variables: { input: { key: "ZOOM_CLIENT_ID", value: "client123" } },
  },
  result: { data: { upsertEnvConfigEntry: { key: "ZOOM_CLIENT_ID" } } },
};

describe("MeetingProviderCredentialForm", () => {
  test("renders form fields when entries loaded", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [ENV_QUERY_MOCK] }
    );

    await waitFor(() => {
      expect(screen.getByLabelText("معرّف العميل")).toBeInTheDocument();
    });

    expect(screen.getByLabelText("السر")).toBeInTheDocument();
    expect(screen.getByLabelText("سر الويبهوك")).toBeInTheDocument();
    expect(screen.getByLabelText("معرّف الحساب")).toBeInTheDocument();
  });

  test("shows edit title when credentials exist (hasDbOverride)", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [ENV_QUERY_MOCK] }
    );

    await waitFor(() => {
      expect(screen.getByText("تعديل البيانات")).toBeInTheDocument();
    });
  });

  test("shows save button", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [ENV_QUERY_MOCK] }
    );

    await waitFor(() => {
      expect(screen.getByText("حفظ")).toBeInTheDocument();
    });
  });

  test("renders scopes chips from existing entries", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [ENV_QUERY_MOCK] }
    );

    await waitFor(() => {
      expect(screen.getByText("meeting:write")).toBeInTheDocument();
      expect(screen.getByText("meeting:read")).toBeInTheDocument();
    });
  });

  test("renders Microsoft Teams tenant ID field for Teams provider", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider(MeetingIntegrationProviderSlug.MicrosoftTeams)} labels={labels} />,
      { mocks: [
        {
          request: { query: envConfigEntriesQueryDocument },
          result: { data: { envConfigEntries: [] } },
        },
      ] }
    );

    await waitFor(() => {
      expect(screen.getByLabelText("معرّف المستأجر")).toBeInTheDocument();
    });
  });

  test("shows loading state while entries are loading", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [
        {
          request: { query: envConfigEntriesQueryDocument },
          delay: 1000,
          result: { data: { envConfigEntries: ZOOM_ENTRIES } },
        },
      ] }
    );

    expect(screen.getByText("إضافة بيانات")).toBeInTheDocument();
    expect(screen.getByText("جارٍ التحميل…")).toBeInTheDocument();
  });

  test("shows error state when query fails", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [
        {
          request: { query: envConfigEntriesQueryDocument },
          error: [new Error("network error")],
        },
      ] }
    );

    await waitFor(() => {
      expect(screen.getByText("تعذّر التحميل")).toBeInTheDocument();
    });
  });

  test("shows noFields when entries empty and not loading", async () => {
    renderWithWrapper(
      <MeetingProviderCredentialForm provider={makeProvider()} labels={labels} />,
      { mocks: [
        {
          request: { query: envConfigEntriesQueryDocument },
          result: { data: { envConfigEntries: [] } },
        },
      ] }
    );

    await waitFor(() => {
      expect(screen.getByText("لا توجد حقول")).toBeInTheDocument();
    });
  });
});
