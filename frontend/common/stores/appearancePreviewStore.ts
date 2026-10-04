"use client";

import { create } from "zustand";
import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
import type { AppearancePresetId } from "@/frontend/common/providers/theme/presets";
import {
  createColorEditActions,
  createHistoryActions,
  createSessionActions,
  DEFAULT_APPEARANCE_DRAFT,
} from "@/frontend/common/stores/appearancePreviewStore.helpers";
import type { AppearancePreviewState } from "@/frontend/common/stores/appearancePreviewStore.types";

const initialState = {
  draft: DEFAULT_APPEARANCE_DRAFT,
  isCustomizeMode: false,
  // isDark must match defaultColorScheme so the customizer starts in the same
  // mode as the app (dark by default), not always light.
  isDark: DEFAULT_APPEARANCE_DRAFT.defaultColorScheme === "dark",
  presetId: "default" as AppearancePresetId,
  hydrated: false,
  dirty: false,
  resetDialogOpen: false,
  past: [] as ReadonlyArray<AppearanceDraftInput>,
  future: [] as ReadonlyArray<AppearanceDraftInput>,
  lastPublished: null,
};

export const useAppearancePreviewStore = create<AppearancePreviewState>((set, get) => ({
  ...initialState,
  ...createColorEditActions(set, get),
  ...createSessionActions(set, get),
  ...createHistoryActions(set, get),
}));
