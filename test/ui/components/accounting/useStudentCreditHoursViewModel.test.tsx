import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import { cleanup, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { studentCreditHourBalanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/accounting";
import { studentCreditTransactionsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { useUserStore } from "@/frontend/common/stores/userStore";
import {
  type StudentCreditHoursViewModel,
  useStudentCreditHoursViewModel,
} from "@/frontend/common/views/dashboard/students/profile/useStudentCreditHoursViewModel";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { DashboardAccountingStudentCreditHours } from "@/shared/locale/namespaces";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const labels = readTranslation(DashboardAccountingStudentCreditHours, locale);

let captured: StudentCreditHoursViewModel | null = null;

function ViewModelCapture({ studentId }: Readonly<{ studentId: string }>) {
  const vm = useStudentCreditHoursViewModel({ studentId });
  useEffect(() => {
    captured = vm;
  }, [vm]);
  return null;
}

function createMocks(args: {
  creditHoursTotal: string;
  creditHoursRemaining: string;
  lowHoursThreshold?: number;
  transactions?: Array<Record<string, unknown>>;
}): MockLink.MockedResponse[] {
  return [
    {
      request: { query: studentCreditHourBalanceQueryDocument, variables: { studentId: "s-1" } },
      result: {
        data: {
          studentCreditHourBalance: {
            studentId: "s-1",
            creditHoursTotal: args.creditHoursTotal,
            creditHoursRemaining: args.creditHoursRemaining,
            lowHoursThreshold: args.lowHoursThreshold ?? null,
          },
        },
      },
    },
    {
      request: {
        query: studentCreditTransactionsQueryDocument,
        variables: {
          studentId: "s-1",
          paginationArgs: {
            after: null,
            before: null,
            first: 10,
            last: null,
            maxCount: null,
            page: null,
            skip: null,
          },
          hoursOnly: true,
        },
      },
      result: {
        data: {
          studentCreditTransactions: args.transactions ?? [],
        },
      },
    },
  ];
}

async function renderAndSettle(permissions: AppPermission[], mocks: MockLink.MockedResponse[]) {
  renderWithWrapper(<ViewModelCapture studentId="s-1" />, { locale, permissions, viewport: "desktop", mocks });
  await waitFor(() => {
    expect(captured?.initialLoading).toBe(false);
  });
}

afterEach(() => {
  cleanup();
  captured = null;
  useUserStore.setState({ permissions: [] }, false);
});

describe("useStudentCreditHoursViewModel", () => {
  test("derives consumed/remaining metrics and formats hour transactions", async () => {
    await renderAndSettle(
      [AppPermission.StudentsList],
      createMocks({
        creditHoursTotal: "20.00",
        creditHoursRemaining: "14.00",
        transactions: [
          {
            id: "ct-1",
            createdAt: "2026-07-05T12:00:00.000Z",
            changeAmountHours: "10.00",
            reason: "PURCHASE",
            notes: "gold pack",
            classInstanceId: null,
            sourcePaymentId: null,
            studentId: "s-1",
            changeAmount: null,
            creditedByUserId: null,
            idempotencyKey: "k1",
          },
        ],
      })
    );

    const vm = captured;
    expect(vm).not.toBeNull();
    expect(vm?.metrics.find(m => m.key === "total")?.count).toBe(labels.hoursUnit("20.00"));
    expect(vm?.metrics.find(m => m.key === "consumed")?.count).toBe(labels.hoursUnit("6.00"));
    expect(vm?.metrics.find(m => m.key === "remaining")?.count).toBe(labels.hoursUnit("14.00"));

    const row = vm?.transactions[0];
    expect(row?.changeLabel).toBe("+10.00 h");
    expect(row?.isPositive).toBe(true);
    expect(row?.reasonStatus).toBe("PURCHASE");
    expect(row?.reasonLabel).toBe(labels.reasons.PURCHASE);
    expect(row?.notes).toBe("gold pack");

    expect(vm?.hint).toBe(labels.perAudience.supervisorHint);
    expect(vm?.lowBalanceMessage).toBeNull();
    expect(vm?.transactionsPagination).toEqual({ mode: "client", pageSize: 10 });
  });

  test("flags low balance when remaining hours drop below the low-hours threshold", async () => {
    await renderAndSettle(
      [],
      createMocks({ creditHoursTotal: "20.00", creditHoursRemaining: "4.00", lowHoursThreshold: 5 })
    );

    expect(captured?.lowBalanceMessage).toBe(labels.lowBalanceAlert("4.00", "5.00"));
    // Remaining below the threshold → the remaining metric renders in the error tone.
    expect(captured?.metrics.find(m => m.key === "remaining")?.variant).toBe("error");
  });

  test("resolves the audience hint from permissions in priority order", async () => {
    await renderAndSettle(
      [AppPermission.TeacherViewStudents],
      createMocks({ creditHoursTotal: "1.00", creditHoursRemaining: "1.00" })
    );
    expect(captured?.hint).toBe(labels.perAudience.teacherHint);

    await renderAndSettle(
      [AppPermission.ParentViewStudents],
      createMocks({ creditHoursTotal: "1.00", creditHoursRemaining: "1.00" })
    );
    expect(captured?.hint).toBe(labels.perAudience.parentHint);

    await renderAndSettle([], createMocks({ creditHoursTotal: "1.00", creditHoursRemaining: "1.00" }));
    expect(captured?.hint).toBe(labels.perAudience.studentHint);
  });
});
