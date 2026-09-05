import { afterEach, describe, expect, mock, test } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// This suite lives next to the container it covers, so the happydom preloads
// wired into the shared component-test runner never load on this path. The DOM
// is registered first and every module that touches `document` at import time
// (testing-library above all) is imported dynamically afterwards, keeping the
// file runnable through the standard single-file test runner.
GlobalRegistrator.register();

const { cleanup } = await import("@testing-library/react");

let currentSearchParams = new URLSearchParams();

// The container only reads `useSearchParams`; the router surface is mocked
// shallowly so nothing else in the module graph can escape into Next.js.
await mock.module("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
  usePathname: () => "/classes/instance-1/audit",
  useParams: () => ({ id: "instance-1" }),
  useRouter: () => ({
    push: mock(() => {}),
    replace: mock(() => {}),
    back: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
}));

// The deep-link side effect is the unit under test, so the data-loading
// view-model and the rendered view are stubbed: the container mounts cleanly
// without an Apollo mock or any translation warm-up.
await mock.module("@/frontend/common/views/dashboard/classes/audit/useClassAuditViewModel", () => ({
  useClassAuditViewModel: () => ({
    status: "loading",
    audit: null,
    labels: {},
    isResending: false,
    onRetry: () => {},
  }),
}));

await mock.module("@/frontend/common/views/dashboard/classes/audit/ClassAuditView", () => ({
  ClassAuditView: () => null,
}));

const { AppPermission } = await import("@/frontend/common/graphql/generated/gql/graphql");
type AppPermissionValue = (typeof AppPermission)[keyof typeof AppPermission];
const { useClassAuditStore } = await import("@/frontend/common/stores/classAuditStore");
const { useUserStore } = await import("@/frontend/common/stores/userStore");
const { renderWithWrapper } = await import("@/test/ui/components/TestWrapper");
const { ClassAuditContainer } = await import("@/frontend/common/views/dashboard/classes/audit/ClassAuditContainer");

const AUDIT_PATH = "/classes/instance-1/audit";

function renderContainer(params: string, permissions: readonly AppPermissionValue[]) {
  currentSearchParams = new URLSearchParams(params);
  window.history.replaceState({}, "", params === "" ? AUDIT_PATH : `${AUDIT_PATH}?${params}`);
  renderWithWrapper(<ClassAuditContainer />, { locale: "en", permissions: [...permissions] });
}

afterEach(() => {
  cleanup();
  useClassAuditStore.getState().reset();
  useUserStore.setState({ permissions: [] }, false);
  currentSearchParams = new URLSearchParams();
  window.history.replaceState({}, "", AUDIT_PATH);
});

describe("ClassAuditContainer (openOverride deep link)", () => {
  test("opens the override dialog for a payroll manager when openOverride is present", () => {
    renderContainer("openOverride=1", [AppPermission.AccountingPayrollManage]);

    expect(useClassAuditStore.getState().overrideDialogOpen).toBe(true);
  });

  test("removes the consumed openOverride parameter from the URL without navigating", () => {
    renderContainer("openOverride=1&other=kept", [AppPermission.AccountingPayrollManage]);

    expect(window.location.search).toBe("?other=kept");
  });

  test("keeps the override dialog closed when the parameter is absent", () => {
    renderContainer("", [AppPermission.AccountingPayrollManage]);

    expect(useClassAuditStore.getState().overrideDialogOpen).toBe(false);
  });

  test("keeps the override dialog closed without the payroll-manage permission", () => {
    renderContainer("openOverride=1", []);

    expect(useClassAuditStore.getState().overrideDialogOpen).toBe(false);
    expect(window.location.search).toBe("");
  });
});
