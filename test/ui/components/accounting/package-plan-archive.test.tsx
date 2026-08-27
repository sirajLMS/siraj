import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/packages/plan-1", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import type { MockLink } from "@apollo/client/testing";
import { CurrencyCode } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  packagePlanQueryDocument,
  packagePlansQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { PackagePlanFormMobile } from "@/frontend/mobile/views/dashboard/accounting/PackagePlanFormView.mobile";
import {
  usePackagePlanFormViewModel,
} from "@/frontend/common/views/dashboard/accounting/usePackagePlanFormViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingPackagePlans } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingPackagePlans, locale);

const planId = "plan-1";

function PackagePlanFormMobileImpl() {
  const viewModel = usePackagePlanFormViewModel({ planId });
  return <PackagePlanFormMobile {...viewModel} />;
}

const planData = {
  id: planId,
  codename: "plan_gold_4hrs",
  displayName: "Gold 4 Hours",
  description: null,
  creditHours: "4.00",
  priceAmount: "1200.00",
  currency: CurrencyCode.Usd,
  active: true,
  sortOrder: 1,
  validityMonths: null,
  version: 3,
  createdAt: "2026-07-01T08:00:00.000Z",
  updatedAt: "2026-07-02T08:00:00.000Z",
};

function formMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: {
        query: packagePlanQueryDocument,
        variables: { id: planId },
      },
      result: { data: { packagePlan: planData } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: packagePlansQueryDocument,
        variables: { activeOnly: null, paginationArgs: null },
      },
      result: { data: { packagePlans: [planData] } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
  ];
}

afterEach(() => {
  cleanup();
});

describe("package plan archive dialog trigger (mobile variant)", () => {
  test("opens the archive dialog from an action-verb trigger", async () => {
    renderWithWrapper(<PackagePlanFormMobileImpl />, {
      locale,
      permissions: [],
      mocks: formMocks(),
      viewport: "mobile",
    });

    // Edit mode loads the existing plan before the form actions appear.
    expect(await screen.findByText(labels.editTitle)).toBeVisible();

    // The dialog trigger reads the action verb — never the past-state label.
    const trigger = screen.getByRole("button", { name: labels.archiveConfirm });
    expect(trigger).toBeVisible();
    expect(screen.queryByText(labels.archived)).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByText(labels.archiveTitle)).toBeVisible();
    expect(screen.getByText(labels.archiveBody(planData.displayName))).toBeVisible();
    // Trigger and in-dialog confirmation share the action verb.
    expect(screen.getAllByText(labels.archiveConfirm).length).toBeGreaterThanOrEqual(2);
  });
});
