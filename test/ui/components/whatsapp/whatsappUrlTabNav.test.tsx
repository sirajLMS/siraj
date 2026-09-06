import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { firstCallArgString } from "@/test/ui/components/helpers/whatsappTestHelpers";

expect.extend(matchers);

// ─── Mock setup: next/navigation ──────────────────────────────────────
// We mock `next/navigation` to provide `useSearchParams` returning a
// mutable URLSearchParams that we can update per-test. `useRouter` returns
// a router with a `replace` mock that we can assert on.

let currentSearchParams = new URLSearchParams();
const replace = mock(() => {});
const push = mock(() => {});

await mock.module("next/navigation", () => ({
  useSearchParams: () => currentSearchParams,
  useRouter: () => ({
    replace,
    push,
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/settings/whatsapp",
  useParams: () => ({ locale }),
  redirect: mock(() => {}),
}));

await mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({
    replace,
    push,
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/settings/whatsapp",
  Link: ({
    children,
    href,
    ...rest
  }: {
    readonly children: React.ReactNode;
    readonly href: string;
    readonly [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

await mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    replace,
    push,
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/settings/whatsapp",
}));

// ─── Mock GenericTabNav to avoid next/dynamic lazy loading issues ───
await mock.module("@/frontend/common/views/dashboard/components/GenericTabNav", () => ({
  GenericTabNav: ({
    tabs,
    activeTab,
  }: {
    readonly tabs: ReadonlyArray<{ readonly id: string; readonly label: string; readonly href: string }>;
    readonly activeTab: string;
  }) => (
    <nav>
      {tabs.map(tab => (
        <a key={tab.id} href={tab.href} data-active={tab.id === activeTab}>
          {tab.label}
        </a>
      ))}
    </nav>
  ),
}));

import { WhatsappTabNav } from "@/frontend/common/views/dashboard/settings/whatsapp/WhatsappTabNav";
// ─── Imports (after mocks are registered) ──────────────────────────────
import { useWhatsappTab } from "@/frontend/common/views/dashboard/settings/whatsapp/whatsappTabUrl";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

// ─── Consumer pattern for testing the hook ────────────────────────────

function WhatsappTabConsumer({ onTabChange }: { readonly onTabChange?: (tab: string) => void }) {
  const [activeTab, setActiveTab] = useWhatsappTab();
  useEffect(() => {
    onTabChange?.(activeTab);
  }, [activeTab, onTabChange]);
  return (
    <div>
      <span data-testid="active-tab">{activeTab}</span>
      <button type="button" data-testid="set-tab-templates" onClick={() => setActiveTab("templates")}>
        set templates
      </button>
      <button type="button" data-testid="set-tab-optin" onClick={() => setActiveTab("optin")}>
        set optin
      </button>
    </div>
  );
}

describe("useWhatsappTab — URL deep-linking", () => {
  beforeEach(() => {
    cleanup();
    replace.mockClear();
    push.mockClear();
    currentSearchParams = new URLSearchParams();
  });

  afterEach(() => {
    cleanup();
  });

  test("falls back to default tab 'numbers' when no tab param in URL", () => {
    render(<WhatsappTabConsumer />);
    expect(screen.getByTestId("active-tab").textContent).toBe("numbers");
  });

  test("uses 'templates' when URL has ?tab=templates", () => {
    currentSearchParams = new URLSearchParams("tab=templates");
    render(<WhatsappTabConsumer />);
    expect(screen.getByTestId("active-tab").textContent).toBe("templates");
  });

  test("uses 'optin' when URL has ?tab=optin", () => {
    currentSearchParams = new URLSearchParams("tab=optin");
    render(<WhatsappTabConsumer />);
    expect(screen.getByTestId("active-tab").textContent).toBe("optin");
  });

  test("falls back to 'numbers' for invalid tab name", () => {
    currentSearchParams = new URLSearchParams("tab=invalid_tab_xxx");
    render(<WhatsappTabConsumer />);
    expect(screen.getByTestId("active-tab").textContent).toBe("numbers");
  });

  test("setActiveTab calls router.replace with correct URL", async () => {
    render(<WhatsappTabConsumer />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("set-tab-templates"));
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(firstCallArgString(replace)).toContain("tab=templates");
    expect(firstCallArgString(replace)).toContain("/settings/whatsapp?");
  });

  test("setActiveTab for optin calls router.replace with tab=optin", async () => {
    render(<WhatsappTabConsumer />);
    await act(async () => {
      fireEvent.click(screen.getByTestId("set-tab-optin"));
    });
    expect(replace).toHaveBeenCalledTimes(1);
    expect(firstCallArgString(replace)).toContain("tab=optin");
  });
});

describe("WhatsappTabNav — tab rendering", () => {
  beforeEach(() => {
    cleanup();
    currentSearchParams = new URLSearchParams("tab=templates");
  });

  afterEach(() => {
    cleanup();
  });

  test("renders all tab links with labels when permissions granted", () => {
    renderWithWrapper(<WhatsappTabNav activeTab="templates" pageLabels={labels} />, {
      locale,
      permissions: [
        AppPermission.WhatsappConfigManage,
        AppPermission.WhatsappTemplatesManage,
        AppPermission.WhatsappView,
        AppPermission.WhatsappInboxView,
      ],
    });
    expect(screen.getByText(labels.tabNumbers)).toBeTruthy();
    expect(screen.getByText(labels.tabTemplates)).toBeTruthy();
    expect(screen.getByText(labels.tabOptIn)).toBeTruthy();
    expect(screen.getByText(labels.tabInbox)).toBeTruthy();
  });

  test("hides the inbox tab when the user lacks WHATSAPP_INBOX_VIEW", () => {
    renderWithWrapper(<WhatsappTabNav activeTab="optin" pageLabels={labels} />, {
      locale,
      permissions: [AppPermission.WhatsappView],
    });
    expect(screen.queryByText(labels.tabInbox)).toBeNull();
    expect(screen.getByText(labels.tabOptIn)).toBeTruthy();
  });
});
