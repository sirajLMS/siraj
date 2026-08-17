import { afterEach, describe, expect, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { QuotaKind, QuotaStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth";
import {
  quotaLedgerQueryDocument,
  studentQuotasQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/billing";
import { parentAssociatedStudentsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/parents";
import { ParentQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/ParentQuotaView";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "en";
const t = readTranslation(Translation.Dashboard.StudentQuota, locale);

const mockChild = {
  id: "student-1",
  name: "Child One",
  avatarUrl: null,
  status: "ACTIVE",
  primaryTeacherId: "teacher-1",
  teacherUserId: null,
  teacherName: "Teacher A",
  hoursPerWeek: 4,
  classesRemaining: 10,
  classesTotal: 20,
  language: "ENGLISH",
  gender: "MALE",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Student",
};

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
        id: "parent-1",
        name: "Test Parent",
        email: "parent@example.com",
        emailVerifiedAt: null,
        createdAt: "2025-01-01T00:00:00.000Z",
        updatedAt: "2025-01-01T00:00:00.000Z",
        avatarUrl: null,
        phone: null,
        status: "ACTIVE",
        permissions: [],
        role: "PARENT",
        notificationCount: 0,
        teacherId: null,
        parentId: "parent-1",
        displayCurrency: null,
        __typename: "User",
      },
    },
  },
};

function childrenMock(children: (typeof mockChild)[], loading = false) {
  return {
    request: { query: parentAssociatedStudentsQueryDocument, variables: () => true },
    result: { data: { parentAssociatedStudents: children } },
    delay: loading ? 500 : 0,
  };
}

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
      quotaLedger: { rows: [], totalCount: 0, __typename: "QuotaLedgerPaginated" },
    },
  },
};

describe("ParentQuotaView", () => {
  afterEach(() => cleanup());

  test("renders child tabs for parent's children", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(
      () => {
        expect(screen.getAllByText("Child One").length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  const renderParentView = (mocks: MockLink.MockedResponse[]) => {
    renderWithWrapper(<ParentQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks,
    });
  };

  test("renders quota balance card for selected child", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders no children state when parent has no children", async () => {
    renderParentView([meQueryMock, childrenMock([])]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noChildren)).toBeVisible();
    });
  });

  test("renders loading skeleton while children are loading", async () => {
    renderParentView([meQueryMock, childrenMock([], true)]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.loadingData)).toBeVisible();
    });
  });

  test("renders no quota assigned when child has no quotas", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), emptyStudentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.noQuotaAssigned)).toBeVisible();
    });
  });

  test("renders parentTitle as page heading", async () => {
    renderParentView([meQueryMock, childrenMock([mockChild]), studentQuotasMock, ledgerMock]);

    await waitFor(() => {
      expect(screen.getByText(t.audience.parentTitle)).toBeVisible();
    });
  });
});
