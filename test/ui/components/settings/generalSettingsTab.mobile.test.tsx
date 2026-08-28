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
const labels = readTranslation(Translation.Dashboard.SettingsGeneral, locale);

import type { GeneralSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/generalSettings.types";
import { GeneralSettingsTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/general/generalSettingsTab.mobile";
import { SystemSettingCategory, SystemSettingDataType } from "@/shared/constants/settings/system-settings.enum";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function buildViewModel(overrides?: Partial<GeneralSettingsViewModel>): GeneralSettingsViewModel {
  return {
    rows: [],
    loading: false,
    canManage: true,
    labels,
    savingCode: null,
    onValueChange: async () => {},
    ...overrides,
  };
}

const sampleRow: GeneralSettingsViewModel["rows"][number] = {
  code: "auth_max_attempts",
  slug: "auth-max-attempts",
  label: "Max Login Attempts",
  description: "Maximum failed login attempts before lockout",
  dataType: SystemSettingDataType.Integer,
  category: SystemSettingCategory.Security,
  defaultValue: "5",
  value: "5",
  isFromDb: false,
  updatedByUserId: null,
  updatedAt: null,
};

describe("GeneralSettingsTab — mobile", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders section panel title and subtitle", async () => {
    renderWithWrapper(<GeneralSettingsTabMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.title)).toBeInTheDocument();
      expect(screen.getByText(labels.subtitle)).toBeInTheDocument();
    });
  });

  test("renders empty state when there are no rows", async () => {
    renderWithWrapper(<GeneralSettingsTabMobileView {...buildViewModel()} />, { locale, viewport: "mobile" });

    await waitFor(() => {
      expect(screen.getByText(labels.empty)).toBeInTheDocument();
    });
  });

  test("renders setting card with label+value metadata instead of chips", async () => {
    renderWithWrapper(<GeneralSettingsTabMobileView {...buildViewModel({ rows: [sampleRow] })} />, {
      locale,
      viewport: "mobile",
    });

    await waitFor(() => {
      expect(screen.getByText(sampleRow.label)).toBeInTheDocument();
    });
    expect(
      screen.getByText(`${labels.dataTypeColumn}: ${labels.dataTypeLabels[sampleRow.dataType]}`)
    ).toBeInTheDocument();
    expect(screen.getByText(`${labels.categoryColumn}: ${labels.categories[sampleRow.category]}`)).toBeInTheDocument();
    expect(screen.getByText(sampleRow.description)).toBeInTheDocument();
  });
});
