import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import {
  WhatsappAccountPurpose,
  WhatsappOnboardingMode,
  WhatsappSyncStatus,
} from "@/frontend/common/graphql/generated/gql/graphql";
import {
  NumberCardContent,
  type NumberCardSyncProps,
} from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/NumberCardContent";
import type { WhatsappAccountRow } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { makeAccountRow } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const localeEn: AppLocale = "en";
const labelsEn = readTranslation(Translation.Whatsapp, localeEn);

function accountWith(overrides: Partial<WhatsappAccountRow> = {}): WhatsappAccountRow {
  return { ...makeAccountRow("acc-1", "+555000111"), ...overrides };
}

function renderCard(account: WhatsappAccountRow, locale: AppLocale = "en", sync: NumberCardSyncProps = {}) {
  return renderWithWrapper(
    <NumberCardContent account={account} labels={readTranslation(Translation.Whatsapp, locale)} {...sync} />,
    {
      locale,
    }
  );
}

describe("NumberCardContent — purpose chip", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders the localized purpose chip for a general account", () => {
    renderCard(accountWith({ purpose: WhatsappAccountPurpose.General }));
    expect(screen.getByText(labelsEn.purposeGeneral)).toBeTruthy();
  });

  test("renders the advertising purpose chip in English", () => {
    renderCard(accountWith({ purpose: WhatsappAccountPurpose.Advertising }));
    expect(screen.getByText(labelsEn.purposeAdvertising)).toBeTruthy();
  });

  test("renders the students purpose chip translated in RTL (ar) locale", () => {
    const labels = readTranslation(Translation.Whatsapp, "ar");
    renderCard(accountWith({ purpose: WhatsappAccountPurpose.Students }), "ar");
    expect(screen.getByText(labels.purposeStudents)).toBeTruthy();
  });

  test("renders the cloud-API onboarding mode chip without restrictions hint", () => {
    renderCard(accountWith({ onboardingMode: WhatsappOnboardingMode.CloudApi }));
    expect(screen.getByText(labelsEn.onboardingModeCloudApi)).toBeTruthy();
    expect(screen.queryByTitle(labelsEn.coexistenceRestrictionsHint)).toBeNull();
  });
});

function renderCoexistenceCard(syncStatus: WhatsappSyncStatus, syncProgress: number) {
  renderCard(accountWith({ onboardingMode: WhatsappOnboardingMode.Coexistence, syncStatus, syncProgress }));
}

describe("NumberCardContent — coexistence sync state", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("coexistence account shows the restrictions hint icon and cloud chip is absent", () => {
    renderCard(accountWith({ onboardingMode: WhatsappOnboardingMode.Coexistence }));
    expect(screen.getByText(labelsEn.onboardingModeCoexistence)).toBeTruthy();
    expect(screen.getByTitle(labelsEn.coexistenceRestrictionsHint)).toBeTruthy();
  });

  test("sync in progress shows the syncing badge and percentage (LTR layout-safe)", () => {
    renderCoexistenceCard(WhatsappSyncStatus.Syncing, 42);
    expect(screen.getByText(labelsEn.syncStatusSyncing)).toBeTruthy();
    expect(screen.getByText(labelsEn.syncProgress(42))).toBeTruthy();
  });

  test("completed sync shows the complete badge and success summary panel", () => {
    renderCoexistenceCard(WhatsappSyncStatus.Complete, 100);
    expect(screen.getAllByText(labelsEn.syncStatusComplete).length).toBeGreaterThan(0);
    expect(screen.queryByText(labelsEn.syncProgress(100))).toBeNull();
  });

  test("failed sync shows the failed badge and error panel", () => {
    renderCoexistenceCard(WhatsappSyncStatus.Failed, 10);
    expect(screen.getAllByText(labelsEn.syncStatusFailed).length).toBeGreaterThan(0);
  });

  test("failed sync humanizes the history-declined reason", () => {
    renderCard(
      accountWith({ onboardingMode: WhatsappOnboardingMode.Coexistence, syncStatus: WhatsappSyncStatus.Failed }),
      "en",
      { syncFailureReason: "historyDeclined" }
    );
    expect(screen.getByText(labelsEn.syncHistoryDeclined)).toBeTruthy();
    expect(screen.getByText(labelsEn.syncDeclinedGuidance)).toBeTruthy();
  });

  test("failed sync shows an unknown reason code under the failed title", () => {
    renderCard(
      accountWith({ onboardingMode: WhatsappOnboardingMode.Coexistence, syncStatus: WhatsappSyncStatus.Failed }),
      "en",
      { syncFailureReason: "syncDeadlineExpired" }
    );
    expect(screen.getByText("syncDeadlineExpired")).toBeTruthy();
  });

  test("failed sync wires the retry affordance to re-run embedded signup", async () => {
    let retried = 0;
    renderCard(
      accountWith({ onboardingMode: WhatsappOnboardingMode.Coexistence, syncStatus: WhatsappSyncStatus.Failed }),
      "en",
      {
        onRetrySetup: () => {
          retried += 1;
        },
      }
    );
    const retryButton = screen.getByRole("button", { name: labelsEn.connectBusinessApp });
    retryButton.click();
    await Promise.resolve();
    expect(retried).toBe(1);
  });

  test("failed sync hides the retry affordance when the tab did not wire one", () => {
    renderCoexistenceCard(WhatsappSyncStatus.Failed, 10);
    expect(screen.queryByRole("button", { name: labelsEn.connectBusinessApp })).toBeNull();
  });

  test("syncing shows the phase line and a future deadline hint", () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    renderCard(
      accountWith({
        onboardingMode: WhatsappOnboardingMode.Coexistence,
        syncStatus: WhatsappSyncStatus.Syncing,
        syncProgress: 42,
        syncPhase: 2,
      }),
      "en",
      { syncDeadlineAt: deadline }
    );
    expect(screen.getByText(labelsEn.syncPhaseLabel(2))).toBeTruthy();
    expect(screen.getByText(labelsEn.syncDeadlineHint(new Date(deadline).toLocaleString()))).toBeTruthy();
  });

  test("cloud-api account hides the sync status row entirely", () => {
    renderCard(accountWith({ onboardingMode: WhatsappOnboardingMode.CloudApi }));
    expect(screen.queryByText(labelsEn.syncStatusLabel)).toBeNull();
  });

  test("coexistence sync area renders translated labels in RTL locale", () => {
    renderCard(
      {
        ...makeAccountRow("acc-ar", "+555000222"),
        onboardingMode: WhatsappOnboardingMode.Coexistence,
        syncStatus: WhatsappSyncStatus.Syncing,
        syncProgress: 65,
      },
      "ar"
    );
    expect(screen.getByText(readTranslation(Translation.Whatsapp, "ar").syncStatusLabel)).toBeTruthy();
    expect(screen.getByText(readTranslation(Translation.Whatsapp, "ar").syncProgress(65))).toBeTruthy();
  });
});
