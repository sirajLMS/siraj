import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, waitFor } from "@testing-library/react";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/dashboard", { locale: "en" });

await mock.module("@toolpad/core/useNotifications", () => ({
  useNotifications: () => ({ show: mock(() => {}) }),
}));

import { appearanceSettingsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents";
import { DEFAULT_APPEARANCE_DRAFT, useAppearancePreviewStore } from "@/frontend/common/stores/appearancePreviewStore";
import { CustomizeToolbar } from "@/frontend/common/views/dashboard/components/customize/CustomizeToolbar";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const SERVER_DRAFT = {
  colors: {
    light: { primaryMain: "#1976D2", secondaryMain: "#3F51B5" },
    dark: { primaryMain: "#42A5F5", secondaryMain: "#7986CB" },
  },
  logoUrl: "https://cdn.example.com/server-logo.png",
  siteName: "Server Draft Name",
  siteTitle: "Server Draft Title",
  siteDescription: "Server draft description",
  defaultColorScheme: "dark",
};

const appearanceRow = {
  __typename: "AppearanceSettings",
  id: "appearance",
  primaryMain: "#42A5F5",
  secondaryMain: "#7986CB",
  logoUrl: SERVER_DRAFT.logoUrl,
  siteName: SERVER_DRAFT.siteName,
  siteTitle: SERVER_DRAFT.siteTitle,
  siteDescription: SERVER_DRAFT.siteDescription,
  defaultColorScheme: "dark",
  draftFields: {
    __typename: "AppearanceFields",
    ...SERVER_DRAFT,
    colors: {
      __typename: "AppearanceColors",
      light: { __typename: "AppearanceColorPair", ...SERVER_DRAFT.colors.light },
      dark: { __typename: "AppearanceColorPair", ...SERVER_DRAFT.colors.dark },
    },
  },
  updatedByUserId: "user-1",
  updatedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const queryMock = () => ({
  request: { query: appearanceSettingsQueryDocument, variables: { draft: true } },
  result: { data: { appearanceSettings: appearanceRow } },
});

function resetStore(): void {
  useAppearancePreviewStore.setState(
    {
      draft: DEFAULT_APPEARANCE_DRAFT,
      dirty: false,
      hydrated: false,
      lastPublished: null,
      presetId: "default",
      past: [],
      future: [],
    },
    false
  );
}

describe("CustomizeToolbar — server draft seeding", () => {
  beforeEach(() => {
    resetStore();
  });

  afterEach(() => {
    cleanup();
    resetStore();
  });

  test("seeds the draft store from the server draftFields once the query resolves", async () => {
    expect(useAppearancePreviewStore.getState().draft.siteName).toBe(DEFAULT_APPEARANCE_DRAFT.siteName);

    renderWithWrapper(<CustomizeToolbar />, { locale: "en", mocks: [queryMock()] });

    await waitFor(() => {
      expect(useAppearancePreviewStore.getState().hydrated).toBe(true);
    });

    const draft = useAppearancePreviewStore.getState().draft;
    expect(draft.siteName).toBe("Server Draft Name");
    expect(draft.siteTitle).toBe("Server Draft Title");
    expect(draft.logoUrl).toBe("https://cdn.example.com/server-logo.png");
    expect(draft.colors?.light?.primaryMain).toBe("#1976D2");
    expect(draft.colors?.dark?.primaryMain).toBe("#42A5F5");
    expect(useAppearancePreviewStore.getState().dirty).toBe(false);
  });

  test("does not clobber unsaved local edits when the query resolves", async () => {
    useAppearancePreviewStore.setState({ dirty: true });

    renderWithWrapper(<CustomizeToolbar />, { locale: "en", mocks: [queryMock()] });

    // Give the query a chance to resolve; the dirty flag must block seeding.
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(useAppearancePreviewStore.getState().hydrated).toBe(false);
    expect(useAppearancePreviewStore.getState().draft.siteName).toBe(DEFAULT_APPEARANCE_DRAFT.siteName);
  });
});
