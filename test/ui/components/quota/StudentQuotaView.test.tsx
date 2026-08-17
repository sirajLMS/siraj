import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { StudentQuotaAudienceView } from "@/frontend/common/views/dashboard/students/quota/audience/StudentQuotaView";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Dashboard.StudentQuota, locale);

const mockQuotaRow = {
  id: "quota-1",
  studentId: "student-1",
  name: "Summer Package",
  kind: QuotaKind.Package,
  totalClasses: 20,
  remaining: 15,
  reservedClasses: 2,
  validFrom: "2025-06-01T00:00:00.000Z",
  validUntil: "2025-08-31T00:00:00.000Z",
  status: QuotaStatus.Active,
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Quota",
};

const meQueryMock = {
  request: { query: meQueryDocument },
  result: {
    data: {
      me: {
        id: "student-1",
        name: "Test Student",
        email: "test@example.com",
        emailVerifiedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        avatarUrl: null,
        phone: null,
        status: "ACTIVE",
        permissions: [],
        role: "STUDENT",
        notificationCount: 0,
        teacherId: null,
        parentId: null,
        displayCurrency: null,
        __typename: "User",
      },
    },
  },
};

const studentQuotasMock = {
  request: { query: studentQuotasQueryDocument, variables: () => true },
  result: { data: { studentQuotas: [mockQuotaRow] } },
};

const emptyStudentQuotasMock = {
  request: { query: studentQuotasQueryDocument, variables: () => true },
  result: { data: { studentQuotas: [] } },
};

const ledgerMock = {
  request: { query: quotaLedgerQueryDocument, variables: () => true },
  result: {
    data: {
      quotaLedger: {
        rows: [
          {
            id: "ledger-1",
            quotaId: "quota-1",
            studentId: "student-1",
            recurringScheduleId: null,
            classInstanceId: null,
            delta: 20,
            reason: "GRANT",
            reasonNote: null,
            actorUserId: "admin-1",
            createdAt: "2025-06-01T10:00:00.000Z",
            __typename: "QuotaLedger",
          },
        ],
        totalCount: 1,
        __typename: "QuotaLedgerPaginated",
      },
    },
  },
};

const emptyLedgerMock = {
  request: { query: quotaLedgerQueryDocument, variables: () => true },
  result: {
    data: {
      quotaLedger: { rows: [], totalCount: 0, __typename: "QuotaLedgerPaginated" },
    },
  },
};

type MockEntry = typeof meQueryMock | typeof studentQuotasMock | typeof ledgerMock;

async function renderAndAssertVisible(mocks: MockEntry[], expectedText: string): Promise<void> {
  renderWithWrapper(<StudentQuotaAudienceView t={t} />, {
    locale,
    viewport: "desktop",
    mocks: [meQueryMock, ...mocks],
  });
  await waitFor(() => {
    expect(screen.getByText(expectedText)).toBeVisible();
  });
}

describe("StudentQuotaView", () => {
  afterEach(() => cleanup());

  test("renders quota balance cards for student's quotas", async () => {
    await renderAndAssertVisible([studentQuotasMock, ledgerMock], "Summer Package");
  });

  test("renders ledger entries section", async () => {
    await renderAndAssertVisible([studentQuotasMock, ledgerMock], t.audience.recentLedgerEntries);
  });

  test("renders empty state when no quotas assigned", async () => {
    await renderAndAssertVisible([emptyStudentQuotasMock, emptyLedgerMock], t.audience.noQuotaAssigned);
  });

  test("renders no ledger entries message when ledger is empty", async () => {
    await renderAndAssertVisible([studentQuotasMock, emptyLedgerMock], t.audience.noLedgerEntries);
  });

  test("renders studentTitle as page heading", async () => {
    await renderAndAssertVisible([studentQuotasMock, ledgerMock], t.audience.studentTitle);
  });
});
