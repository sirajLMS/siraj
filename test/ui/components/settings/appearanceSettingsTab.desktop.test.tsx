import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "en";
const labels = readTranslation(Translation.Dashboard.Settings, locale).appearance;

import { APPEARANCE_PRESETS } from "@/frontend/common/providers/theme/presets";
import { DEFAULT_APPEARANCE_DRAFT } from "@/frontend/common/stores/appearancePreviewStore";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import { AppearanceSettingsTabDesktopView } from "@/frontend/desktop/views/dashboard/settings/tabs/appearance/appearanceSettingsTab.desktop";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function makeViewModel(overrides: Partial<AppearanceSettingsViewModel> = {}): AppearanceSettingsViewModel {
  return {
    labels,
    draft: DEFAULT_APPEARANCE_DRAFT,
    dirty: false,
    presetId: "default",
    presets: APPEARANCE_PRESETS,
    publishedMetaLabel: labels.lastPublishedBy("administrator", "2 days ago"),
    draftMetaLabel: labels.draftUpdatedJustNow,
    saveDraftLoading: false,
    publishLoading: false,
    resetLoading: false,
    resetDialogOpen: false,
    saveDraftDisabled: true,
    onEnterCustomizeMode: mock(() => {}),
    onApplyPreset: mock(() => {}),
    onSaveDraft: mock(async () => {}),
    onPublish: mock(async () => {}),
    onExportJson: mock(() => {}),
    onOpenResetDialog: mock(() => {}),
    onCloseResetDialog: mock(() => {}),
    onResetConfirm: mock(async () => {}),
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
});

describe("AppearanceSettingsTabDesktopView", () => {
  test("renders hero, status badges, brand colors, presets, and action buttons from the ViewModel", () => {
    renderWithWrapper(<AppearanceSettingsTabDesktopView {...makeViewModel()} />, { locale });

    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText(labels.subtitle)).toBeInTheDocument();
    expect(screen.getByText(labels.publishedBadge)).toBeInTheDocument();
    expect(screen.getByText(labels.draftBadge)).toBeInTheDocument();
    expect(screen.getByText(labels.currentBrandColors)).toBeInTheDocument();
    expect(screen.getByText(labels.quickPresets)).toBeInTheDocument();
    expect(screen.getByText(labels.lightMode)).toBeInTheDocument();
    expect(screen.getByText(labels.darkMode)).toBeInTheDocument();
    // Brand-color hex values from the draft snapshot (data, not translations).
    expect(screen.getByText(DEFAULT_APPEARANCE_DRAFT.colors.light.primaryMain)).toBeInTheDocument();
    expect(screen.getByText(DEFAULT_APPEARANCE_DRAFT.colors.dark.secondaryMain)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.enterCustomizeMode })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.saveDraft })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.publishNow })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.resetToDefaults })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.exportJson })).toBeInTheDocument();
  });

  test("disables Save Draft when saveDraftDisabled is true in the ViewModel", () => {
    renderWithWrapper(<AppearanceSettingsTabDesktopView {...makeViewModel()} />, { locale });

    expect(screen.getByRole("button", { name: labels.saveDraft })).toBeDisabled();
  });

  test("forwards Enter Customize Mode clicks to the ViewModel handler", () => {
    const onEnterCustomizeMode = mock(() => {});
    renderWithWrapper(<AppearanceSettingsTabDesktopView {...makeViewModel({ onEnterCustomizeMode })} />, { locale });

    fireEvent.click(screen.getByRole("button", { name: labels.enterCustomizeMode }));

    expect(onEnterCustomizeMode).toHaveBeenCalledTimes(1);
  });

  test("renders the reset confirmation dialog when resetDialogOpen is true", () => {
    renderWithWrapper(<AppearanceSettingsTabDesktopView {...makeViewModel({ resetDialogOpen: true })} />, {
      locale,
    });

    expect(screen.getByText(labels.resetConfirmTitle)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.resetConfirmConfirm })).toBeInTheDocument();
  });
});
