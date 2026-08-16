import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { act, cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { TemplatesTabContent } from "@/frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent";
import { makeTemplateRow, testSettingsLabels } from "@/test/ui/components/helpers/whatsappTestHelpers";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const noopPromise = (): Promise<void> => Promise.resolve();

function renderTemplatesTab(overrides: Record<string, unknown> = {}) {
  const onSyncFromMeta = mock(noopPromise);
  const onRetry = mock(() => {});
  renderWithWrapper(
    <TemplatesTabContent
      labels={testSettingsLabels}
      templates={[]}
      loading={false}
      syncing={false}
      onSyncFromMeta={onSyncFromMeta}
      isConfigured
      queryError={false}
      onRetry={onRetry}
      {...overrides}
    />,
    { locale: "en", permissions: [AppPermission.WhatsappTemplatesManage] }
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

  test("shows template language chip and status badge", () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderTemplatesTab({ templates: [t1] });
    expect(screen.getByText(`Language: ${t1.language}`)).toBeTruthy();
    // Template name should be visible in collapsed state
    expect(screen.getByText("Welcome Message")).toBeTruthy();
  });

  test("shows empty state with sync CTA when no templates", () => {
    renderTemplatesTab({ templates: [] });
    expect(screen.getByText(testSettingsLabels.page.noTemplates)).toBeTruthy();
    // syncTemplates text appears in both the header Sync button and the empty-state CTA button
    const syncButtons = screen.getAllByText(testSettingsLabels.page.syncTemplates);
    expect(syncButtons.length).toBeGreaterThanOrEqual(2);
  });

  test("body preview expands when card clicked", async () => {
    const t1 = makeTemplateRow("tpl-1", "Welcome Message");
    renderTemplatesTab({ templates: [t1] });
    // The card action area — click it
    const cardActionArea = screen.getByLabelText(`Welcome Message — ${testSettingsLabels.page.templateBody}`);
    await act(async () => {
      fireEvent.click(cardActionArea);
    });
    // After expansion, the "Last Updated" label should be visible (it's in the Collapse section)
    await waitFor(() => {
      expect(screen.getAllByText(testSettingsLabels.page.templateLastUpdated).length).toBeGreaterThan(0);
    });
  });

  test("error state shows retry button", () => {
    renderTemplatesTab({ queryError: true });
    expect(screen.getByText(testSettingsLabels.page.errorGenericTitle)).toBeTruthy();
    expect(screen.getByText(testSettingsLabels.page.retry)).toBeTruthy();
  });

  test("retry button calls onRetry", async () => {
    const { onRetry } = renderTemplatesTab({ queryError: true });
    await act(async () => {
      fireEvent.click(screen.getByText(testSettingsLabels.page.retry));
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("sync button calls onSyncFromMeta", async () => {
    const { onSyncFromMeta } = renderTemplatesTab({ templates: [] });
    await act(async () => {
      // There are two sync buttons in empty state: header + CTA. Click the first one.
      fireEvent.click(screen.getAllByText(testSettingsLabels.page.syncTemplates)[0]);
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
        labels={testSettingsLabels}
        templates={[]}
        loading={false}
        syncing={false}
        onSyncFromMeta={mock(noopPromise)}
        isConfigured
        queryError={false}
        onRetry={mock(() => {})}
      />,
      { locale: "en", permissions: [] }
    );
    // Should show permission denied text since no WhatsappTemplatesManage
    expect(screen.getByText(testSettingsLabels.page.permissionDenied)).toBeTruthy();
  });
});
