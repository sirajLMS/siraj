import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/packages", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { packagePlansQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { PackagePlansContainer } from "@/frontend/common/views/dashboard/accounting/PackagePlansContainer";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingPackagePlans } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingPackagePlans, locale);

afterEach(() => {
  cleanup();
  mockPush.mock.calls.length = 0;
});

const plansData = [
  {
    id: "plan-1",
    codename: "plan_gold_4hrs",
    displayName: "Gold 4 Hours",
    description: null,
    creditHours: "4.00",
    priceAmount: "1200.00",
    currency: "USD",
    active: true,
    sortOrder: 1,
    version: 3,
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-02T08:00:00.000Z",
  },
  {
    id: "plan-2",
    codename: "plan_silver_legacy",
    displayName: "Silver Legacy",
    description: null,
    creditHours: "2.00",
    priceAmount: "500.00",
    currency: "EGP",
    active: false,
    sortOrder: 2,
    version: 8,
    createdAt: "2026-06-01T08:00:00.000Z",
    updatedAt: "2026-07-05T08:00:00.000Z",
  },
];

describe("package plans catalog (component)", () => {
  test("renders catalog rows with translated headers and archived chip", async () => {
    renderWithWrapper(<PackagePlansContainer />, {
      locale,
      permissions: [],
      mocks: [
        {
          request: {
            query: packagePlansQueryDocument,
            variables: { activeOnly: null, paginationArgs: null },
          },
          result: { data: { packagePlans: plansData } },
        },
      ],
    });

    // Header labels come from the i18n namespace.
    expect(await screen.findByText(labels.columns.codename)).toBeVisible();
    expect(screen.getByText(labels.columns.creditHours)).toBeVisible();
    expect(screen.getByText(labels.columns.price)).toBeVisible();

    // Catalog rows render with the plan display names (plan names also feed
    // the headline metric card, so allow multiple matches).
    expect((await screen.findAllByText("Gold 4 Hours")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Silver Legacy").length).toBeGreaterThan(0);

    // The inactive plan is flagged with the localized archive chip.
    expect(screen.getAllByText(labels.archived).length).toBeGreaterThan(0);

    // Hours formatter keeps the unit suffix (t.hoursUnit).
    expect(screen.getByText("4.00 hrs")).toBeVisible();
  });

  test("shows the translated empty state before any plan exists", async () => {
    renderWithWrapper(<PackagePlansContainer />, {
      locale,
      // The create CTA is permission-gated (ACCOUNTING_PAYMENTS_MANAGE).
      permissions: [AppPermission.AccountingPaymentsManage],
      mocks: [
        {
          request: {
            query: packagePlansQueryDocument,
            variables: { activeOnly: null, paginationArgs: null },
          },
          result: { data: { packagePlans: [] } },
        },
      ],
    });

    expect(await screen.findByText(labels.empty)).toBeVisible();
    // The create CTA stays reachable for the first plan.
    expect(screen.getByText(labels.createPlan)).toBeVisible();
  });
});
