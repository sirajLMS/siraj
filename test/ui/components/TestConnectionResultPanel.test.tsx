import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  MeetingConnectionTestMode,
  MeetingIntegrationProviderSlug,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TestConnectionResultPanel } from "@/frontend/common/views/dashboard/settings/components/meetingIntegrations/TestConnectionResultPanel";
import type { SettingsMeetingIntegrationsLabels } from "@/shared/locale/types/dashboard/settings/meeting-integrations";
import { TestWrapper } from "@/test/ui/components/TestWrapper";

afterEach(() => {
  cleanup();
});

const labels = {
  validateConfig: "التحقق من الإعداد",
  generateAndDelete: "إنشاء وحذف",
  testConnectionTesting: "جارٍ اختبار الاتصال…",
  testConnectionFailure: "فشل اختبار الاتصال.",
  retryTest: "إعادة الاختبار",
  testSuccess: "نجاح",
  notDeleted: "لم يُحذف",
  deleted: "تم حذف الاجتماع",
  joinUrl: "رابط الانضمام",
  latency: "زمن الاستجابة",
  errorCode: "رمز الخطأ",
  errorMessage: "رسالة الخطأ",
  testPanel: {
    rawResponse: "الاستجابة الخام",
    copyUrl: "نسخ الرابط",
    copied: "تم النسخ!",
    marketplaceHint: "تكوين في سوق المزود",
    endpointReached: "نقطة النهاية المتاحة",
    authStatus: "المصادقة",
    authSuccess: "تمت المصادقة",
    authFailure: "غير مصدّق",
    successMessage: "نجح اختبار الاتصال.",
    idleHint: "قم بتشغيل اختبار للتحقق من اتصال المزود.",
  },
} as unknown as SettingsMeetingIntegrationsLabels;

function renderPanel(props: Record<string, unknown>) {
  return render(
    <TestConnectionResultPanel
      labels={labels}
      providerSlug={MeetingIntegrationProviderSlug.Zoom}
      onRunTest={mock(() => Promise.resolve())}
      {...props}
    />,
    { wrapper: TestWrapper }
  );
}

describe("TestConnectionResultPanel", () => {
  test("renders idle state with test buttons", () => {
    renderPanel({ result: null, testing: false });
    expect(screen.getByText("قم بتشغيل اختبار للتحقق من اتصال المزود.")).toBeInTheDocument();
    expect(screen.getByText("التحقق من الإعداد")).toBeInTheDocument();
    expect(screen.getByText("إنشاء وحذف")).toBeInTheDocument();
  });

  test("renders testing state with progress indicator", () => {
    renderPanel({ result: null, testing: true });
    expect(screen.getByText("جارٍ اختبار الاتصال…")).toBeInTheDocument();
    // Test buttons should be disabled
    const validateButton = screen.getByText("التحقق من الإعداد");
    expect(validateButton.closest("button")).toBeDisabled();
  });

  test("renders success state with result details", () => {
    renderPanel({
      result: {
        ok: true,
        latencyMs: 150,
        mode: MeetingConnectionTestMode.ValidateConfig,
        testJoinUrl: "https://meet.example.com/test",
        deleted: false,
        upstreamResponseSummary: "200 OK",
        errorCode: null,
        errorMessage: null,
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      },
      testing: false,
    });
    expect(screen.getByText("نجح اختبار الاتصال.")).toBeInTheDocument();
    expect(screen.getByText(/150ms/)).toBeInTheDocument();
    expect(screen.getByText(/200 OK/)).toBeInTheDocument();
    expect(screen.getByText("تمت المصادقة")).toBeInTheDocument();
  });

  test("renders failure state with retry button", () => {
    const onRunTest = mock(() => Promise.resolve());
    renderPanel({
      result: {
        ok: false,
        latencyMs: 500,
        mode: MeetingConnectionTestMode.ValidateConfig,
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "401 Unauthorized",
        errorCode: "AUTH_FAILED",
        errorMessage: "Invalid credentials",
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      },
      testing: false,
      onRunTest,
    });
    expect(screen.getByText("فشل اختبار الاتصال.")).toBeInTheDocument();
    const retryButton = screen.getByText("إعادة الاختبار");
    fireEvent.click(retryButton);
    expect(onRunTest).toHaveBeenCalledTimes(1);
  });

  test("renders marketplace link for zoom provider", () => {
    renderPanel({
      result: {
        ok: true,
        latencyMs: 100,
        mode: MeetingConnectionTestMode.ValidateConfig,
        testJoinUrl: null,
        deleted: null,
        upstreamResponseSummary: "200 OK",
        errorCode: null,
        errorMessage: null,
        rawUpstreamPayload: null,
        requiredScopes: null,
        grantedScopes: null,
      },
      testing: false,
    });
    expect(screen.getByText("تكوين في سوق المزود")).toBeInTheDocument();
  });
});
