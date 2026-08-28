import { afterEach, describe, expect, mock, test } from "bun:test";
import { createElement } from "react";

await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));
await mock.module("@/frontend/common/lib/logger", () => ({
  logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
}));

await mock.module("next/link", () => ({
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string; [key: string]: unknown }) =>
    createElement("a", { href, ...rest }, children),
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.SettingsSiteContent, locale);

import type {
  SiteContentRow,
  SiteContentSettingsViewModel,
} from "@/frontend/common/views/dashboard/settings/types/siteContentSettings.types";
import { SiteContentSettingsTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/siteContent/siteContentSettingsTab.mobile";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function buildViewModel(overrides?: Partial<SiteContentSettingsViewModel>): SiteContentSettingsViewModel {
  return {
    rows: [],
    loading: false,
    canManage: true,
    labels,
    formOpen: false,
    editRow: null,
    deleteRow: null,
    isDeleting: false,
    togglingPublishId: null,
    onAdd: () => {},
    onEdit: () => {},
    onDelete: () => {},
    onFormClose: () => {},
    onDeleteClose: () => {},
    onSaved: async () => {},
    onConfirmDelete: async () => {},
    onTogglePublish: async () => {},
    ...overrides,
  };
}

const sampleRow: SiteContentRow = {
  id: "content-1",
  slug: "about-us",
  title: "About Us",
  body: "About page body",
  contentType: "page",
  isPublished: true,
};

describe("SiteContentSettingsTab — mobile", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders section panel with title, subtitle and add action", async () => {
    renderWithWrapper(<SiteContentSettingsTabMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.title)).toBeInTheDocument();
      expect(screen.getByText(labels.subtitle)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: labels.addLabel })).toBeInTheDocument();
    });
  });

  test("hides the add action when the user cannot manage content", async () => {
    renderWithWrapper(<SiteContentSettingsTabMobileView {...buildViewModel({ canManage: false })} />, {
      locale,
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText(labels.title)).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: labels.addLabel })).not.toBeInTheDocument();
  });

  test("renders content rows in the card list", async () => {
    renderWithWrapper(<SiteContentSettingsTabMobileView {...buildViewModel({ rows: [sampleRow] })} />, {
      locale,
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText(sampleRow.title)).toBeInTheDocument();
    });
    expect(screen.getByText(`${labels.slugColumn}: ${sampleRow.slug}`)).toBeInTheDocument();
    expect(screen.getByText(`${labels.contentTypeColumn}: ${labels.contentTypePage}`)).toBeInTheDocument();
  });
});
