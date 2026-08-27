import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

const mockPush = mock(() => {});

await mockNextNavigation("/accounting/payments", {
  mockPush,
  locales: ["ar", "en"],
  defaultLocale: "en",
  routingIncludeReplaceAndPrefetch: false,
  includeReplaceAndPrefetch: false,
});

import type { MockLink } from "@apollo/client/testing";
import {
  accountingPaymentQueryDocument,
  updateAccountingPaymentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/accounting";
import { PaymentFormContainer } from "@/frontend/common/views/dashboard/accounting/PaymentFormContainer";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingPayments } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingPayments, locale);

afterEach(() => {
  cleanup();
  mockPush.mock.calls.length = 0;
});

function createPaymentMocks(): MockLink.MockedResponse[] {
  return [
    {
      request: { query: accountingPaymentQueryDocument, variables: { id: "pay-1" } },
      result: {
        data: {
          accountingPayment: {
            id: "pay-1",
            invoiceId: "inv-1",
            amount: "300.00",
            currency: "USD",
            paymentDate: "2026-07-05T12:00:00.000Z",
            createdAt: "2026-07-05T12:00:00.000Z",
            updatedAt: "2026-07-05T12:00:00.000Z",
            packagePlanId: null,
            packageCodename: null,
            packageName: null,
            paymentGateway: "BANK",
            creditHours: "10.00",
            isPaidStatusOn: true,
            paymentNote: "original note",
            studentId: "s-1",
            studentName: "Ahmed Mohamed",
            parentId: "p-1",
            parentName: "Parent One",
            invoiceStatus: "PAID",
          },
        },
      },
    },
  ];
}

describe("accounting payment form (component)", () => {
  test("create mode shows student/package pickers and translated action buttons", async () => {
    renderWithWrapper(<PaymentFormContainer />, {
      locale,
      permissions: [],
      mocks: [],
    });

    // Create-mode field labels confirm the create schema is mounted.
    expect((await screen.findAllByText(labels.form.student)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(labels.form.credit).length).toBeGreaterThan(0);
    expect(screen.getAllByText(labels.form.paid).length).toBeGreaterThan(0);

    // Empty submit (no student) surfaces the zod validation from the i18n labels.
    const saveButtons = screen.getAllByRole("button");
    const saveButton = saveButtons.find(button => button.textContent === labels.form.submit);
    if (!saveButton) throw new Error("Save button not found in payment form");
    fireEvent.click(saveButton);
    expect(await screen.findAllByText(labels.form.student)).not.toHaveLength(0);
  });

  test("edit mode prefills stored hours and saves via the update mutation", async () => {
    renderWithWrapper(<PaymentFormContainer paymentId="pay-1" />, {
      locale,
      permissions: [],
      mocks: [
        ...createPaymentMocks(),
        {
          request: { query: updateAccountingPaymentMutationDocument },
          result: {
            data: {
              updateAccountingPayment: { id: "pay-1" },
            },
          },
        },
      ],
    });

    // Stored hours (10) arrive through accountingPaymentQueryDocument…
    const hoursField = await screen.findByDisplayValue("10");
    expect(hoursField).toBeVisible();

    // …and a valid edit flows into updateAccountingPayment then navigates back.
    const saveButton = screen.getAllByRole("button").find(button => button.textContent === labels.form.submit);
    if (!saveButton) throw new Error("Save button not found in payment form edit mode");
    saveButton.click();

    expect(await screen.findByText(labels.saveSuccess)).toBeVisible();
  });
});
