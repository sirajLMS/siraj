import { afterEach, describe, expect, mock, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, fireEvent, screen } from "@testing-library/react";

expect.extend(matchers);

import type { AppLocale } from "@/shared/locale/AppLocale";
import { readTranslation } from "@/shared/locale/client/translation-cache-store";
import { Translation } from "@/shared/locale/namespaces/translation";

const locale: AppLocale = "ar";
const labels = readTranslation(Translation.Dashboard.Settings, locale).appearance;

import { APPEARANCE_PRESETS } from "@/frontend/common/providers/theme/presets";
import { DEFAULT_APPEARANCE_DRAFT } from "@/frontend/common/stores/appearancePreviewStore";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";
import { AppearanceSettingsTabMobileView } from "@/frontend/mobile/views/dashboard/settings/tabs/appearance/appearanceSettingsTab.mobile";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function makeViewModel(overrides: Partial<AppearanceSettingsViewModel> = {}): AppearanceSettingsViewModel {
  return {
    labels,
    draft: DEFAULT_APPEARANCE_DRAFT,
    dirty: true,
    presetId: "default",
    presets: APPEARANCE_PRESETS,
    publishedMetaLabel: labels.lastPublishedBy("administrator", "2 days ago"),
    draftMetaLabel: labels.draftUpdatedJustNow,
    saveDraftLoading: false,
    publishLoading: false,
    resetLoading: false,
    resetDialogOpen: false,
    saveDraftDisabled: false,
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

describe("AppearanceSettingsTabMobileView", () => {
  test("renders hero, status badges, section panels, and action buttons from the ViewModel", () => {
    renderWithWrapper(<AppearanceSettingsTabMobileView {...makeViewModel()} />, { locale });

    expect(screen.getByText(labels.title)).toBeInTheDocument();
    expect(screen.getByText(labels.subtitle)).toBeInTheDocument();
    expect(screen.getByText(labels.publishedBadge)).toBeInTheDocument();
    expect(screen.getByText(labels.draftBadge)).toBeInTheDocument();
    expect(screen.getByText(labels.currentBrandColors)).toBeInTheDocument();
    expect(screen.getByText(labels.quickPresets)).toBeInTheDocument();
    expect(screen.getByText(APPEARANCE_PRESETS[0].name)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.enterCustomizeMode })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.saveDraft })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.publishNow })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.resetToDefaults })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.exportJson })).toBeInTheDocument();
  });

  test("enables Save Draft when saveDraftDisabled is false in the ViewModel", () => {
    renderWithWrapper(<AppearanceSettingsTabMobileView {...makeViewModel()} />, { locale });

    expect(screen.getByRole("button", { name: labels.saveDraft })).toBeEnabled();
  });

  test("forwards preset selection to the ViewModel onApplyPreset handler", () => {
    const onApplyPreset = mock(() => {});
    renderWithWrapper(<AppearanceSettingsTabMobileView {...makeViewModel({ onApplyPreset })} />, { locale });

    const presetName = APPEARANCE_PRESETS[1].name;
    fireEvent.click(screen.getByRole("button", { name: new RegExp(presetName) }));

    expect(onApplyPreset).toHaveBeenCalledWith(APPEARANCE_PRESETS[1]);
  });
});
