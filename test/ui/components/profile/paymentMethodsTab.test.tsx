import { afterEach, describe, expect, test } from "bun:test";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

await mockNextNavigation("/profile", { locale: "en" });

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

import { PaymentDirection, PaymentMethodType } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  supportedMobileWalletsQueryDocument,
  supportedOnlineAccountsQueryDocument,
  supportedPaymentLinksQueryDocument,
  userPaymentMethodsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing/payment-method.documents";
import { PaymentMethodsTabDesktopView } from "@/frontend/desktop/views/dashboard/profile/shared/payment-methods/paymentMethodsTab.desktop";
import { PaymentMethodsTabMobileView } from "@/frontend/mobile/views/dashboard/profile/shared/payment-methods/paymentMethodsTab.mobile";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

expect.extend(matchers);

const locale: AppLocale = "en";

const paymentMethodLabels = readTranslation(Translation.Ui.PaymentMethod, locale);
const profileLabels = readTranslation(Translation.Profile.Base, locale);
const pageTitle = profileLabels.shell.tabs.paymentMethods;

afterEach(() => {
  cleanup();
});

const TARGET_USER_ID = "user-payment-methods-test";

function paymentMethodRow(overrides: Record<string, unknown>) {
  return {
    __typename: "UserPaymentMethod",
    userId: TARGET_USER_ID,
    isDefault: false,
    label: null,
    details: null,
    verifiedAt: null,
    verifiedByUserId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const BANK_TRANSFER_LABEL = "Primary bank transfer";
const WALLET_LABEL = "Primary wallet";

const payinMethods = [
  paymentMethodRow({
    id: "pm-bank",
    type: PaymentMethodType.BankTransfer,
    direction: PaymentDirection.Payin,
    label: BANK_TRANSFER_LABEL,
  }),
  paymentMethodRow({
    id: "pm-wallet",
    type: PaymentMethodType.MobileWallet,
    direction: PaymentDirection.Payin,
    isDefault: true,
    label: WALLET_LABEL,
  }),
];

function buildMocks() {
  return [
    {
      request: {
        query: userPaymentMethodsQueryDocument,
        variables: { userId: TARGET_USER_ID, direction: null },
      },
      result: { data: { userPaymentMethods: payinMethods } },
    },
    {
      request: {
        query: supportedMobileWalletsQueryDocument,
        variables: { activeOnly: true, countryCode: null, direction: PaymentDirection.Payin },
      },
      result: { data: { supportedMobileWallets: [] } },
    },
    {
      request: {
        query: supportedPaymentLinksQueryDocument,
        variables: { activeOnly: true, direction: PaymentDirection.Payin },
      },
      result: { data: { supportedPaymentLinks: [] } },
    },
    {
      request: {
        query: supportedOnlineAccountsQueryDocument,
        variables: { activeOnly: true, direction: PaymentDirection.Payin },
      },
      result: { data: { supportedOnlineAccounts: [] } },
    },
  ];
}

function renderDesktop(canManage: boolean) {
  return renderWithWrapper(
    <PaymentMethodsTabDesktopView targetUserId={TARGET_USER_ID} slot="payin" canManage={canManage} title={pageTitle} />,
    { locale, mocks: buildMocks(), viewport: "desktop" }
  );
}

function renderMobile(canManage: boolean) {
  return renderWithWrapper(
    <PaymentMethodsTabMobileView targetUserId={TARGET_USER_ID} slot="payin" canManage={canManage} title={pageTitle} />,
    { locale, mocks: buildMocks(), viewport: "mobile" }
  );
}

describe("PaymentMethodsTab tier wiring", () => {
  test("desktop tier renders the AppDataGrid-backed list with client pagination wiring", async () => {
    const { container } = renderDesktop(true);

    const grid = await screen.findByRole("grid");
    // Wait for the mocked query rows to paint before inspecting pagination markup.
    await screen.findByText(BANK_TRANSFER_LABEL);
    expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();
    expect(container.querySelector(".MuiDataGrid-footerContainer")).not.toBeNull();
    // Client-mode pagination: grid row count derives from the loaded rows, not a server rowCount.
    expect(grid.getAttribute("aria-rowcount")).toBe(String(payinMethods.length + 1));

    expect(screen.getByText(BANK_TRANSFER_LABEL)).toBeInTheDocument();
    expect(screen.getByText(WALLET_LABEL)).toBeInTheDocument();

    // canManage=true: edit/delete actions on every row, set-default only on non-default rows.
    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.edit })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.delete })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.setDefault })).toHaveLength(1);
    expect(screen.getByRole("button", { name: paymentMethodLabels.manager.add })).toBeInTheDocument();
  });

  test("desktop tier hides manage actions when canManage is false", async () => {
    const { container } = renderDesktop(false);

    await screen.findByRole("grid");
    expect(container.querySelector(".MuiDataGrid-root")).not.toBeNull();

    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.edit })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.delete })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.setDefault })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.manager.add })).toBeNull();
  });

  test("mobile tier renders the card list with no DataGrid markup", async () => {
    const { container } = renderMobile(true);

    await screen.findAllByText(BANK_TRANSFER_LABEL);

    expect(container.querySelector(".MuiDataGrid-root")).toBeNull();
    expect(screen.queryByRole("grid")).toBeNull();
    expect(screen.getAllByText(WALLET_LABEL).length).toBeGreaterThan(0);

    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.edit })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.delete })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: paymentMethodLabels.list.setDefault })).toHaveLength(1);
    expect(screen.getByRole("button", { name: paymentMethodLabels.manager.add })).toBeInTheDocument();
  });

  test("mobile tier hides manage actions when canManage is false", async () => {
    const { container } = renderMobile(false);

    await screen.findAllByText(BANK_TRANSFER_LABEL);

    expect(container.querySelector(".MuiDataGrid-root")).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.edit })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.delete })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.list.setDefault })).toBeNull();
    expect(screen.queryByRole("button", { name: paymentMethodLabels.manager.add })).toBeNull();
  });
});
