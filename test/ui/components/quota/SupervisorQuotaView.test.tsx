import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { quotasQueryDocument } from "@/frontend/common/graphql/sharedDocuments/billing";
import { SupervisorQuotaView } from "@/frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView";
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
  kind: "PACKAGE",
  totalClasses: 20,
  remaining: 15,
  reservedClasses: 2,
  validFrom: "2025-06-01T00:00:00.000Z",
  validUntil: "2025-08-31T00:00:00.000Z",
  status: "ACTIVE",
  periodType: null,
  periodDays: null,
  priority: 10,
  createdAt: "2025-06-01T00:00:00.000Z",
  updatedAt: "2025-06-01T00:00:00.000Z",
  __typename: "Quota",
};

const quotasMock = {
  request: { query: quotasQueryDocument, variables: () => true },
  result: {
    data: {
      quotas: {
        rows: [mockQuotaRow],
        totalCount: 1,
        __typename: "QuotaPaginated",
      },
    },
  },
};

const emptyQuotasMock = {
  request: { query: quotasQueryDocument, variables: () => true },
  result: {
    data: {
      quotas: { rows: [], totalCount: 0, __typename: "QuotaPaginated" },
    },
  },
};

describe("SupervisorQuotaView", () => {
  afterEach(() => cleanup());

  test("renders supervisor title", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.supervisorTitle)).toBeVisible();
    });
  });

  test("renders quota data in grid when quotas exist", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText("Summer Package")).toBeVisible();
    });
  });

  test("renders no data available when quotas list is empty", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks: [emptyQuotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.noData)).toBeVisible();
    });
  });

  test("renders supervisorTitle as page heading", async () => {
    renderWithWrapper(<SupervisorQuotaView t={t} />, {
      locale,
      viewport: "desktop",
      mocks: [quotasMock],
    });

    await waitFor(() => {
      expect(screen.getByText(t.audience.supervisorTitle)).toBeVisible();
    });
  });
});
