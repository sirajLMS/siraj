import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

// Mock logger to avoid console output
await mock.module("@/frontend/common/utils/logger", () => ({
  logger: { info: () => {}, warn: () => {}, debug: () => {}, error: () => {} },
}));

// Mock navigator.clipboard
if (!("clipboard" in navigator)) {
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText: mock(() => Promise.resolve()), readText: mock(() => Promise.resolve("")) },
    writable: true,
  });
}

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { ClassMeetingConfigFieldsFragment } from "@/frontend/common/graphql/generated/gql/operations";
import {
  classMeetingConfigsQueryDocument,
  classMeetingConfigsWithStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents";
import { ClassMeetingConfigsSection } from "@/frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

function makeProvider(slug = "zoom") {
  return {
    id: `prov-${slug}`,
    slug,
    name: { ar: slug, en: slug },
    description: null,
    instructions: null,
    urlAllowlist: [] as string[],
    urlExample: null,
    logoUrl: null,
    fieldSchema: {
      requiresMeetingUrl: false,
      supportsAutoGeneration: true,
      supportsUsername: false,
      supportsPassword: false,
      supportsTenantId: false,
    },
    providerKind: "oauth",
    isActive: true,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
  };
}

function makeConfig(overrides: Partial<ClassMeetingConfigFieldsFragment> = {}): ClassMeetingConfigFieldsFragment {
  return {
    id: "config-1",
    classInstanceId: "class-1",
    recurringScheduleId: null,
    providerId: "prov-zoom",
    label: "TestClassConfig",
    isDefault: false,
    hasSecret: false,
    details: { meetingUrl: "https://zoom.us/j/123456789", username: null, tenantId: null },
    providerMetadata: {},
    provider: makeProvider("zoom"),
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeStatusEntry(id: string, overrides: Record<string, unknown> = {}) {
  const config = makeConfig({ id });
  return {
    __typename: "ClassMeetingConfig",
    id,
    classInstanceId: config.classInstanceId,
    recurringScheduleId: config.recurringScheduleId,
    providerId: config.providerId,
    label: config.label,
    isDefault: config.isDefault,
    hasSecret: config.hasSecret,
    details: config.details,
    providerMetadata: config.providerMetadata,
    meetingUrlStatus: "generated",
    meetingUrlExpiresAt: "2025-12-31T23:59:59Z",
    meetingUrlError: null,
    provider: config.provider,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
    ...overrides,
  };
}

const CLASS_INSTANCE_ID = "class-123";

/**
 * Builds the three GraphQL mocks the component queries:
 * 1. classMeetingConfigs – the config list with fragment fields
 * 2. classMeetingConfigsWithStatus – the status map (meetingUrlStatus, meetingUrlExpiresAt)
 * 3. recurringMeetingConfigs – skipped for class instance scope
 */
function makeClassMocks(
  opts: { configs?: ClassMeetingConfigFieldsFragment[]; statusEntries?: Record<string, unknown>[]; error?: Error } = {}
) {
  const configs = opts.configs ?? [];
  const statusEntries = opts.statusEntries ?? configs.map(c => makeStatusEntry(c.id ?? "config-1"));

  if (opts.error) {
    return [
      {
        request: { query: classMeetingConfigsQueryDocument, variables: { classInstanceId: CLASS_INSTANCE_ID } },
        error: opts.error,
      },
      {
        request: {
          query: classMeetingConfigsWithStatusQueryDocument,
          variables: { classInstanceId: CLASS_INSTANCE_ID },
        },
        result: { data: { classMeetingConfigs: [] } },
      },
    ];
  }

  return [
    {
      request: { query: classMeetingConfigsQueryDocument, variables: { classInstanceId: CLASS_INSTANCE_ID } },
      result: { data: { classMeetingConfigs: configs } },
    },
    {
      request: { query: classMeetingConfigsWithStatusQueryDocument, variables: { classInstanceId: CLASS_INSTANCE_ID } },
      result: { data: { classMeetingConfigs: statusEntries } },
    },
  ];
}

describe("ClassMeetingConfigsSection", () => {
  test("returns null when no scopeId (no classInstanceId or recurringScheduleId)", () => {
    const { container } = renderWithWrapper(<ClassMeetingConfigsSection />, { mocks: [] });
    expect(container.innerHTML).toBe("");
  });

  test("shows error section when query errors and no configs loaded", async () => {
    const mocks = makeClassMocks({ error: new Error("Network error") });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    // ErrorState shows loadError message with a retry button
    await waitFor(() => {
      expect(screen.getByText("فشل تحميل إعدادات الاجتماع")).toBeInTheDocument();
    });
    expect(screen.getByText("إعادة المحاولة")).toBeInTheDocument();
  });

  test("shows config list with section title and add button when canManage", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const mocks = makeClassMocks({ configs, statusEntries: [makeStatusEntry("c1")] });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    await waitFor(() => {
      // Section title from classScope labels
      expect(screen.getByText("إعدادات اجتماع الحصة")).toBeInTheDocument();
      // Config label
      expect(screen.getByText("إعداد 1")).toBeInTheDocument();
      // Add button from manager labels
      expect(screen.getByText("إضافة إعداد")).toBeInTheDocument();
    });
  });

  test("shows empty state message when no configs and canManage", async () => {
    const mocks = makeClassMocks({ configs: [] });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    await waitFor(() => {
      // noConfigs label from classScope
      expect(screen.getByText("لا توجد إعدادات اجتماع لهذا النطاق")).toBeInTheDocument();
    });
  });

  test("does not show add button when canManage=false", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const mocks = makeClassMocks({ configs, statusEntries: [makeStatusEntry("c1")] });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage={false} />, {
      mocks,
    });

    await waitFor(() => {
      expect(screen.getByText("إعداد 1")).toBeInTheDocument();
    });
    // Add button should not be present
    expect(screen.queryByText("إضافة إعداد")).not.toBeInTheDocument();
  });

  test("shows generation status badge (generated/success) for configs with generated URL", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const statusEntries = [
      makeStatusEntry("c1", { meetingUrlStatus: "generated", meetingUrlExpiresAt: "2025-12-31T23:59:59Z" }),
    ];
    const mocks = makeClassMocks({ configs, statusEntries });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    // generationSuccess label from enhancements
    await waitFor(() => {
      expect(screen.getByText("تم توليد رابط الاجتماع بنجاح.")).toBeInTheDocument();
    });
  });

  test("shows copy button for configs with a meeting URL", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const mocks = makeClassMocks({
      configs,
      statusEntries: [
        makeStatusEntry("c1", { details: { meetingUrl: "https://zoom.us/j/123", username: null, tenantId: null } }),
      ],
    });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    // copyMeetingUrl label from enhancements
    await waitFor(() => {
      expect(screen.getByLabelText("نسخ رابط الاجتماع")).toBeInTheDocument();
    });
  });

  test("shows retry button when generation status is failed", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const statusEntries = [
      makeStatusEntry("c1", { meetingUrlStatus: "failed", meetingUrlError: "Failed to generate" }),
    ];
    const mocks = makeClassMocks({ configs, statusEntries });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    // retryGeneration aria-label from enhancements
    await waitFor(() => {
      // generationFailed label shown as chip text, retryGeneration as aria-label
      expect(screen.getByText("تعذّر توليد رابط الاجتماع.")).toBeInTheDocument();
      expect(screen.getByLabelText("إعادة التوليد")).toBeInTheDocument();
    });
  });

  test("retry button triggers retry mutation flow", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    const statusEntries = [makeStatusEntry("c1", { meetingUrlStatus: "failed" })];
    const mocks = makeClassMocks({ configs, statusEntries });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    await waitFor(() => {
      expect(screen.getByLabelText("إعادة التوليد")).toBeInTheDocument();
    });
    // Clicking retry should not throw
    fireEvent.click(screen.getByLabelText("إعادة التوليد"));
    // No assertion on mutation result — just verify click doesn't crash
  });

  test("shows expiry text for configs with near-future expiry", async () => {
    const configs = [makeConfig({ id: "c1", label: "إعداد 1" })];
    // Set expiry to 5 hours from now — should show "expires in N hours" label
    const futureExpiry = new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString();
    const statusEntries = [makeStatusEntry("c1", { meetingUrlStatus: "generated", meetingUrlExpiresAt: futureExpiry })];
    const mocks = makeClassMocks({ configs, statusEntries });
    renderWithWrapper(<ClassMeetingConfigsSection classInstanceId={CLASS_INSTANCE_ID} canManage />, {
      permissions: [AppPermission.MeetingConfigsManageClass],
      mocks,
    });

    // expiresInHours(5) from enhancements → "ينتهي خلال 5 ساعات"
    await waitFor(() => {
      const expiryText = screen.getByText(/ينتهي خلال 5/);
      expect(expiryText).toBeInTheDocument();
    });
  });
});
