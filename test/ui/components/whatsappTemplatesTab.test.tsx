import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { TemplatesTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent";
import type { WhatsappSettingsLabels } from "@/frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes";
import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";
import { makeTemplateRow } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Whatsapp, locale);

const settingsLabels: WhatsappSettingsLabels = {
  page: labels,
  notifications: {
    syncSuccess: labels.syncSuccess,
    syncNoChange: labels.syncNoChange,
    syncError: labels.syncError,
    deleteSuccess: labels.deleteSuccess,
    deleteError: labels.deleteError,
    saveSuccess: labels.saveSuccess,
    saveError: labels.saveError,
    optInSuccess: "Opt-in updated successfully.",
    optInError: labels.optInError,
  },
};

const noopPromise = (): Promise<void> => Promise.resolve();

function renderTemplatesTab(overrides: Record<string, unknown> = {}) {
  const onSyncFromMeta = mock(noopPromise);
  const onRetry = mock(() => {});
  renderWithWrapper(
    <TemplatesTabContent
      labels={settingsLabels}
      templates={[]}
      loading={false}
      syncing={false}
      onSyncFromMeta={onSyncFromMeta}
      isConfigured
      queryError={false}
      onRetry={onRetry}
      {...overrides}
    />,
    { locale, permissions: [AppPermission.WhatsappTemplatesManage] }
  );
  return { onSyncFromMeta, onRetry };
}

describe("TemplatesTabContent", () => {
  beforeEach(() => {
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders persisted templates from props data", () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    const t2 = makeTemplateRow("tpl-2", "Order Confirmation");
    renderTemplatesTab({ templates: [t1, t2] });
    expect(screen.getByText("Welcome Message")).toBeTruthy();
    expect(screen.getByText("Order Confirmation")).toBeTruthy();
  });

  test("shows language/category labeled values and localized status badge", () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderTemplatesTab({ templates: [t1] });
    // Labeled Typography pairs replace the old raw Chips
    expect(screen.getByText(labels.templateLanguage)).toBeTruthy();
    expect(screen.getByText(t1.language ?? "")).toBeTruthy();
    expect(screen.getByText(labels.templateCategory)).toBeTruthy();
    expect(screen.getByText(t1.category ?? "")).toBeTruthy();
    // Status badge shows the localized status label
    expect(screen.getByText(labels.templateStatusApproved)).toBeTruthy();
  });

  test("shows empty state with sync CTA when no templates", () => {
    renderTemplatesTab({ templates: [] });
    expect(screen.getByText(labels.noTemplates)).toBeTruthy();
    // syncTemplates text appears in both the header Sync button and the empty-state CTA button
    const syncButtons = screen.getAllByText(labels.syncTemplates);
    expect(syncButtons.length).toBeGreaterThanOrEqual(2);
  });

  test("body preview expands when card clicked", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderTemplatesTab({ templates: [t1] });
    // The card action area — click it
    const cardActionArea = screen.getByLabelText(`Welcome Message — ${labels.templateBody}`);
    await act(async () => {
      fireEvent.click(cardActionArea);
    });
    // After expansion, the "Last Updated" label should be visible (it's in the Collapse section)
    await waitFor(() => {
      expect(screen.getAllByText(labels.templateLastUpdated).length).toBeGreaterThan(0);
    });
  });

  test("error state shows retry button", () => {
    renderTemplatesTab({ queryError: true });
    expect(screen.getByText(labels.errorGenericTitle)).toBeTruthy();
    expect(screen.getByText(labels.retry)).toBeTruthy();
  });

  test("retry button calls onRetry", async () => {
    const { onRetry } = renderTemplatesTab({ queryError: true });
    await act(async () => {
      fireEvent.click(screen.getByText(labels.retry));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("sync button calls onSyncFromMeta", async () => {
    const { onSyncFromMeta } = renderTemplatesTab({ templates: [] });
    await act(async () => {
      // There are two sync buttons in empty state: header + CTA. Click the first one.
      fireEvent.click(screen.getAllByText(labels.syncTemplates)[0]);
    });
    expect(onSyncFromMeta).toHaveBeenCalledTimes(1);
  });

  test("loading state shows CircularProgress", () => {
    renderTemplatesTab({ loading: true, syncing: false });
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  test("shows permission denied fallback when user lacks WhatsappTemplatesManage", () => {
    // Render with no permissions for the empty state CTA
    renderWithWrapper(
      <TemplatesTabContent
        labels={settingsLabels}
        templates={[]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale, permissions: [] }
    );
    // Should show permission denied text since no WhatsappTemplatesManage
    expect(screen.getByText(labels.permissionDenied)).toBeTruthy();
  });
});
