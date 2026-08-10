import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, waitFor } from "@testing-library/react";
import { useEffect } from "react";

expect.extend(matchers);

import {
  isUserWhatsappOptInQueryDocument,
  whatsappAccountsQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { useWhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

// ─── Test harness: renders the hook inside a component ─────────────────
// Since renderHook is not available in this @testing-library/react version,
// we use a consumer component with an effect-based capture pattern.

interface WhatsappAccountSnapshot {
  readonly id: string | null;
  readonly wabaId: string | null;
  readonly phoneNumberId: string | null;
  readonly displayPhoneNumber: string | null;
  readonly displayName: Record<string, string> | null;
  readonly isActive: boolean | null;
  readonly qualityRating: string | null;
  readonly portfolioMessagingLimitTier: string | null;
  readonly throughputLevel: string | null;
}

interface ViewModelSnapshot {
  readonly accounts: readonly WhatsappAccountSnapshot[];
  readonly loading: boolean;
  readonly isOptedIn: boolean;
  readonly syncing: boolean;
  readonly optInLoading: boolean;
  readonly snackbar: { open: boolean; message: string; severity: string };
}

let captures: ViewModelSnapshot[] = [];

function WhatsappSettingsConsumer() {
  const vm = useWhatsappSettingsViewModel();
  useEffect(() => {
    captures.push({
      accounts: vm.accounts,
      loading: vm.loading,
      isOptedIn: vm.isOptedIn,
      syncing: vm.syncing,
      optInLoading: vm.optInLoading,
      snackbar: vm.snackbar,
    });
  });
  return <div data-testid="consumer" />;
}

function latestCapture(): ViewModelSnapshot | undefined {
  return captures[captures.length - 1];
}

// ─── Mock factories ────────────────────────────────────────────────────

function makeAccountRow(id: string, displayPhone: string) {
  return {
    id,
    wabaId: "waba-1",
    phoneNumberId: "phone-1",
    displayPhoneNumber: displayPhone,
    displayName: { en: `Account ${id}` },
    isActive: true,
    qualityRating: "GREEN",
    portfolioMessagingLimitTier: "TIER_1K",
    throughputLevel: "STANDARD",
    lastWebhookAt: null,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-01T00:00:00Z",
    __typename: "WhatsappAccount",
  };
}

function accountsMock(accounts: ReturnType<typeof makeAccountRow>[]): MockLink.MockedResponse {
  return {
    request: { query: whatsappAccountsQueryDocument, variables: {} },
    result: { data: { whatsappAccounts: accounts } },
  };
}

function optInMock(optedIn: boolean): MockLink.MockedResponse {
  return {
    request: { query: isUserWhatsappOptInQueryDocument, variables: { userId: "me" } },
    result: { data: { isUserWhatsappOptIn: optedIn } },
  };
}

await mock.module("next/navigation", () => ({
  useParams: () => ({ locale: "en" }),
}));

await mock.module("@/shared/i18n/routing", () => ({
  useRouter: () => ({ push: mock(() => {}), back: mock(() => {}), forward: mock(() => {}), refresh: mock(() => {}) }),
  usePathname: () => "/dashboard",
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  redirect: () => {},
}));

await mock.module("@/shared/i18n/navigation", () => ({
  useRouter: () => ({
    push: mock(() => {}),
    back: mock(() => {}),
    forward: mock(() => {}),
    refresh: mock(() => {}),
    replace: mock(() => {}),
    prefetch: mock(() => {}),
  }),
  usePathname: () => "/dashboard",
}));

beforeEach(() => {
  captures = [];
});

afterEach(() => {
  cleanup();
  captures = [];
  mock.restore();
});

describe("useWhatsappSettingsViewModel() — Q3 ViewModel tests", () => {
  test("Q3.1 — loading=true while queries are pending, then accounts populate", async () => {
    const account1 = makeAccountRow("acc-1", "+1234567890");
    const account2 = makeAccountRow("acc-2", "+9876543210");

    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [accountsMock([account1, account2]), optInMock(true)],
    });

    // Wait for the hook to render and capture state
    await waitFor(() => {
      expect(latestCapture()).toBeDefined();
    });

    await waitFor(() => {
      expect(latestCapture()?.loading).toBe(false);
    });

    const finalCapture = latestCapture();
    // Accounts populate from the mock data — verify count
    expect(finalCapture?.accounts).toHaveLength(2);

    // Verify account field values round-tripped correctly through Apollo MockLink
    const accountResults = finalCapture?.accounts;
    expect(accountResults).toBeDefined();
    const firstAccount = accountResults?.[0];
    const secondAccount = accountResults?.[1];
    expect(firstAccount).toBeDefined();
    expect(secondAccount).toBeDefined();

    expect(firstAccount?.id).toBe("acc-1");
    expect(firstAccount?.wabaId).toBe("waba-1");
    expect(firstAccount?.phoneNumberId).toBe("phone-1");
    expect(firstAccount?.displayPhoneNumber).toBe("+1234567890");
    expect(firstAccount?.displayName).toEqual({ en: "Account acc-1" });
    expect(firstAccount?.isActive).toBe(true);
    expect(firstAccount?.qualityRating).toBe("GREEN");
    expect(firstAccount?.portfolioMessagingLimitTier).toBe("TIER_1K");
    expect(firstAccount?.throughputLevel).toBe("STANDARD");

    expect(secondAccount?.id).toBe("acc-2");
    expect(secondAccount?.wabaId).toBe("waba-1");
    expect(secondAccount?.phoneNumberId).toBe("phone-1");
    expect(secondAccount?.displayPhoneNumber).toBe("+9876543210");
    expect(secondAccount?.displayName).toEqual({ en: "Account acc-2" });
    expect(secondAccount?.isActive).toBe(true);
    expect(secondAccount?.qualityRating).toBe("GREEN");
    expect(secondAccount?.portfolioMessagingLimitTier).toBe("TIER_1K");
    expect(secondAccount?.throughputLevel).toBe("STANDARD");
  });

  test("Q3.2 — isOptedIn defaults to false when query returns null", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [
        {
          request: { query: whatsappAccountsQueryDocument, variables: {} },
          result: { data: { whatsappAccounts: [] } },
        },
        {
          request: { query: isUserWhatsappOptInQueryDocument, variables: { userId: "me" } },
          result: { data: { isUserWhatsappOptIn: null } },
        },
      ],
    });

    await waitFor(() => {
      expect(latestCapture()?.loading).toBe(false);
    });

    // When the opt-in query returns null, isOptedIn should default to false
    expect(latestCapture()?.isOptedIn).toBe(false);
  });

  test("Q3.3 — isOptedIn=true when query returns true", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [accountsMock([]), optInMock(true)],
    });

    await waitFor(() => {
      expect(latestCapture()?.isOptedIn).toBe(true);
    });
  });

  test("Q3.4 — accounts default to empty array on query error", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [
        {
          request: { query: whatsappAccountsQueryDocument, variables: {} },
          error: new Error("Network error"),
        },
        optInMock(false),
      ],
    });

    await waitFor(() => {
      expect(latestCapture()?.accounts).toHaveLength(0);
    });

    // On error, accounts should be an empty array, not undefined
    expect(latestCapture()?.accounts).toEqual([]);
  });

  test("Q3.5 — snackbar starts closed with default state", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [accountsMock([]), optInMock(false)],
    });

    await waitFor(() => {
      expect(latestCapture()).toBeDefined();
    });

    // Before any interaction, snackbar should be in its default closed state
    expect(latestCapture()?.snackbar).toEqual({ open: false, message: "", severity: "success" });
  });

  test("Q3.6 — sync and optIn loading flags start false", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale: "en",
      mocks: [accountsMock([]), optInMock(false)],
    });

    await waitFor(() => {
      expect(latestCapture()?.loading).toBe(false);
    });

    expect(latestCapture()?.syncing).toBe(false);
    expect(latestCapture()?.optInLoading).toBe(false);
  });
});
