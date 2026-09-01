import { afterEach, describe, expect, mock, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/", { includeRouter: true, locale: "en" });

// Stub the lazy tab panels — this suite verifies switcher tier routing
// (createLazyView + ResponsiveViewSwitch), not tab panel content.
await mock.module("@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsTabPanels", () => ({
  PaymentCatalogsTabPanels: () => null,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { PaymentCatalogsPageChrome } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsPageChrome";
import { PaymentCatalogsView } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsView";
import type { PaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/types";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const parentLabels = readTranslation(Translation.Dashboard.PaymentCatalogsParent, locale);

const viewModel: PaymentCatalogsTabsViewModel = {
  labels: {
    title: parentLabels.pageTitle,
    subtitle: parentLabels.pageSubtitle,
    tabs: {
      paymentCatalogs: parentLabels.tabs.paymentCatalogs,
      meetingProviders: parentLabels.tabs.meetingProviders,
    },
    tabNavAriaLabel: parentLabels.tabNavAriaLabel,
  },
  activeTab: "paymentCatalogs",
  tabNavItems: [
    { id: "paymentCatalogs", label: parentLabels.tabs.paymentCatalogs, href: "/dashboard/payment-catalogs" },
    {
      id: "meetingProviders",
      label: parentLabels.tabs.meetingProviders,
      href: "/dashboard/payment-catalogs?tab=meetingProviders",
    },
  ],
};

afterEach(() => cleanup());

describe("PaymentCatalogsView switcher", () => {
  test("renders the desktop shell with page chrome and tab nav", async () => {
    renderWithWrapper(<PaymentCatalogsView {...viewModel} />, { locale, viewport: "desktop" });

    expect(await screen.findByText(parentLabels.pageTitle)).toBeVisible();
    expect((await screen.findAllByText(parentLabels.tabs.meetingProviders)).length).toBeGreaterThan(0);
  });

  test("renders the mobile shell with page chrome and tab nav", async () => {
    renderWithWrapper(<PaymentCatalogsView {...viewModel} />, { locale, viewport: "mobile" });

    expect(await screen.findByText(parentLabels.pageTitle)).toBeVisible();
    expect((await screen.findAllByText(parentLabels.tabs.meetingProviders)).length).toBeGreaterThan(0);
  });
});

describe("PaymentCatalogsPageChrome nested switch", () => {
  test("renders desktop chrome", async () => {
    renderWithWrapper(<PaymentCatalogsPageChrome {...viewModel} />, { locale, viewport: "desktop" });

    expect(await screen.findByText(parentLabels.pageTitle)).toBeVisible();
  });

  test("renders mobile chrome", async () => {
    renderWithWrapper(<PaymentCatalogsPageChrome {...viewModel} />, { locale, viewport: "mobile" });

    expect(await screen.findByText(parentLabels.pageTitle)).toBeVisible();
  });
});
