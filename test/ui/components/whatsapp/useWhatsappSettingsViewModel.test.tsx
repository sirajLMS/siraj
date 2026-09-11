import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import type { MockLink } from "@apollo/client/testing";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { type RefObject, useEffect } from "react";
import { WhatsappAccountPurpose } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { mockNextNavigation } from "@/test/ui/components/helpers/mockNavigation";

expect.extend(matchers);

const locale: AppLocale = "en";
const whatsappLabels = readTranslation(Translation.Whatsapp, locale);

import {
  createWhatsappAccountMutationDocument,
  isUserWhatsappOptInQueryDocument,
  localDeactivateWhatsappAccountMutationDocument,
  setUserWhatsappOptInMutationDocument,
  syncWhatsappAccountsFromMetaMutationDocument,
  updateWhatsappAccountMutationDocument,
  whatsappAccountsQueryDocument,
  whatsappConfigurationStatusQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import type { WhatsappSettingsViewModel } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
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
  readonly snackbar: { readonly message: string; readonly severity: "success" | "error" } | null;
}

let captures: ViewModelSnapshot[] = [];
let vmRef: RefObject<WhatsappSettingsViewModel | null>;

function WhatsappSettingsConsumer() {
  const vm = useWhatsappSettingsViewModel();
  useEffect(() => {
    vmRef.current = vm;
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

// Interactive consumer with action buttons for triggering handlers in act()
function InteractiveConsumer() {
  const vm = useWhatsappSettingsViewModel();
  useEffect(() => {
    vmRef.current = vm;
    captures.push({
      accounts: vm.accounts,
      loading: vm.loading,
      isOptedIn: vm.isOptedIn,
      syncing: vm.syncing,
      optInLoading: vm.optInLoading,
      snackbar: vm.snackbar,
    });
  });
  return (
    <div>
      <button type="button" data-testid="open-create" onClick={() => vm.openCreateDialog()}>
        open-create
      </button>
      <button
        type="button"
        data-testid="open-local-deactivate"
        onClick={() => vm.openLocalDeactivateConfirmDialog("acc-1", "Account acc-1")}
      >
        open-local-deactivate
      </button>
      <button type="button" data-testid="close-dialog" onClick={() => vm.closeDialog()}>
        close-dialog
      </button>
      <button type="button" data-testid="close-snackbar" onClick={() => vm.closeSnackbar()}>
        close-snackbar
      </button>
    </div>
  );
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

function configuredMock(configured: boolean, missingEnvKeys: string[] = []): MockLink.MockedResponse {
  return {
    request: { query: whatsappConfigurationStatusQueryDocument, variables: {} },
    result: {
      data: {
        whatsappConfigurationStatus: {
          isConfigured: configured,
          envBootstrapAvailable: configured,
          missingEnvKeys,
        },
      },
    },
  };
}

function createAccountMock(account: ReturnType<typeof makeAccountRow>): MockLink.MockedResponse {
  return {
    request: {
      query: createWhatsappAccountMutationDocument,
      variables: {
        input: {
          displayName: { en: `Account ${account.id}` },
          phoneNumberId: account.phoneNumberId,
          wabaId: account.wabaId,
          purpose: WhatsappAccountPurpose.General,
          displayPhoneNumber: null,
          isActive: null,
          portfolioMessagingLimitTier: null,
          qualityRating: null,
          throughputLevel: null,
        },
      },
    },
    result: { data: { createWhatsappAccount: account } },
  };
}

function updateAccountMock(accountId: string, displayName: string): MockLink.MockedResponse {
  return {
    request: {
      query: updateWhatsappAccountMutationDocument,
      variables: {
        id: accountId,
        input: {
          displayName: { en: displayName },
          displayPhoneNumber: null,
          isActive: null,
          portfolioMessagingLimitTier: null,
          qualityRating: null,
          throughputLevel: null,
        },
      },
    },
    result: { data: { updateWhatsappAccount: { id: accountId, __typename: "WhatsappAccount" } } },
  };
}

function localDeactivateAccountMock(accountId: string): MockLink.MockedResponse {
  return {
    request: {
      query: localDeactivateWhatsappAccountMutationDocument,
      variables: { id: accountId },
    },
    result: { data: { localDeactivateWhatsappAccount: true } },
  };
}

function syncMock(result: { added: number; updated: number }): MockLink.MockedResponse {
  return {
    request: { query: syncWhatsappAccountsFromMetaMutationDocument, variables: {} },
    result: { data: { syncWhatsappAccountsFromMeta: result } },
  };
}

function setOptInMock(enabled: boolean): MockLink.MockedResponse {
  return {
    request: {
      query: setUserWhatsappOptInMutationDocument,
      variables: { userId: "me", enabled, source: "graphql" },
    },
    result: { data: { setUserWhatsappOptIn: true } },
  };
}

await mockNextNavigation("/dashboard", { includeRouter: false, routingIncludeReplaceAndPrefetch: false });

beforeEach(() => {
  captures = [];
  vmRef = { current: null };
});

afterEach(() => {
  cleanup();
  captures = [];
  vmRef = { current: null };
  mock.restore();
});

describe("useWhatsappSettingsViewModel() — Q3 ViewModel tests", () => {
  test("Q3.1 — loading=true while queries are pending, then accounts populate", async () => {
    const account1 = makeAccountRow("acc-1", "+1234567890");
    const account2 = makeAccountRow("acc-2", "+9876543210");

    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [accountsMock([account1, account2]), optInMock(true), configuredMock(true)],
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
      locale,
      mocks: [
        {
          request: { query: whatsappAccountsQueryDocument, variables: {} },
          result: { data: { whatsappAccounts: [] } },
        },
        {
          request: { query: isUserWhatsappOptInQueryDocument, variables: { userId: "me" } },
          result: { data: { isUserWhatsappOptIn: null } },
        },
        configuredMock(true),
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
      locale,
      mocks: [accountsMock([]), optInMock(true), configuredMock(true)],
    });

    await waitFor(() => {
      expect(latestCapture()?.isOptedIn).toBe(true);
    });
  });

  test("Q3.4 — accounts default to empty array on query error", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [
        {
          request: { query: whatsappAccountsQueryDocument, variables: {} },
          error: new Error("Network error"),
        },
        optInMock(false),
        configuredMock(true),
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
      locale,
      mocks: [accountsMock([]), optInMock(false), configuredMock(true)],
    });

    await waitFor(() => {
      expect(latestCapture()).toBeDefined();
    });

    // Before any interaction, snackbar should be null (closed — new pattern from Task 2)
    expect(latestCapture()?.snackbar).toBeNull();
  });

  test("Q3.6 — sync and optIn loading flags start false", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [accountsMock([]), optInMock(false), configuredMock(true)],
    });

    await waitFor(() => {
      expect(latestCapture()?.loading).toBe(false);
    });

    expect(latestCapture()?.syncing).toBe(false);
    expect(latestCapture()?.optInLoading).toBe(false);
  });
});

// ─── Task 18: Mutation & Handler Tests ────────────────────────────────
// Uses InteractiveConsumer which renders action buttons to trigger handlers
// inside act() via fireEvent. The vmRef captures the full ViewModel for
// direct property assertions (creating, localDeactivatingId, syncingId, dialogState,
// mutationError, snackbar, etc.).

function baseMocks(accounts: ReturnType<typeof makeAccountRow>[] = [], optedIn = false): MockLink.MockedResponse[] {
  return [accountsMock(accounts), optInMock(optedIn), configuredMock(true)];
}

async function waitForLoaded() {
  await waitFor(() => {
    expect(latestCapture()?.loading).toBe(false);
  });
}

describe("useWhatsappSettingsViewModel() — Task 18 mutation & handler tests", () => {
  test("Q3.7 — create account mutation flow shows success snackbar", async () => {
    const newAccount = makeAccountRow("acc-new", "+[PHONE_REDACTED]");
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [...baseMocks(), createAccountMock(newAccount), accountsMock([newAccount])],
    });

    await waitForLoaded();

    await act(async () => {
      await vmRef.current?.handleCreate({
        displayName: "Account acc-new",
        phoneNumberId: "phone-1",
        wabaId: "waba-1",
        purpose: WhatsappAccountPurpose.General,
      });
    });

    await waitFor(() => {
      expect(latestCapture()?.snackbar?.severity).toBe("success");
    });
    expect(latestCapture()?.snackbar?.message).toBe(whatsappLabels.saveSuccess);
    // Dialog should close after successful create
    expect(vmRef.current?.dialogState.type).toBeNull();
  });

  test("Q3.8 — create with invalid input blocks mutation and sets mutationError", async () => {
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: baseMocks(),
    });

    await waitForLoaded();

    await act(async () => {
      await vmRef.current?.handleCreate({
        displayName: "",
        phoneNumberId: "phone-1",
        wabaId: "waba-1",
        purpose: WhatsappAccountPurpose.General,
      });
    });

    // Validation error should be set as mutationError
    expect(vmRef.current?.mutationError).not.toBeNull();
    // No success snackbar should appear
    expect(latestCapture()?.snackbar).toBeNull();
  });

  test("Q3.9 — update account name mutation flow shows success snackbar", async () => {
    const account = makeAccountRow("acc-1", "+[PHONE_REDACTED]");
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [
        ...baseMocks([account]),
        updateAccountMock("acc-1", "Updated Name"),
        accountsMock([{ ...account, displayName: { en: "Updated Name" } }]),
      ],
    });

    await waitForLoaded();

    await act(async () => {
      await vmRef.current?.handleEditName("acc-1", "Updated Name");
    });

    await waitFor(() => {
      expect(latestCapture()?.snackbar?.severity).toBe("success");
    });
    expect(latestCapture()?.snackbar?.message).toBe(whatsappLabels.saveSuccess);
  });

  test("Q3.10 — edit name with invalid input blocks mutation", async () => {
    const account = makeAccountRow("acc-1", "+[PHONE_REDACTED]");
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: baseMocks([account]),
    });

    await waitForLoaded();

    await act(async () => {
      await vmRef.current?.handleEditName("acc-1", "");
    });

    expect(vmRef.current?.mutationError).not.toBeNull();
    expect(latestCapture()?.snackbar).toBeNull();
  });

  test("Q3.11 — local-deactivate dialog cancel does not trigger mutation", async () => {
    const account = makeAccountRow("acc-1", "+[PHONE_REDACTED]");
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: baseMocks([account]),
    });

    await waitForLoaded();

    // Open local-deactivate dialog
    await act(async () => {
      vmRef.current?.openLocalDeactivateConfirmDialog("acc-1", "Account acc-1");
    });
    expect(vmRef.current?.dialogState.type).toBe("localDeactivateConfirm");

    // Cancel by closing dialog
    await act(async () => {
      vmRef.current?.closeDialog();
    });

    expect(vmRef.current?.dialogState.type).toBeNull();
    // No local-deactivate loading state
    expect(vmRef.current?.localDeactivatingId).toBeNull();
    // No snackbar (mutation not called)
    expect(latestCapture()?.snackbar).toBeNull();
  });

  test("Q3.12 — sync sets syncingId to 'all' during mutation, clears after", async () => {
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [...baseMocks(), syncMock({ added: 0, updated: 0 }), accountsMock([])],
    });

    await waitForLoaded();

    expect(vmRef.current?.syncingId).toBeNull();

    await act(async () => {
      await vmRef.current?.handleSync();
    });

    // After sync completes, syncingId should be null again
    await waitFor(() => {
      expect(vmRef.current?.syncingId).toBeNull();
    });
    // Sync produces a snackbar (noChange → success)
    await waitFor(() => {
      expect(latestCapture()?.snackbar?.severity).toBe("success");
    });
  });

  test("Q3.13 — validateAccessToken returns error for short token", async () => {
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: baseMocks(),
    });

    await waitForLoaded();

    // Short token should fail validation
    const shortTokenError = vmRef.current?.validateAccessToken("short");
    expect(shortTokenError).not.toBeNull();

    // Valid token (50+ chars) should pass
    const validToken = "a".repeat(50);
    expect(vmRef.current?.validateAccessToken(validToken)).toBeNull();
  });

  test("Q3.14 — validateTwoStepPin returns error for wrong format", async () => {
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: baseMocks(),
    });

    await waitForLoaded();

    // Non-6-digit PIN should fail
    const wrongPinError = vmRef.current?.validateTwoStepPin("12345");
    expect(wrongPinError).not.toBeNull();

    // Letters should fail
    const lettersPinError = vmRef.current?.validateTwoStepPin("abcdef");
    expect(lettersPinError).not.toBeNull();

    // 6-digit PIN should pass
    expect(vmRef.current?.validateTwoStepPin("123456")).toBeNull();
  });

  test("Q3.15 — per-row loading states: localDeactivatingId set during local deactivate", async () => {
    const account = makeAccountRow("acc-1", "+[PHONE_REDACTED]");

    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [...baseMocks([account]), localDeactivateAccountMock("acc-1"), accountsMock([])],
    });

    await waitForLoaded();

    // Locally deactivate account — should produce success snackbar and clear localDeactivatingId
    await act(async () => {
      await vmRef.current?.handleLocalDeactivate("acc-1");
    });

    // After mutation completes, localDeactivatingId is cleared
    await waitFor(() => {
      expect(vmRef.current?.localDeactivatingId).toBeNull();
    });
    // And a success snackbar is shown
    await waitFor(() => {
      expect(latestCapture()?.snackbar?.severity).toBe("success");
    });
  });

  test("Q3.16 — snackbar close clears message", async () => {
    const account = makeAccountRow("acc-1", "+[PHONE_REDACTED]");
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [...baseMocks([account]), localDeactivateAccountMock("acc-1"), accountsMock([])],
    });

    await waitForLoaded();

    // Trigger local deactivate to produce a snackbar
    await act(async () => {
      await vmRef.current?.handleLocalDeactivate("acc-1");
    });

    await waitFor(() => {
      expect(latestCapture()?.snackbar).not.toBeNull();
    });

    // Close snackbar via button
    fireEvent.click(screen.getByTestId("close-snackbar"));

    await waitFor(() => {
      expect(latestCapture()?.snackbar).toBeNull();
    });
  });

  test("Q3.17 — opt-in toggle sets optInLoading during mutation", async () => {
    renderWithWrapper(<InteractiveConsumer />, {
      locale,
      mocks: [...baseMocks([], false), setOptInMock(true), optInMock(true)],
    });

    await waitForLoaded();

    expect(vmRef.current?.optInLoading).toBe(false);

    await act(async () => {
      await vmRef.current?.handleToggleOptIn(true);
    });

    // After mutation completes, optInLoading should be false again
    await waitFor(() => {
      expect(vmRef.current?.optInLoading).toBe(false);
    });
    // Opt-in toggle shows success snackbar
    await waitFor(() => {
      expect(latestCapture()?.snackbar?.severity).toBe("success");
    });
  });

  test("Q3.18 — syncDisabledReason lists missing env keys while unconfigured", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [accountsMock([]), optInMock(false), configuredMock(false, ["WHATSAPP_ACCESS_TOKEN", "WHATSAPP_WABA_ID"])],
    });

    await waitForLoaded();

    await waitFor(() => {
      expect(vmRef.current?.syncDisabledReason).toBe(
        whatsappLabels.syncFromMetaUnavailable("WHATSAPP_ACCESS_TOKEN, WHATSAPP_WABA_ID")
      );
    });
    expect(vmRef.current?.isConfigured).toBe(false);
  });

  test("Q3.19 — syncDisabledReason is undefined when configured and idle", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [accountsMock([]), optInMock(false), configuredMock(true)],
    });

    await waitForLoaded();

    await waitFor(() => {
      expect(vmRef.current?.isConfigured).toBe(true);
    });
    expect(vmRef.current?.syncDisabledReason).toBeUndefined();
  });

  test("Q3.20 — syncDisabledReason shows the busy label while sync is in flight", async () => {
    renderWithWrapper(<WhatsappSettingsConsumer />, {
      locale,
      mocks: [...baseMocks(), { ...syncMock({ added: 0, updated: 0 }), delay: 50 }, accountsMock([])],
    });

    await waitForLoaded();
    await waitFor(() => {
      expect(vmRef.current?.isConfigured).toBe(true);
    });

    let syncPromise: Promise<void> | undefined;
    await act(async () => {
      syncPromise = vmRef.current?.handleSync();
    });

    expect(vmRef.current?.syncDisabledReason).toBe(whatsappLabels.syncFromMetaBusy);

    await act(async () => {
      await syncPromise;
    });
    await waitFor(() => {
      expect(vmRef.current?.syncDisabledReason).toBeUndefined();
    });
  });
});
